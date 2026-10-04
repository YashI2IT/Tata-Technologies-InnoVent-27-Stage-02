# AeroEdge-X Final Architecture

Desktop/Web UI
    ↓
Backend Orchestrator
    ↓
Vision Provider
 ┌───────────────┐
 │ Local YOLO    │
 │ Jetson Vision │
 └───────────────┘
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
Background Sync Worker
    ↓
AWS API/S3/DynamoDB
    [deployment pending]


### Architecture Status
- **Desktop/Web UI**: IMPLEMENTED & READY
- **Backend Orchestrator**: IMPLEMENTED & READY
- **Local YOLO**: IMPLEMENTED & READY
- **Jetson Vision**: SIMULATED / READY (Awaiting Physical Hardware)
- **Local RAG**: IMPLEMENTED & READY
- **Local Phi-3**: IMPLEMENTED & READY
- **SQLite Persistence**: IMPLEMENTED & READY
- **PDF Report**: IMPLEMENTED & READY
- **Sync Outbox**: IMPLEMENTED & READY
- **Background Sync Worker**: IMPLEMENTED & SIMULATED (Via Mock Service)
- **AWS API/S3/DynamoDB**: PENDING REAL INFRASTRUCTURE VALIDATION
