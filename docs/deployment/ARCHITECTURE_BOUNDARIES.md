# AeroEdge-X — Architecture Boundaries

## Deployment Targets

AeroEdge-X supports two deployment targets with distinct architectures.
Each target has clear boundaries for what is and is not available.

---

## 1. VERCEL (Public Web Demonstration)

| Capability | Available |
|-----------|-----------|
| React UI (all 9 pages) | ✅ |
| Interactive workflow demonstration | ✅ |
| Sample AI detection results | ✅ (demo data) |
| Sample maintenance retrieval | ✅ (demo data) |
| Sample repair guidance | ✅ (demo data) |
| Real YOLOv11 inference | ❌ |
| Real Ollama/Phi-3 Mini | ❌ |
| Real ChromaDB retrieval | ❌ |
| SQLite persistence | ❌ |
| PDF report generation | ❌ |
| Electron desktop features | ❌ |
| Offline operation | ❌ |

---

## 2. DESKTOP (Electron + Flask — Full Runtime)

| Capability | Available |
|-----------|-----------|
| React UI (all 9 pages) | ✅ |
| YOLOv11 defect detection | ✅ |
| ChromaDB + all-MiniLM-L6-v2 | ✅ |
| Phi-3 Mini via local Ollama | ✅ |
| SQLite inspection persistence | ✅ |
| PDF report generation (ReportLab) | ✅ |
| Offline operation | ✅ |
| Windows installer | ✅ |
| Electron desktop shell | ✅ |
| Flask API (localhost:7860) | ✅ |

---

## 3. PLANNED — Edge Deployment (NOT IMPLEMENTED)

| Capability | Status |
|-----------|--------|
| Jetson Orin Nano deployment | 🔲 PLANNED |
| Industrial camera integration | 🔲 PLANNED |
| ONNX / TensorRT optimization | 🔲 PLANNED |

---

## 4. PLANNED — Cloud Integration (NOT IMPLEMENTED)

| Capability | Status |
|-----------|--------|
| Offline synchronization queue | 🔲 PLANNED |
| AWS DynamoDB | 🔲 PLANNED |
| AWS S3 | 🔲 PLANNED |

---

## Coexistence

The desktop and web deployments coexist in the same repository:

- `frontend/vite.config.ts` — Electron + React (desktop builds)
- `frontend/vite.config.web.ts` — React only (Vercel web builds)
- `frontend/src/services/api.ts` — Shared API client with demo mode detection
- `vercel.json` — Vercel deployment configuration

The desktop POC is never affected by Vercel deployment changes.
