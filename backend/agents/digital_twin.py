import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.environ.get('DATABASE_PATH', 'data/digital_twin.db')

class DigitalTwinAgent:
    def __init__(self, db_path=None):
        import backend.agents.digital_twin as digital_twin
        self.db_path = str(db_path) if db_path else getattr(digital_twin, 'DB_PATH', os.environ.get('DATABASE_PATH', 'data/digital_twin.db'))
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False, timeout=30.0)
        try:
            self.conn.execute("PRAGMA journal_mode=WAL;")
            self.conn.execute("PRAGMA busy_timeout=10000;")
        except Exception:
            pass
        self._migrate()

    def close(self):
        """Safely close database connection."""
        try:
            self.conn.close()
        except Exception:
            pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def verify_integrity(self) -> bool:
        """Run SQLite integrity check."""
        try:
            cursor = self.conn.execute("PRAGMA integrity_check;")
            row = cursor.fetchone()
            return bool(row and row[0] == "ok")
        except Exception:
            return False

    def _migrate(self):
        # Create table if not exists
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS inspections (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp       TEXT,
                image_path      TEXT,
                defects         TEXT,
                primary_defect  TEXT,
                severity        TEXT,
                procedure       TEXT,
                source          TEXT,
                page            INTEGER,
                reasoning_steps TEXT
            )
        ''')
        # Add reasoning_steps column if missing (for old DBs)
        try:
            self.conn.execute('ALTER TABLE inspections ADD COLUMN reasoning_steps TEXT')
            print("[DigitalTwin] Added reasoning_steps column ✅")
        except:
            pass  # Column already exists

        # Add AWS Sync columns to inspections
        for col_name, col_type in [
            ('device_id', "TEXT"),
            ('sync_status', "TEXT DEFAULT 'PENDING'"),
            ('cloud_record_id', "TEXT"),
            ('last_sync_at', "TEXT"),
            ('sync_attempts', "INTEGER DEFAULT 0"),
            ('last_sync_error', "TEXT"),
            ('user_id', "INTEGER")
        ]:
            try:
                self.conn.execute(f'ALTER TABLE inspections ADD COLUMN {col_name} {col_type}')
                print(f"[DigitalTwin] Added {col_name} column to inspections ✅")
            except:
                pass

        # Create sync_outbox table
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS sync_outbox (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                inspection_id   INTEGER NOT NULL,
                payload         TEXT NOT NULL,
                report_path     TEXT,
                image_path      TEXT,
                status          TEXT DEFAULT 'PENDING',
                attempts        INTEGER DEFAULT 0,
                last_error      TEXT,
                created_at      TEXT,
                updated_at      TEXT,
                synced_at       TEXT,
                FOREIGN KEY (inspection_id) REFERENCES inspections (id)
            )
        ''')

        # Create notifications table
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                title           TEXT,
                message         TEXT,
                severity        TEXT,
                entity_type     TEXT,
                entity_id       INTEGER,
                created_at      TEXT,
                is_read         INTEGER DEFAULT 0
            )
        ''')
        
        # Create users table
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                username        TEXT UNIQUE NOT NULL,
                password_hash   TEXT NOT NULL,
                role            TEXT DEFAULT 'TECHNICIAN',
                is_active       INTEGER DEFAULT 1,
                failed_attempts INTEGER DEFAULT 0,
                locked_until    TEXT,
                created_at      TEXT,
                last_login_at   TEXT
            )
        ''')
        
        # Create audit_logs table
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS audit_logs (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp       TEXT,
                event_type      TEXT,
                user_id         INTEGER,
                details         TEXT
            )
        ''')

        # Add profile columns to users table if missing
        for col_name, col_type in [
            ('full_name', "TEXT DEFAULT 'Arjun Verma'"),
            ('email', "TEXT DEFAULT 'arjun.verma@aeroedgex.com'"),
            ('technician_id', "TEXT DEFAULT 'Tech-07'"),
            ('station', "TEXT DEFAULT 'Hangar 3 - Turbine & Propulsion Bay'"),
            ('phone', "TEXT DEFAULT '+91 98765 43210'"),
            ('detection_threshold', "REAL DEFAULT 0.40"),
            ('audio_alerts', "INTEGER DEFAULT 1"),
            ('auto_refresh', "INTEGER DEFAULT 1")
        ]:
            try:
                self.conn.execute(f'ALTER TABLE users ADD COLUMN {col_name} {col_type}')
            except:
                pass
        
        try:
            self.conn.execute('''
                UPDATE users 
                SET full_name = COALESCE(full_name, 'Arjun Verma'),
                    email = COALESCE(email, 'arjun.verma@aeroedgex.com'),
                    technician_id = COALESCE(technician_id, 'Tech-07'),
                    station = COALESCE(station, 'Hangar 3 - Turbine & Propulsion Bay'),
                    phone = COALESCE(phone, '+91 98765 43210'),
                    detection_threshold = COALESCE(detection_threshold, 0.40),
                    audio_alerts = COALESCE(audio_alerts, 1),
                    auto_refresh = COALESCE(auto_refresh, 1)
                WHERE username = 'admin' AND (full_name IS NULL OR full_name = '')
            ''')
        except:
            pass

        # Create sessions table
        self.conn.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id         INTEGER NOT NULL,
                token_hash      TEXT NOT NULL UNIQUE,
                created_at      TEXT,
                last_seen_at    TEXT,
                expires_at      TEXT,
                revoked_at      TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')

        self.conn.commit()

    def get_user_by_username(self, username: str):
        cursor = self.conn.execute('SELECT * FROM users WHERE username = ?', (username,))
        row = cursor.fetchone()
        if row:
            col_names = [desc[0] for desc in cursor.description]
            d = dict(zip(col_names, row))
            return {
                "id": d.get("id"),
                "username": d.get("username"),
                "password_hash": d.get("password_hash"),
                "role": d.get("role"),
                "full_name": d.get("full_name") or ("Arjun Verma" if d.get("username") == "admin" else d.get("username")),
                "email": d.get("email") or "arjun.verma@aeroedgex.com",
                "technician_id": d.get("technician_id") or "Tech-07",
                "station": d.get("station") or "Hangar 3 - Turbine & Propulsion Bay",
                "phone": d.get("phone") or "+91 98765 43210",
                "detection_threshold": float(d.get("detection_threshold") or 0.40),
                "audio_alerts": bool(d.get("audio_alerts", 1) if d.get("audio_alerts") is not None else 1),
                "auto_refresh": bool(d.get("auto_refresh", 1) if d.get("auto_refresh") is not None else 1),
                "is_active": bool(d.get("is_active", 1)),
                "failed_attempts": int(d.get("failed_attempts") or 0),
                "locked_until": d.get("locked_until"),
                "created_at": d.get("created_at"),
                "last_login_at": d.get("last_login_at")
            }
        return None

    def get_user_by_id(self, user_id: int):
        cursor = self.conn.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        row = cursor.fetchone()
        if row:
            col_names = [desc[0] for desc in cursor.description]
            d = dict(zip(col_names, row))
            return {
                "id": d.get("id"),
                "username": d.get("username"),
                "role": d.get("role"),
                "full_name": d.get("full_name") or ("Arjun Verma" if d.get("username") == "admin" else d.get("username")),
                "email": d.get("email") or "arjun.verma@aeroedgex.com",
                "technician_id": d.get("technician_id") or "Tech-07",
                "station": d.get("station") or "Hangar 3 - Turbine & Propulsion Bay",
                "phone": d.get("phone") or "+91 98765 43210",
                "detection_threshold": float(d.get("detection_threshold") or 0.40),
                "audio_alerts": bool(d.get("audio_alerts", 1) if d.get("audio_alerts") is not None else 1),
                "auto_refresh": bool(d.get("auto_refresh", 1) if d.get("auto_refresh") is not None else 1),
                "is_active": bool(d.get("is_active", 1)),
                "created_at": d.get("created_at"),
                "last_login_at": d.get("last_login_at")
            }
        return None

    def update_user_profile(self, user_id: int, full_name: str, email: str, technician_id: str, station: str, phone: str = ""):
        self.conn.execute('''
            UPDATE users 
            SET full_name = ?, email = ?, technician_id = ?, station = ?, phone = ?
            WHERE id = ?
        ''', (full_name, email, technician_id, station, phone, user_id))
        self.conn.commit()
        return self.get_user_by_id(user_id)

    def update_user_preferences(self, user_id: int, threshold: float, audio_alerts: bool, auto_refresh: bool):
        self.conn.execute('''
            UPDATE users 
            SET detection_threshold = ?, audio_alerts = ?, auto_refresh = ?
            WHERE id = ?
        ''', (float(threshold), int(bool(audio_alerts)), int(bool(auto_refresh)), user_id))
        self.conn.commit()
        return self.get_user_by_id(user_id)

    def update_user_password(self, user_id: int, new_password_hash: str):
        self.conn.execute('''
            UPDATE users SET password_hash = ? WHERE id = ?
        ''', (new_password_hash, user_id))
        self.conn.commit()

    def get_db_metrics(self):
        inspections_count = self.conn.execute('SELECT COUNT(*) FROM inspections').fetchone()[0]
        notifications_count = self.conn.execute('SELECT COUNT(*) FROM notifications').fetchone()[0]
        audit_count = self.conn.execute('SELECT COUNT(*) FROM audit_logs').fetchone()[0]
        users_count = self.conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
        return {
            "inspections_count": inspections_count,
            "notifications_count": notifications_count,
            "audit_count": audit_count,
            "users_count": users_count
        }

    def create_user(self, username: str, password_hash: str, role: str = 'ADMIN'):
        cursor = self.conn.execute('''
            INSERT INTO users (username, password_hash, role, created_at)
            VALUES (?, ?, ?, ?)
        ''', (username, password_hash, role, datetime.now().isoformat()))
        self.conn.commit()
        return cursor.lastrowid

    def update_failed_attempts(self, user_id: int, attempts: int, locked_until: str = None):
        self.conn.execute('''
            UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?
        ''', (attempts, locked_until, user_id))
        self.conn.commit()

    def update_last_login(self, user_id: int):
        self.conn.execute('''
            UPDATE users SET last_login_at = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?
        ''', (datetime.now().isoformat(), user_id))
        self.conn.commit()

    def log_audit_event(self, event_type: str, user_id: int = None, details: str = ""):
        self.conn.execute('''
            INSERT INTO audit_logs (timestamp, event_type, user_id, details)
            VALUES (?, ?, ?, ?)
        ''', (datetime.now().isoformat(), event_type, user_id, details))
        self.conn.commit()

    def log_inspection(self, vision_result: dict, rag_result: dict, reasoning_result: dict = None, user_id: int = None) -> int:
        from backend.config import get_config
        cfg = get_config()
        device_id = cfg.AEROEDGE_DEVICE_ID
        
        cursor = self.conn.execute('''
            INSERT INTO inspections (
                timestamp, image_path, defects,
                primary_defect, severity, procedure,
                source, page, reasoning_steps, device_id, sync_status, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            vision_result.get('image', ''),
            json.dumps(vision_result.get('detections', [])),
            vision_result.get('primary_defect', 'none'),
            vision_result['detections'][0]['severity'] if vision_result.get('detections') else 'none',
            rag_result.get('procedure', ''),
            rag_result.get('source', ''),
            rag_result.get('page', 0),
            json.dumps(reasoning_result.get('steps', []) if reasoning_result else []),
            device_id,
            'PENDING',
            user_id
        ))
        inspection_id = cursor.lastrowid
        
        # Create a sync outbox entry
        now_iso = datetime.now().isoformat()
        payload = {
            "inspection_id": f"INSP-{inspection_id:04d}",
            "device_id": device_id,
            "user_id": user_id,
            "timestamp": now_iso,
            "defect": vision_result.get('primary_defect', 'none'),
            "confidence": float(vision_result['detections'][0]['confidence']) if vision_result.get('detections') else 0.0,
            "severity": vision_result['detections'][0]['severity'] if vision_result.get('detections') else 'none',
            "bbox": vision_result['detections'][0]['location'] if vision_result.get('detections') else {},
            "model": "yolov11",
            "model_version": "v1",
            "inference_device": vision_result.get('inference_device', 'local_cpu'),
            "report_key": f"reports/INSP-{inspection_id:04d}/report.pdf",
            "image_key": f"images/INSP-{inspection_id:04d}/original.jpg"
        }
        
        self.conn.execute('''
            INSERT INTO sync_outbox (inspection_id, payload, image_path, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (inspection_id, json.dumps(payload), vision_result.get('image', ''), now_iso, now_iso))
        
        self.conn.commit()
        print(f"[DigitalTwin] Logged inspection #{inspection_id} and queued for sync ✅")
        return inspection_id

    def get_history(self, limit: int = 10) -> list:
        cursor = self.conn.execute('''
            SELECT id, timestamp, primary_defect, severity, source, page, image_path, sync_status
            FROM inspections
            ORDER BY id DESC
            LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        history = []
        for row in rows:
            image_path = row[6]
            annotated_image = image_path.rsplit('.', 1)[0] + '_annotated.jpg' if image_path else None
            
            history.append({
                "id": row[0],
                "timestamp": row[1],
                "primary_defect": row[2],
                "severity": row[3],
                "source": row[4],
                "page": row[5],
                "image_path": image_path,
                "annotated_image": annotated_image,
                "sync_status": row[7] if len(row) > 7 else 'PENDING'
            })
        return history

    def search_inspections(self, query: str, limit: int = 20) -> list:
        cursor = self.conn.execute('''
            SELECT id, timestamp, primary_defect, severity, source, page, image_path
            FROM inspections
            WHERE primary_defect LIKE ? OR severity LIKE ? OR id LIKE ? OR source LIKE ?
            ORDER BY id DESC
            LIMIT ?
        ''', (f'%{query}%', f'%{query}%', f'%{query}%', f'%{query}%', limit))
        rows = cursor.fetchall()
        results = []
        for row in rows:
            results.append({
                "id": row[0],
                "timestamp": row[1],
                "primary_defect": row[2],
                "severity": row[3],
                "source": row[4],
                "page": row[5],
                "image_path": row[6]
            })
        return results

    def create_notification(self, title: str, message: str, severity: str = 'info', entity_type: str = None, entity_id: int = None) -> int:
        cursor = self.conn.execute('''
            INSERT INTO notifications (title, message, severity, entity_type, entity_id, created_at, is_read)
            VALUES (?, ?, ?, ?, ?, ?, 0)
        ''', (title, message, severity, entity_type, entity_id, datetime.now().isoformat()))
        self.conn.commit()
        return cursor.lastrowid

    def get_notifications(self, limit: int = 50) -> list:
        cursor = self.conn.execute('''
            SELECT id, title, message, severity, entity_type, entity_id, created_at, is_read
            FROM notifications
            ORDER BY created_at DESC
            LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        notifications = []
        for row in rows:
            notifications.append({
                "id": row[0],
                "title": row[1],
                "message": row[2],
                "severity": row[3],
                "entity_type": row[4],
                "entity_id": row[5],
                "created_at": row[6],
                "is_read": bool(row[7])
            })
        return notifications

    def mark_notifications_read(self):
        self.conn.execute('UPDATE notifications SET is_read = 1 WHERE is_read = 0')
        self.conn.commit()


if __name__ == "__main__":
    twin = DigitalTwinAgent()
    test_vision = {
        "image": "test.jpg",
        "primary_defect": "crack",
        "detections": [{"defect_type": "crack", "confidence": 0.91, "severity": "high"}]
    }
    test_rag = {
        "procedure": "Stop drill crack ends. Apply sealant.",
        "source": "ac_43.13-1b.pdf",
        "page": 205
    }
    test_reasoning = {
        "steps": [{"number": 1, "title": "Stop Drill", "description": "Drill at crack tips."}]
    }
    id = twin.log_inspection(test_vision, test_rag, test_reasoning)
    print(f"Logged as inspection #{id}")
    print(twin.get_history())