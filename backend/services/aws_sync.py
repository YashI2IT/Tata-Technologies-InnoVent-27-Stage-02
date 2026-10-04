import threading
import time
import os
import json
import traceback
from datetime import datetime
import requests
import sqlite3
from backend.config import get_config

# Import boto3 conditionally so it doesn't crash if uninstalled, although AWS requires it
try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False

class AWSSyncWorker:
    def __init__(self):
        self.cfg = get_config()
        self.running = False
        self.thread = None
        self.db_path = self.cfg.DATABASE_PATH
        self.api_url = self.cfg.AWS_API_URL
        self.region = self.cfg.AWS_REGION
        self.bucket = self.cfg.AWS_S3_BUCKET
        self.table = self.cfg.AWS_DYNAMODB_TABLE
        self.interval = self.cfg.AWS_SYNC_INTERVAL_SECONDS
        
        # Boto3 clients will be initialized inside the thread to avoid threading issues
        self.s3_client = None
        self.dynamo_client = None

    def start(self):
        if self.running:
            return
        self.running = True
        self.thread = threading.Thread(target=self._run, daemon=True, name="AWSSyncWorker")
        self.thread.start()
        print("[AWSSyncWorker] Started background sync worker.")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=2)
            print("[AWSSyncWorker] Stopped.")

    def _init_clients(self):
        if not BOTO3_AVAILABLE:
            return False
            
        if not self.s3_client:
            try:
                self.s3_client = boto3.client('s3', region_name=self.region)
                self.dynamo_client = boto3.client('dynamodb', region_name=self.region)
            except Exception as e:
                print(f"[AWSSyncWorker] Failed to initialize AWS clients: {e}")
                return False
        return True

    def _get_connection(self):
        conn = sqlite3.connect(self.db_path, check_same_thread=False, timeout=30.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _run(self):
        while self.running:
            try:
                self._process_queue()
            except Exception as e:
                print(f"[AWSSyncWorker] Unhandled exception in loop: {e}")
                traceback.print_exc()
            time.sleep(self.interval)

    def _process_queue(self):
        # Determine if we even have credentials or AWS URLs
        if not self.api_url or not self.bucket:
            # AWS Infrastructure not provisioned. Do not attempt sync.
            return

        if not self._init_clients():
            return

        conn = self._get_connection()
        try:
            # Claim up to 5 PENDING or FAILED (with attempts < 5) jobs
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
        image_path = job['image_path']
        report_path = job['report_path']
        
        print(f"[AWSSyncWorker] SYNC START - inspection={payload['inspection_id']} attempt={attempts}")
        
        # Mark as SYNCING
        conn.execute("UPDATE sync_outbox SET status = 'SYNCING', attempts = ?, updated_at = ? WHERE id = ?", 
                    (attempts, datetime.now().isoformat(), job_id))
        conn.commit()

        try:
            # 1. Upload Artifacts to S3
            if image_path and os.path.exists(image_path):
                s3_key = payload['image_key']
                self.s3_client.upload_file(image_path, self.bucket, s3_key)
            
            if report_path and os.path.exists(report_path):
                s3_key = payload['report_key']
                self.s3_client.upload_file(report_path, self.bucket, s3_key)

            # 2. Call API Gateway to record metadata in DynamoDB securely
            response = requests.post(
                f"{self.api_url}/sync/inspection",
                json=payload,
                timeout=10
            )
            response.raise_for_status()

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
            print(f"[AWSSyncWorker] SYNC SUCCESS - inspection={payload['inspection_id']}")

        except Exception as e:
            # Rollback to FAILED
            print(f"[AWSSyncWorker] SYNC FAILED - inspection={payload['inspection_id']} error={e}")
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

# Singleton instance
config = get_config()
if config.AWS_API_URL and config.AWS_S3_BUCKET:
    sync_worker = AWSSyncWorker()
else:
    from backend.services.mock_aws import MockAWSSyncWorker
    sync_worker = MockAWSSyncWorker()
