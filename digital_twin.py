import sqlite3
import json
import os
from datetime import datetime

DB_PATH = 'digital_twin.db'

class DigitalTwinAgent:
    def __init__(self):
        print(f"[DigitalTwin] DB path: {os.path.abspath(DB_PATH)}")
        print("[DigitalTwin] Initializing SQLite...")
        self.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        self._migrate()
        print("[DigitalTwin] Ready ✅")

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
        self.conn.commit()

    def log_inspection(self, vision_result: dict, rag_result: dict, reasoning_result: dict = None) -> int:
        cursor = self.conn.execute('''
            INSERT INTO inspections (
                timestamp, image_path, defects,
                primary_defect, severity, procedure,
                source, page, reasoning_steps
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            datetime.now().isoformat(),
            vision_result.get('image', ''),
            json.dumps(vision_result.get('detections', [])),
            vision_result.get('primary_defect', 'none'),
            vision_result['detections'][0]['severity'] if vision_result['detections'] else 'none',
            rag_result.get('procedure', ''),
            rag_result.get('source', ''),
            rag_result.get('page', 0),
            json.dumps(reasoning_result.get('steps', []) if reasoning_result else [])
        ))
        self.conn.commit()
        inspection_id = cursor.lastrowid
        print(f"[DigitalTwin] Logged inspection #{inspection_id} ✅")
        return inspection_id

    def get_history(self, limit: int = 10) -> list:
        cursor = self.conn.execute('''
            SELECT id, timestamp, primary_defect, severity, source, page
            FROM inspections
            ORDER BY id DESC
            LIMIT ?
        ''', (limit,))
        rows = cursor.fetchall()
        history = []
        for row in rows:
            history.append({
                "id": row[0],
                "timestamp": row[1],
                "primary_defect": row[2],
                "severity": row[3],
                "source": row[4],
                "page": row[5]
            })
        return history


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