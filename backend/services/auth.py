import sqlite3
import secrets
import hashlib
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app, g
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

def get_db():
    conn = sqlite3.connect(current_app.config['DATABASE_PATH'], timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

def hash_token(token):
    return hashlib.sha256(token.encode('utf-8')).hexdigest()

def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    token_hash = hash_token(token)
    
    with get_db() as conn:
        session = conn.execute(
            "SELECT user_id, expires_at FROM sessions WHERE token_hash = ? AND revoked_at IS NULL", 
            (token_hash,)
        ).fetchone()
        
        if not session:
            return None
            
        if datetime.fromisoformat(session['expires_at'].replace('Z', '+00:00')).replace(tzinfo=None) < datetime.utcnow():
            return None
            
        user = conn.execute("SELECT * FROM users WHERE id = ? AND is_active = 1", (session['user_id'],)).fetchone()
        
        if user:
            # Update last seen
            conn.execute("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?", 
                        (datetime.utcnow().isoformat() + 'Z', token_hash))
            conn.commit()
            return dict(user)
    return None

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'error': 'UNAUTHORIZED', 'message': 'Authentication required'}), 401
        g.user = user
        return f(*args, **kwargs)
    return decorated

def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({'error': 'UNAUTHORIZED', 'message': 'Authentication required'}), 401
            if user['role'] not in roles:
                return jsonify({'error': 'FORBIDDEN', 'message': 'Insufficient permissions'}), 403
            g.user = user
            return f(*args, **kwargs)
        return decorated
    return decorator

def log_audit(conn, event_type, user_id, details):
    conn.execute(
        "INSERT INTO audit_logs (timestamp, event_type, user_id, details) VALUES (?, ?, ?, ?)",
        (datetime.utcnow().isoformat() + 'Z', event_type, user_id, details)
    )

@auth_bp.route('/setup', methods=['POST'])
def setup_admin():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('full_name', 'Administrator')
    
    if not username or not password or len(password) < 8:
        return jsonify({'error': 'BAD_REQUEST', 'message': 'Invalid username or password too short (min 8 chars)'}), 400
        
    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if count > 0:
            return jsonify({'error': 'FORBIDDEN', 'message': 'Setup already completed'}), 403
            
        pwd_hash = generate_password_hash(password)
        cursor = conn.execute('''
            INSERT INTO users (username, password_hash, role, full_name, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (username, pwd_hash, 'ADMIN', full_name, datetime.utcnow().isoformat() + 'Z'))
        user_id = cursor.lastrowid
        
        log_audit(conn, 'USER_CREATED', user_id, f"Admin account created: {username}")
        conn.commit()
        
    return jsonify({'message': 'Admin account created successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'BAD_REQUEST', 'message': 'Username and password required'}), 400
        
    with get_db() as conn:
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        
        if not user:
            log_audit(conn, 'LOGIN_FAILURE', None, f"Unknown user: {username}")
            conn.commit()
            return jsonify({'error': 'UNAUTHORIZED', 'message': 'Invalid credentials'}), 401
            
        if not user['is_active']:
            log_audit(conn, 'LOGIN_FAILURE', user['id'], "Account disabled")
            conn.commit()
            return jsonify({'error': 'FORBIDDEN', 'message': 'Account is disabled'}), 403
            
        if user['locked_until'] and datetime.fromisoformat(user['locked_until'].replace('Z', '+00:00')).replace(tzinfo=None) > datetime.utcnow():
            return jsonify({'error': 'FORBIDDEN', 'message': 'Account temporarily locked due to too many failed attempts'}), 403
            
        if not check_password_hash(user['password_hash'], password):
            attempts = user['failed_attempts'] + 1
            locked_until = None
            if attempts >= 5:
                locked_until = (datetime.utcnow() + timedelta(minutes=15)).isoformat() + 'Z'
                log_audit(conn, 'ACCOUNT_LOCKED', user['id'], "Too many failed attempts")
                
            conn.execute("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?", (attempts, locked_until, user['id']))
            log_audit(conn, 'LOGIN_FAILURE', user['id'], "Invalid password")
            conn.commit()
            return jsonify({'error': 'UNAUTHORIZED', 'message': 'Invalid credentials'}), 401
            
        # Success
        conn.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?", 
                    (datetime.utcnow().isoformat() + 'Z', user['id']))
                    
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        conn.execute('''
            INSERT INTO sessions (user_id, token_hash, created_at, expires_at)
            VALUES (?, ?, ?, ?)
        ''', (user['id'], hash_token(token), datetime.utcnow().isoformat() + 'Z', expires_at.isoformat() + 'Z'))
        
        log_audit(conn, 'LOGIN_SUCCESS', user['id'], "Successful login")
        conn.commit()
        
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'full_name': user['full_name'],
                'role': user['role']
            }
        })

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_me():
    return jsonify({
        'id': g.user['id'],
        'username': g.user['username'],
        'full_name': g.user['full_name'],
        'role': g.user['role']
    })

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    auth_header = request.headers.get('Authorization')
    token = auth_header.split(' ')[1]
    token_hash = hash_token(token)
    
    with get_db() as conn:
        conn.execute("UPDATE sessions SET revoked_at = ? WHERE token_hash = ?", 
                    (datetime.utcnow().isoformat() + 'Z', token_hash))
        log_audit(conn, 'LOGOUT', g.user['id'], "User logged out")
        conn.commit()
        
    return jsonify({'message': 'Logged out successfully'})

@auth_bp.route('/users', methods=['GET'])
@role_required(['ADMIN'])
def list_users():
    with get_db() as conn:
        users = conn.execute("SELECT id, username, full_name, role, is_active, created_at, last_login_at FROM users").fetchall()
        return jsonify([dict(u) for u in users])
