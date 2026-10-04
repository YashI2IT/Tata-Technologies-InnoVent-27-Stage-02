# AeroEdge-X Pre-AWS Code Freeze

## 1. Current Architecture
Desktop/Web UI
    ↓
Backend Orchestrator
    ↓
Vision Provider (CPU Fallback Currently Active)
    ↓
Local RAG
    ↓
Local Phi-3
    ↓
SQLite Digital Inspection State
    ↓
PDF Report
    ↓
Sync Outbox
    ↓
Background Sync Worker (Mocking AWS Currently Active)
    ↓
AWS API/S3/DynamoDB (Deployment Pending)

## 2. Verified Local Functionality
- ✅ Complete offline inspection lifecycle (upload -> detect -> RAG -> LLM -> DB -> PDF).
- ✅ Atomic Database Writes (Inspections & Sync Outbox).
- ✅ UI Polling of actual SQLite outbox state (`/sync/status`).
- ✅ Daemonized Python Sync Worker.
- ✅ CPU Vision Fallback.

## 3. Simulated Functionality
- **AWS Infrastructure**: Abstracted via `MockAWSSyncWorker` in `mock_aws.py` to validate retry logic, network faults, and idempotency states locally without cloud costs.

## 4. AWS Pending Items
- Provisioning IAM Credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).
- Deploying `aeroedge-x-sync.yml` via CloudFormation.

## 5. Jetson Hardware Pending Items
- Connecting a physical NVIDIA Jetson Orin Nano.
- Switching `VISION_AGENT_MODE=jetson` to validate TensorRT execution.

## 6. Exact Files Modified/Created
- `backend/agents/digital_twin.py` (Added AWS columns and `sync_outbox` schema)
- `backend/config.py` (Added AWS sync configuration placeholders)
- `app.py` (Added `/sync/status` route, daemon initialization, migration bootstrapping)
- `frontend/src/components/layout/StatusBar.tsx` (Added actual dynamic backend AWS Sync indicator)
- `frontend/src/services/api.ts` (Added `/sync/status` client method)
- `backend/services/aws_sync.py` (Created Background Python AWS synchronizer)
- `backend/services/mock_aws.py` (Created deterministic AWS Simulator)
- `aws/cloudformation/aeroedge-x-sync.yml` (Created Infrastructure as Code)
- `aws/lambda/sync_handler.py` (Created API Gateway Payload parser)
- `aws/deploy.ps1` (Created safe deployment script)
- `tests/test_offline_sync.py` (Created E2E validation script)
- `.env.example` (Updated with safe AWS placeholders)

## 7. Exact Tests Passed
- `tests\test_offline_sync.py`
  - Backend Health Check
  - Simulated Local E2E Inspection
  - SQLite Persistence
  - Sync Outbox Atomic Creation
  - `/sync/status` API Validation
  - Mock AWS Worker (Retries/Success) Execution

## 8. Critical Bug Fixes (Phase 4/5)
During the final verification phase, 3 critical synchronization and initialization bugs were found and resolved:

### Bug 1: Uninitialized SQLite Migration
- **Original Problem:** `AWSSyncWorker` started querying `sync_outbox` on startup before `DigitalTwinAgent()` was ever instantiated, causing an immediate fatal thread crash (`no such table: sync_outbox`).
- **Affected File:** `app.py`
- **Fix:** Eagerly instantiated `DigitalTwinAgent()` in the main Flask block before `sync_worker.start()`.
- **Why:** The Digital Twin agent contains the schema migration logic. It must run before any daemons query its tables.

### Bug 2: Missing Package Import
- **Original Problem:** A `NameError` crash due to a missing package when calling `/sync/status`.
- **Affected File:** `app.py`
- **Fix:** Added `import sqlite3` at the top of the file.
- **Why:** The new `/sync/status` route dynamically instantiates its own SQLite connection to prevent cross-thread issues, requiring the base package.

### Bug 3: Windows Path Casting Error
- **Original Problem:** `sqlite3.connect` encountered a type error because `app.config.get('DATABASE_PATH')` returned a `WindowsPath` object.
- **Affected File:** `app.py`
- **Fix:** Added `str()` wrapping around the `DATABASE_PATH` variable in the `/sync/status` route.
- **Why:** Older SQLite bindings and certain Windows path manipulations require absolute strings rather than pathlib objects.

## 9. Known Limitations
- The system heavily relies on `mock_aws.py` until physical credentials are injected into the `.env` file.

## 10. Deployment Prerequisites
- Active AWS Account.
- AWS CLI configured on the deployment machine.
- Execution of `.\aws\deploy.ps1`.
