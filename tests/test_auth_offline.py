import requests
import sqlite3
import time
import os
import sys

# Update path to allow importing backend config
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

def run_tests():
    print("========================================")
    print(" AEROEDGE-X LOCAL AUTHENTICATION TEST SUITE")
    print("========================================")
    
    # Ensure server is running
    try:
        requests.get(f"{BASE_URL}/health")
    except Exception as e:
        print("❌ Backend is not reachable. Start app.py first.")
        return
        
    clear_db()

    # 1. First-run setup creates admin
    print("\n[TEST] 1. First-run Setup")
    resp = requests.post(f"{BASE_URL}/auth/setup", json={
        "username": "admin",
        "password": "securepassword123",
        "full_name": "Admin User"
    })
    assert resp.status_code == 201, f"Expected 201, got {resp.status_code}"
    print("✅ First-run setup creates admin: PASS")

    # 2. First-run setup cannot be repeated once a user exists
    resp = requests.post(f"{BASE_URL}/auth/setup", json={
        "username": "admin2",
        "password": "securepassword123"
    })
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"
    print("✅ First-run setup cannot be repeated: PASS")

    # 3. Successful login
    print("\n[TEST] 2. Login Flow")
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "securepassword123"
    })
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    token = resp.json()['token']
    assert token, "Token not returned"
    print("✅ Successful login: PASS")

    # 4. Incorrect password
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "wrongpassword"
    })
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    print("✅ Incorrect password rejected: PASS")

    # 6 & 7. Session creation & validation
    print("\n[TEST] 3. Session Management")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
    assert resp.json()['username'] == "admin", "Invalid user returned"
    print("✅ Session creation & validation: PASS")

    # 14. Unauthorized endpoint
    resp = requests.get(f"{BASE_URL}/auth/me")
    assert resp.status_code == 401, f"Expected 401, got {resp.status_code}"
    print("✅ Unauthorized endpoint protected: PASS")

    # Create a technician user directly in DB for role testing
    conn = sqlite3.connect(DB_PATH)
    from werkzeug.security import generate_password_hash
    pwd = generate_password_hash("techpassword123")
    cursor = conn.execute("INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, ?, ?)", 
                 ("tech1", pwd, "TECHNICIAN", 1))
    tech_id = cursor.lastrowid
    
    # 5. Inactive user test
    conn.execute("INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, ?, ?)", 
                 ("fired_tech", pwd, "TECHNICIAN", 0))
    conn.commit()
    conn.close()

    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "fired_tech", "password": "techpassword123"})
    assert resp.status_code == 403, f"Expected 403 for inactive user, got {resp.status_code}"
    print("✅ Inactive user rejected: PASS")

    # Login as tech
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "tech1", "password": "techpassword123"})
    tech_token = resp.json()['token']
    tech_headers = {"Authorization": f"Bearer {tech_token}"}

    # 11, 12, 13. Role authorization
    print("\n[TEST] 4. Role Authorization")
    resp = requests.get(f"{BASE_URL}/auth/users", headers=headers) # admin
    assert resp.status_code == 200, "Admin cannot access users list"
    
    resp = requests.get(f"{BASE_URL}/auth/users", headers=tech_headers) # tech
    assert resp.status_code == 403, "Tech improperly accessed users list"
    print("✅ Role authorization (Admin vs Tech): PASS")

    # 15. Inspection associated with logged-in user
    print("\n[TEST] 5. Inspection Integration")
    os.makedirs("test_data", exist_ok=True)
    test_image_path = "test_data/dummy_test_image.jpg"
    with open(test_image_path, "wb") as f: f.write(b"dummy")

    with open(test_image_path, "rb") as f:
        resp = requests.post(f"{BASE_URL}/analyze", headers=tech_headers, files={"image": f})
    assert resp.status_code == 200, f"Analyze failed: {resp.status_code} {resp.text}"
    insp_id = resp.json()['inspection_id']
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    insp = conn.execute("SELECT user_id FROM inspections WHERE id = ?", (insp_id,)).fetchone()
    assert insp['user_id'] == tech_id, "user_id not saved to inspection"
    print("✅ Inspection associated with user: PASS")

    # 19. Audit log creation
    logs = conn.execute("SELECT * FROM audit_logs").fetchall()
    assert len(logs) > 0, "No audit logs created"
    login_fails = [l for l in logs if l['event_type'] == 'LOGIN_FAILURE']
    assert len(login_fails) > 0, "Failed login not audited"
    print("✅ Audit log creation: PASS")

    # 20. Brute-force protection
    print("\n[TEST] 6. Security & Protections")
    for _ in range(5):
        requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "wrongpassword"})
    
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "securepassword123"})
    assert resp.status_code == 403, f"Expected 403 (Locked), got {resp.status_code}"
    print("✅ Brute-force lockout: PASS")

    # 8. Logout
    resp = requests.post(f"{BASE_URL}/auth/logout", headers=tech_headers)
    assert resp.status_code == 200, "Logout failed"
    
    # 10. Revoked session
    resp = requests.get(f"{BASE_URL}/auth/me", headers=tech_headers)
    assert resp.status_code == 401, "Revoked token still works"
    print("✅ Logout & revoked session: PASS")
    
    print("\n✅ ALL OFFLINE AUTHENTICATION TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
