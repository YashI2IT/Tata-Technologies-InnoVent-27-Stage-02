# AeroEdge-X — AWS Cloud Synchronization Implementation Guide

> **Architecture:** Offline-First Transactional Outbox Pattern  
> **Local Source of Truth:** SQLite (`digital_twin.db`) tables `inspections` & `sync_outbox`  
> **Background Daemon:** `backend/services/aws_sync.py` (`AWSSyncWorker`)  
> **Cloud Stack:** AWS CloudFormation (`aws/cloudformation/aeroedge-x-sync.yml`)  
> **Cloud Services:** Amazon S3 (AES-256), Amazon DynamoDB (Pay-Per-Request), AWS Lambda (Python 3.10), Amazon API Gateway v2 (HTTP API)  
> **Local Fallback:** `backend/services/mock_aws.py` (`MockAWSSyncWorker`)  

---

## 1. Architectural Principles

1. **Active Inspection Zero-Cloud Guarantee:**
   AeroEdge-X executes defect detection, manual retrieval, reasoning, and report generation with zero internet dependency. Inspection records are persisted to local SQLite WAL storage immediately.
2. **Transactional Outbox:**
   Every inspection atomically creates an outbox record with `status='PENDING'`. No remote network socket is opened during the user's active inspection transaction.
3. **Asynchronous Daemon Processing:**
   `AWSSyncWorker` runs as a background thread polling every 30 seconds (`AWS_SYNC_INTERVAL_SECONDS`). When internet connectivity is detected, it claims batches of up to 5 jobs, streams binary artifacts to S3, and calls API Gateway to register metadata in DynamoDB.
4. **Strict Idempotency:**
   The AWS Lambda function (`aws/lambda/sync_handler.py`) performs conditional writes with `ConditionExpression='attribute_not_exists(inspection_id)'`. If a network timeout occurs and the desktop worker retries, DynamoDB detects the existing record and Lambda returns HTTP 200 OK without duplicating data.

---

## 2. Directory Structure (`aws/`)

```
aws/
|-- cloudformation/
|   +-- aeroedge-x-sync.yml      # Declarative IaC (S3, DynamoDB, Lambda, API Gateway, IAM)
|-- lambda/
|   +-- sync_handler.py          # Serverless Python 3.10 handler with conditional idempotency
+-- deploy.ps1                   # Automated PowerShell deployment script
```

---

## 3. Database Schema & State Transitions

### `sync_outbox` Table
```sql
CREATE TABLE IF NOT EXISTS sync_outbox (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    inspection_id   INTEGER NOT NULL,
    payload         TEXT NOT NULL,          -- JSON stringified inspection payload
    report_path     TEXT,                   -- Local path to generated PDF
    image_path      TEXT,                   -- Local path to inspection image
    status          TEXT DEFAULT 'PENDING', -- PENDING | SYNCING | SYNCED | FAILED
    attempts        INTEGER DEFAULT 0,      -- Retry counter (capped at 5)
    last_error      TEXT,                   -- Exception traceback if failed
    created_at      TEXT,                   -- ISO-8601 creation timestamp
    updated_at      TEXT,                   -- ISO-8601 update timestamp
    synced_at       TEXT,                   -- ISO-8601 cloud confirmation timestamp
    FOREIGN KEY (inspection_id) REFERENCES inspections (id)
);
```

### State Transitions
```
[Local Commit] -> PENDING -> SYNCING -> SYNCED (Success)
                                    \-> FAILED (Timeout/Network Error, Retry up to 5 times)
```

---

## 4. Metadata Payload Contract

Transmitted via `POST /sync/inspection` to API Gateway:

```json
{
  "inspection_id": "INSP-0042",
  "device_id": "AEROEDGE-DESKTOP-001",
  "user_id": 1,
  "timestamp": "2026-10-10T14:32:00.123456",
  "defect": "crack",
  "confidence": 0.8924,
  "severity": "high",
  "bbox": {
    "x_center": 0.5123,
    "y_center": 0.4381,
    "width": 0.1245,
    "height": 0.0892
  },
  "model": "yolov11",
  "model_version": "v1",
  "inference_device": "jetson_tensorrt",
  "report_key": "reports/INSP-0042/report.pdf",
  "image_key": "images/INSP-0042/original.jpg"
}
```

---

## 5. Deployment Guide (`aws/deploy.ps1`)

### Prerequisites
- AWS CLI v2 installed and configured (`aws configure`).
- IAM credentials with administrative rights to CloudFormation, S3, DynamoDB, Lambda, and API Gateway.

### Automated Deployment
```powershell
.\aws\deploy.ps1
```

The script automatically:
1. Validates `aws/cloudformation/aeroedge-x-sync.yml`.
2. Deploys the stack named `aeroedge-x-sync`.
3. Displays the generated `BucketName`, `DynamoTableName`, and `ApiEndpoint`.

### Configure Environment (`.env`)
```ini
AWS_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com
AWS_S3_BUCKET=aeroedge-x-sync-aeroedges3bucket-<id>
AWS_DYNAMODB_TABLE=AeroEdge-Inspections
AWS_REGION=us-east-1
AEROEDGE_DEVICE_ID=AEROEDGE-DESKTOP-001
AWS_SYNC_INTERVAL_SECONDS=30
```

---

## 6. Offline / Mock Mode

When `AWS_API_URL` or `AWS_S3_BUCKET` is empty in `.env`, AeroEdge-X runs `MockAWSSyncWorker` (`backend/services/mock_aws.py`). It:
- Emulates the identical database transitions (`PENDING` -> `SYNCING` -> `SYNCED`).
- Simulates network delays (1s).
- Exercises transient retry paths on random failures.
- Requires zero AWS credentials and never crashes.
