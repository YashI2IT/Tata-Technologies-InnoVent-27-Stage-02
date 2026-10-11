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
                kwargs = {'region_name': self.region}
                aws_key = os.environ.get("AWS_ACCESS_KEY_ID")
                aws_secret = os.environ.get("AWS_SECRET_ACCESS_KEY")
                if aws_key and aws_secret:
                    kwargs['aws_access_key_id'] = aws_key
                    kwargs['aws_secret_access_key'] = aws_secret
                self.s3_client = boto3.client('s3', **kwargs)
                self.dynamo_client = boto3.client('dynamodb', **kwargs)
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

    def _is_online(self) -> bool:
        """Check if internet connectivity is available."""
        import socket
        for host, port in [("8.8.8.8", 53), ("1.1.1.1", 53)]:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(2.0)
                s.connect((host, port))
                s.close()
                return True
            except Exception:
                continue
        return False

    def trigger_now(self):
        """Immediately triggers a sync queue cycle."""
        if not self.running:
            self.start()
        try:
            return self._process_queue()
        except Exception as e:
            return {"error": str(e)}

    def _process_queue(self):
        # Determine if we even have credentials or AWS URLs
        if not self.api_url and not self.bucket:
            # AWS Infrastructure not provisioned. Do not attempt sync.
            return {"status": "skipped", "reason": "AWS credentials not configured"}

        if not self._is_online():
            print("[AWSSyncWorker] Offline: No internet connection detected. Retaining inspections locally in SQLite outbox.")
            return {"status": "offline", "message": "Device offline, records safely held in local outbox"}

        if not self._init_clients():
            return {"status": "skipped", "reason": "Could not initialize AWS clients"}

        conn = self._get_connection()
        synced_count = 0
        try:
            # Claim up to 10 PENDING or FAILED jobs
            cursor = conn.execute('''
                SELECT id, inspection_id, payload, image_path, report_path, attempts 
                FROM sync_outbox 
                WHERE status IN ('PENDING', 'FAILED') AND attempts < 10
                ORDER BY created_at ASC
                LIMIT 10
            ''')
            jobs = cursor.fetchall()
            
            for job in jobs:
                if self._sync_job(conn, job):
                    synced_count += 1
                    
            return {"status": "completed", "synced_jobs": synced_count}
        finally:
            conn.close()

    def _sync_job(self, conn, job):
        job_id = job['id']
        inspection_id = job['inspection_id']
        attempts = job['attempts'] + 1
        payload = json.loads(job['payload'])
        image_path = job['image_path']
        report_path = job['report_path']
        
        print(f"[AWSSyncWorker] SYNC START - inspection={payload.get('inspection_id')} attempt={attempts}")
        
        # Mark as SYNCING
        conn.execute("UPDATE sync_outbox SET status = 'SYNCING', attempts = ?, updated_at = ? WHERE id = ?", 
                    (attempts, datetime.now().isoformat(), job_id))
        conn.commit()

        try:
            # 1. Upload Artifacts to S3
            if self.bucket and self.s3_client:
                if image_path and os.path.exists(image_path):
                    s3_key = payload.get('image_key', f"images/{payload.get('inspection_id')}/original.jpg")
                    self.s3_client.upload_file(image_path, self.bucket, s3_key)
                
                if report_path and os.path.exists(report_path):
                    s3_key = payload.get('report_key', f"reports/{payload.get('inspection_id')}/report.pdf")
                    self.s3_client.upload_file(report_path, self.bucket, s3_key)

            # 2. Call API Gateway or fallback to direct DynamoDB
            metadata_recorded = False
            endpoint_url = self.api_url.rstrip('/') if self.api_url else None
            if endpoint_url:
                if not endpoint_url.endswith('/sync/inspection'):
                    endpoint_url = f"{endpoint_url}/sync/inspection"
                try:
                    response = requests.post(
                        endpoint_url,
                        json=payload,
                        timeout=10
                    )
                    if response.status_code == 200:
                        metadata_recorded = True
                except Exception as gw_err:
                    print(f"[AWSSyncWorker] API Gateway call failed ({gw_err}), attempting direct DynamoDB write...")

            if not metadata_recorded and self.dynamo_client and self.table:
                # Direct DynamoDB fallback for metadata
                item = {
                    'inspection_id': {'S': str(payload.get('inspection_id', f'INSP-{inspection_id}'))},
                    'device_id': {'S': str(payload.get('device_id', 'AEROEDGE-001'))},
                    'timestamp': {'S': str(payload.get('timestamp', ''))},
                    'defect': {'S': str(payload.get('defect', 'none'))},
                    'confidence': {'S': str(payload.get('confidence', '0.0'))},
                    'severity': {'S': str(payload.get('severity', 'none'))},
                    'model': {'S': str(payload.get('model', 'yolov11'))},
                    'report_key': {'S': str(payload.get('report_key', ''))},
                    'image_key': {'S': str(payload.get('image_key', ''))}
                }
                self.dynamo_client.put_item(TableName=self.table, Item=item)
                metadata_recorded = True

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
            ''', (now_iso, payload.get('inspection_id'), inspection_id))
            
            conn.commit()
            print(f"[AWSSyncWorker] SYNC SUCCESS - inspection={payload.get('inspection_id')}")
            return True

        except Exception as e:
            # Handle temporary network disconnect gracefully
            print(f"[AWSSyncWorker] SYNC TEMPORARILY FAILED - inspection={payload.get('inspection_id')} error={e}")
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
            return False

# Singleton instance
config = get_config()
if config.AWS_API_URL and config.AWS_S3_BUCKET:
    sync_worker = AWSSyncWorker()
else:
    from backend.services.mock_aws import MockAWSSyncWorker
    sync_worker = MockAWSSyncWorker()
