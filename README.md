# AeroEdge-X

## Agentic Edge AI for Digital Twin-Enabled Aerospace MRO

AeroEdge-X is an offline-first aircraft maintenance inspection system that integrates
computer vision defect detection, local maintenance document retrieval, local LLM
reasoning, inspection-state persistence, and automated report generation — all
running entirely on the technician's local machine with zero cloud dependency.

> **Tata Technologies — InnoVent-27 Stage 02**

---

## Problem Statement

Aircraft maintenance inspections today rely on manual visual assessment by
technicians, supported by paper-based maintenance manuals and ad-hoc
documentation. This process is error-prone, time-consuming, and lacks a
verifiable digital evidence chain. AeroEdge-X addresses this by providing
an AI-assisted inspection workflow that detects defects, retrieves relevant
maintenance procedures, generates grounded repair guidance, and produces
auditable inspection reports — all operating fully offline.

---

## Current POC Architecture

| Layer | Technology | Status |
|-------|-----------|--------|
| Desktop Shell | Electron v44 | ✅ Verified |
| Frontend | React 19 + TypeScript + Vite 8 + TailwindCSS 4 | ✅ Verified |
| Backend API | Flask REST API (`localhost:7860`) | ✅ Verified |
| Defect Detection | YOLOv11 (`best.pt`) via Ultralytics + OpenCV | ✅ Verified |
| Vector Store | ChromaDB + `all-MiniLM-L6-v2` (sentence-transformers) | ✅ Verified |
| LLM Reasoning | Phi-3 Mini via local Ollama (`localhost:11434`) | ✅ Verified |
| Document Ingestion | PyMuPDF + LangChain text splitters | ✅ Verified |
| Persistence | SQLite (`digital_twin.db`) | ✅ Verified |
| Reporting | ReportLab PDF generation | ✅ Verified |
| Desktop Build | PyInstaller + Inno Setup Windows installer | ✅ Verified |

---

## Core Workflow

```
Image Upload
  → YOLOv11 Detection (defect class, confidence, bounding box, severity)
  → ChromaDB Retrieval (maintenance procedure, source manual, page)
  → Phi-3 Mini Reasoning (grounded repair guidance, 5 actionable steps)
  → Technician Review
  → SQLite Inspection Record
  → PDF Report (ReportLab)
```

---

## AI Agents

| Agent | Module | Role |
|-------|--------|------|
| VisionAgent | `backend/agents/vision_agent.py` | YOLOv11 defect detection with configurable confidence threshold |
| RAGAgent | `backend/agents/rag_agent.py` | ChromaDB maintenance document retrieval with semantic search |
| ReasoningAgent | `backend/agents/reasoning_agent.py` | Phi-3 Mini grounded repair guidance via local Ollama |
| DigitalTwinAgent | `backend/agents/digital_twin.py` | Inspection state management, notifications, audit logging |

---

## Current Implemented Capabilities

- ✅ Electron desktop application with single-instance lock
- ✅ React UI with 9 pages: Dashboard, Inspection, Analysis, Result, Recommendation, Reports, Analytics, DigitalTwin, Manuals
- ✅ Flask REST API with CORS, security headers, error handling
- ✅ YOLOv11 defect detection with adjustable confidence threshold
- ✅ ChromaDB vector store with all-MiniLM-L6-v2 embeddings
- ✅ Local maintenance PDF ingestion via PyMuPDF
- ✅ Phi-3 Mini reasoning through local Ollama runtime
- ✅ SQLite inspection persistence with WAL mode
- ✅ Notification system with severity classification
- ✅ PDF and CSV inspection report generation
- ✅ System diagnostics and health monitoring
- ✅ PyInstaller backend bundling
- ✅ Inno Setup Windows installer
- ✅ 3D aircraft digital twin viewer (Three.js)

## Planned Capabilities

- 🔲 Jetson Orin Nano edge deployment
- 🔲 Industrial camera integration
- 🔲 ONNX / TensorRT model optimization
- 🔲 Offline synchronization queue
- 🔲 AWS cloud integration (DynamoDB + S3)

---

## Local Development

### Prerequisites

- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.ai) with `phi3:mini` model pulled

### 1. Pull the LLM model

```bash
ollama pull phi3:mini
```

### 2. Backend

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
copy .env.example .env          # Windows
# cp .env.example .env          # macOS/Linux

# Start Flask API (port 7860)
python app.py
```

### 3. Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

The Electron shell launches automatically and connects to the Flask backend on `localhost:7860`.

---

## Desktop Build

```bash
# 1. Bundle backend with PyInstaller
pyinstaller aeroedge_backend.spec

# 2. Build Electron app
cd frontend
npm run build

