import time
import os
import json
import random
from datetime import datetime
from backend.services.aws_sync import AWSSyncWorker

class MockAWSSyncWorker(AWSSyncWorker):
    def __init__(self):
        super().__init__()
        self.interval = 5 # Speed up for testing
        print("[MockAWS] Initialized Mock AWS Sync Worker. Simulating AWS.")

    def _init_clients(self):
        return True # Always succeed in mock mode

    def _process_queue(self):
        conn = self._get_connection()
        try:
            cursor = conn.execute('''
                SELECT id, inspection_id, payload, image_path, report_path, attempts 
                FROM sync_outbox 
                WHERE status IN ('PENDING', 'FAILED') AND attempts < 5
                ORDER BY created_at ASC
                LIMIT 5
            ''')
            jobs = cursor.fetchall()
            
            for job in jobs:
                self._sync_job(conn, job)
        finally:
            conn.close()

    def _sync_job(self, conn, job):
        job_id = job['id']
        inspection_id = job['inspection_id']
        attempts = job['attempts'] + 1
        payload = json.loads(job['payload'])
        
        print(f"[MockAWS] SYNC START - inspection={payload['inspection_id']} attempt={attempts}")
        
        # Mark as SYNCING
        conn.execute("UPDATE sync_outbox SET status = 'SYNCING', attempts = ?, updated_at = ? WHERE id = ?", 
                    (attempts, datetime.now().isoformat(), job_id))
        conn.commit()
        
        time.sleep(1) # Simulate network delay

        try:
            # Simulate random temporary failure on first attempt to test retry logic
            if attempts == 1 and random.random() < 0.3:
                raise ConnectionError("Simulated temporary network timeout")

            # 3. Mark success
            now_iso = datetime.now().isoformat()
            conn.execute('''
                UPDATE sync_outbox 
                SET status = 'SYNCED', synced_at = ?, updated_at = ? 
                WHERE id = ?
            ''', (now_iso, now_iso, job_id))
            
            conn.execute('''
                UPDATE inspections
                SET sync_status = 'SYNCED', last_sync_at = ?, cloud_record_id = ?
                WHERE id = ?
            ''', (now_iso, payload['inspection_id'], inspection_id))
            
            conn.commit()
            print(f"[MockAWS] SYNC SUCCESS - inspection={payload['inspection_id']}")

        except Exception as e:
            # Rollback to FAILED
            print(f"[MockAWS] SYNC FAILED - inspection={payload['inspection_id']} error={e}")
            now_iso = datetime.now().isoformat()
            conn.execute('''
                UPDATE sync_outbox 
                SET status = 'FAILED', last_error = ?, updated_at = ? 
                WHERE id = ?
            ''', (str(e), now_iso, job_id))
            
            conn.execute('''
                UPDATE inspections
                SET sync_status = 'FAILED', last_sync_error = ?, sync_attempts = ?
                WHERE id = ?
            ''', (str(e), attempts, inspection_id))
            
            conn.commit()
