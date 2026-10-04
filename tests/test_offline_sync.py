import os
import time
import requests
import sqlite3
import json
import sys
from backend.config import get_config

BASE_URL = "http://127.0.0.1:7860"
DB_PATH = str(get_config().DATABASE_PATH)

def run_tests():
    print("========================================")
    print(" AEROEDGE-X LOCAL SYNC E2E TEST SUITE")
    print("========================================")
    
    # Ensure server is running
    try:
        resp = requests.get(f"{BASE_URL}/health")
        resp.raise_for_status()
        print("✅ Backend Health Check: PASS")
    except Exception as e:
        print("❌ Backend is not reachable. Is app.py running?")
        return

    # Authenticate as a fresh technician
    import sqlite3
    from werkzeug.security import generate_password_hash
    conn = sqlite3.connect(DB_PATH)
    pwd = generate_password_hash('syncpass123')
    try:
        conn.execute("INSERT INTO users (username, password_hash, role, is_active) VALUES (?, ?, ?, ?)", 
                    ("sync_tech", pwd, "TECHNICIAN", 1))
        conn.commit()
    except:
        pass
    conn.close()
    
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "sync_tech", "password": "syncpass123"})
    token = resp.json().get('token')
    headers = {"Authorization": f"Bearer {token}"}

    # PHASE 2 & 5 - Local E2E Inspection Test (Offline-first)
    print("\n[TEST] Simulating Local E2E Inspection...")
    # Create a dummy image for testing
    os.makedirs("test_data", exist_ok=True)
    test_image_path = "test_data/dummy_test_image.jpg"
    with open(test_image_path, "wb") as f:
        f.write(b"dummy image data")

    try:
        start_time = time.time()
        with open(test_image_path, "rb") as f:
            print(f"Headers being sent: {headers}")
            resp = requests.post(f"{BASE_URL}/analyze", headers=headers, files={"image": f})
        resp.raise_for_status()
        result = resp.json()
        print(f"✅ Local Inspection E2E: PASS ({time.time() - start_time:.2f}s)")
        print(f"  - Inspection ID: {result['inspection_id']}")
        print(f"  - Vision: {result['vision']['primary_defect']}")
    except Exception as e:
        print(f"❌ Local Inspection E2E: FAIL - {e}")
        return

    # Database Validation
    print("\n[TEST] Validating SQLite Persistence...")
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        
        # Check inspections table
        cursor = conn.execute("SELECT * FROM inspections ORDER BY id DESC LIMIT 1")
        inspection = cursor.fetchone()
        if inspection:
            print(f"✅ SQLite Persistence: PASS (ID: {inspection['id']})")
        else:
            print("❌ SQLite Persistence: FAIL (Record not found)")

        # Check sync_outbox
        cursor = conn.execute("SELECT * FROM sync_outbox WHERE inspection_id = ?", (inspection['id'],))
        outbox = cursor.fetchone()
        if outbox:
            print(f"✅ Sync Outbox Creation: PASS (Status: {outbox['status']})")
        else:
            print("❌ Sync Outbox Creation: FAIL")
    finally:
        conn.close()

    # PHASE 6 - Sync Status API
    print("\n[TEST] Validating /sync/status API...")
    try:
        resp = requests.get(f"{BASE_URL}/sync/status", headers=headers)
        resp.raise_for_status()
        status_data = resp.json()
        print(f"✅ Sync Status API: PASS")
        print(f"  - Overall State: {status_data['overall_state']}")
        print(f"  - Stats: {status_data['stats']}")
    except Exception as e:
        print(f"❌ Sync Status API: FAIL - {e}")

    # Wait for Mock AWS Worker to process the job
    print("\n[TEST] Waiting for Mock AWS Worker (Retries/Success)...")
    time.sleep(3) # Worker polls every 5s in mock mode
    
    try:
        resp = requests.get(f"{BASE_URL}/sync/status")
        print(f"  - Current State: {resp.json()['overall_state']}")
    except:
        pass
        
    time.sleep(3)
    
    print("\n[TEST] Re-checking SQLite after mock sync...")
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.execute("SELECT * FROM sync_outbox WHERE inspection_id = ?", (inspection['id'],))
        outbox = cursor.fetchone()
        if outbox:
            print(f"✅ Retry / Sync Processing: PASS (Final Status: {outbox['status']}, Attempts: {outbox['attempts']})")
    finally:
        conn.close()

if __name__ == "__main__":
    run_tests()