# 3. Create Windows installer (requires Inno Setup)
# Compile: installer/AeroEdge-X.iss
```

See [docs/deployment/DESKTOP_DEPLOYMENT.md](docs/deployment/DESKTOP_DEPLOYMENT.md) for full details.

---

## Vercel Web Demo

The Vercel deployment is a **public web demonstration** of the AeroEdge-X
application workflow. The complete offline-first local AI runtime is
delivered through the Windows desktop application.

The web demo uses sample inspection data to demonstrate the full UI and
workflow without requiring a local Flask backend, Ollama, or AI models.

```bash
# Deploy to Vercel
npm install -g vercel
vercel login
vercel --prod
```

See [docs/deployment/VERCEL_DEPLOYMENT.md](docs/deployment/VERCEL_DEPLOYMENT.md) for configuration details.

---

## Demo Instructions

### Desktop (Full AI Runtime)

1. Install Ollama and pull `phi3:mini`
2. Launch AeroEdge-X desktop application
3. Navigate to **Inspection**
4. Select aircraft and component
5. Upload a defect image (`.jpg` / `.png`, max 16 MB)
6. AI pipeline runs: Detection → Retrieval → Reasoning
7. Review AI-generated guidance in **Recommendation**
8. View inspection records in **Reports**
9. Download PDF inspection report

### Web Demo (Vercel)

1. Visit the Vercel deployment URL
2. Navigate through Dashboard → Inspection → Analysis
3. Upload any image to trigger the demo workflow
4. Review sample detection, retrieval, and reasoning results

---

## Security

- Flask API binds to `127.0.0.1` only — not exposed to network
- Session cookies: `HttpOnly`, `SameSite=Lax`
- CORS restricted to configured frontend origins
- Production config enforces unique `SECRET_KEY`
- Max upload size: 16 MB
- Allowed file types: `.png`, `.jpg`, `.jpeg`
- Security headers: `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`
- Single-instance lock on desktop application
- No secrets in client-side code

See [SECURITY.md](SECURITY.md) for the full security policy.

---

## Project Structure

```
Tata_Innovent/
├── app.py                          # Flask application factory + routes
├── requirements.txt                # Python dependencies
├── aeroedge_backend.spec           # PyInstaller build spec
├── vercel.json                     # Vercel deployment config
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore rules
├── README.md                       # This file
├── SECURITY.md                     # Security policy
├── LICENSE                         # MIT License
│
├── backend/
│   ├── config.py                   # App configuration (Dev / Test / Prod)
│   ├── agents/
│   │   ├── vision_agent.py         # YOLOv11 defect detection
│   │   ├── rag_agent.py            # ChromaDB maintenance retrieval
│   │   ├── reasoning_agent.py      # Phi-3 Mini LLM reasoning
│   │   └── digital_twin.py        # Inspection state + SQLite
│   └── services/
│       └── report_generator.py     # ReportLab PDF generation
│
├── frontend/
│   ├── package.json                # Dependencies + build scripts
│   ├── vite.config.ts              # Vite + Electron (desktop)
│   ├── vite.config.web.ts          # Vite web-only (Vercel)
│   ├── electron/                   # Electron main process
│   └── src/
│       ├── pages/                  # 9 React pages
│       ├── components/             # UI components
│       └── services/api.ts         # API client + demo mode
│
├── models/                         # AI model weights
├── manuals/                        # Maintenance PDF documents
├── data/chroma/                    # ChromaDB vector store
├── database/                       # SQLite database
├── installer/                      # Inno Setup installer script
│
├── docs/
│   ├── deployment/                 # Deployment guides
│   └── pre-read/figures/           # Technical diagrams (Fig 13–25)
│
└── .github/workflows/ci.yml       # GitHub Actions CI
```

---

## Validation Status

| Component | Test Method | Status |
|-----------|-----------|--------|
| Flask API starts | `python app.py` | ✅ |
| VisionAgent loads model | Agent initialization | ✅ |
| RAGAgent builds vectorstore | ChromaDB indexing | ✅ |
| ReasoningAgent connects Ollama | LLM health check | ✅ |
| /analyze endpoint | Image upload → full pipeline | ✅ |
| /history endpoint | SQLite query | ✅ |
| /report endpoint | PDF generation | ✅ |
| Electron desktop launch | `npm run dev` | ✅ |
| Windows installer | Inno Setup compile | ✅ |
| Vercel web build | `npm run build:web` | ✅ |

---

## Roadmap

### Stage 02 (Current) — Desktop POC

- [x] Electron desktop application
- [x] AI inspection pipeline (Vision + RAG + Reasoning)
- [x] SQLite persistence + PDF reporting
- [x] Windows installer
- [x] Vercel web demonstration

### Stage 03 (Planned) — Edge Deployment

- [ ] Jetson Orin Nano deployment
- [ ] Industrial camera integration
- [ ] ONNX / TensorRT model optimization
- [ ] Hardware validation testing

### Stage 04 (Planned) — Cloud Integration

- [ ] Offline synchronization queue
- [ ] AWS DynamoDB integration
- [ ] AWS S3 storage
- [ ] Multi-device fleet management

---

## Team

**Tata Technologies — InnoVent-27**

| Role | Contributor |
|------|-----------|
| Developer | [YashI2IT](https://github.com/YashI2IT) |

---

## License

MIT License — see [LICENSE](LICENSE).
