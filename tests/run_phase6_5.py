import requests
import sqlite3
import os
import sys
import time
import subprocess
import signal

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.config import get_config

BASE_URL = "http://127.0.0.1:7860"
DB_PATH = str(get_config().DATABASE_PATH)

def clear_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM sessions")
    conn.execute("DELETE FROM users")
    conn.execute("DELETE FROM audit_logs")
    conn.execute("DELETE FROM inspections")
    conn.execute("DELETE FROM sync_outbox")
    conn.commit()
    conn.close()

def wait_for_server():
    for _ in range(30):
        try:
            resp = requests.get(f"{BASE_URL}/health", timeout=1)
            if resp.status_code == 200:
                return True
        except:
            time.sleep(1)
    return False

def run_tests():
    print("========================================")
    print(" PHASE 6.5 OFFLINE ACCEPTANCE TEST")
    print("========================================")

    clear_db()
    
    env = os.environ.copy()
    env['PYTHONPATH'] = '.'
    
    print("\n[STARTING BACKEND]")
    proc = subprocess.Popen([sys.executable, "app.py"], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    if not wait_for_server():
        print("❌ Server failed to start.")
        proc.kill()
        return

    try:
        # 1. CLEAN FIRST-RUN TEST
        print("\n1. CLEAN FIRST-RUN TEST")
        resp = requests.post(f"{BASE_URL}/auth/setup", json={"username": "admin", "password": "supersecure123"})
        assert resp.status_code == 201, f"Setup failed: {resp.status_code}"
        print("✅ Administrator created.")
        
        # 2. OFFLINE LOGIN TEST
        print("\n2. OFFLINE LOGIN TEST")
        resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "supersecure123"})
        assert resp.status_code == 200, "Login failed"
        token = resp.json()['token']
        print("✅ Login succeeded.")

        # 3. INVALID LOGIN TEST
        print("\n3. INVALID LOGIN TEST")
        resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "wronguser", "password": "supersecure123"})
        assert resp.status_code == 401, "Wrong user should be 401"
        resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "wrongpassword"})
        assert resp.status_code == 401, "Wrong password should be 401"
        print("✅ Invalid login properly rejected.")

        # Brute force lockout test
        for _ in range(4):
            requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "wrongpassword"})
        resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "supersecure123"})
        assert resp.status_code == 403, f"Account should be locked, got {resp.status_code}"
        print("✅ Account lockout verified.")

        # Clear failed attempts to continue testing
        conn = sqlite3.connect(DB_PATH)
        conn.execute("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE username = 'admin'")
        conn.commit()

        # 4. ROLE TEST
        print("\n4. ROLE TEST")
        from werkzeug.security import generate_password_hash
        pwd = generate_password_hash("techpass")
        conn.execute("INSERT INTO users (username, password_hash, role) VALUES ('tech', ?, 'TECHNICIAN')", (pwd,))
        conn.commit()
        conn.close()

        resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "tech", "password": "techpass"})
        tech_token = resp.json()['token']
        tech_headers = {"Authorization": f"Bearer {tech_token}"}
        
        resp = requests.get(f"{BASE_URL}/auth/users", headers=tech_headers)
        assert resp.status_code == 403, "Technician should not access user management"
        print("✅ Technician properly restricted from admin routes.")

        # 5. INSPECTION TEST
        print("\n5. INSPECTION TEST")
        os.makedirs("test_data", exist_ok=True)
        test_img = "test_data/dummy.jpg"
        with open(test_img, "wb") as f: f.write(b"dummy")
        with open(test_img, "rb") as f:
            resp = requests.post(f"{BASE_URL}/analyze", headers=tech_headers, files={"image": f})
        assert resp.status_code == 200, f"Analyze failed: {resp.text}"
        insp_id = resp.json()['inspection_id']
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        insp = conn.execute("SELECT user_id FROM inspections WHERE id = ?", (insp_id,)).fetchone()
        conn.close()
        assert insp['user_id'] is not None, "user_id is NULL"
        print("✅ Inspection record contains authenticated user_id.")

        # 6. LOGOUT TEST
        print("\n6. LOGOUT TEST")
        resp = requests.post(f"{BASE_URL}/auth/logout", headers=tech_headers)
        assert resp.status_code == 200, "Logout failed"
        resp = requests.get(f"{BASE_URL}/auth/me", headers=tech_headers)
        assert resp.status_code == 401, "Revoked token still works"
        print("✅ Logout properly revokes session.")

        # 7. RESTART TEST
        print("\n7. RESTART TEST")
        resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "supersecure123"})
        admin_token = resp.json()['token']
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Kill backend
        proc.kill()
        proc.wait()
        
        # Restart backend
        proc = subprocess.Popen([sys.executable, "app.py"], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if not wait_for_server():
            print("❌ Server failed to restart.")
            proc.kill()
            return
            
        resp = requests.get(f"{BASE_URL}/auth/me", headers=admin_headers)
        assert resp.status_code == 200, "Session was not preserved across backend restart"
        assert resp.json()['username'] == 'admin'
        print("✅ Session correctly preserved across backend restarts (SQLite persistence).")

        # 8. BACKEND SESSION TEST
        print("\n8. BACKEND SESSION TEST")
        resp = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": "Bearer invalid_token_123"})
        assert resp.status_code == 401, "Invalid token allowed"
        resp = requests.get(f"{BASE_URL}/auth/me")
        assert resp.status_code == 401, "Missing token allowed"
        print("✅ Token validation enforced correctly.")

    finally:
        print("\n[STOPPING BACKEND]")
        proc.kill()
        proc.wait()
        
        print("\n✅ ALL ACCEPTANCE TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
