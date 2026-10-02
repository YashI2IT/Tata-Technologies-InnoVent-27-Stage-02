# AeroEdge-X — Desktop Deployment Guide

## Overview

The Electron desktop application is the primary delivery vehicle for
AeroEdge-X. It provides the complete offline-first AI inspection runtime
with local inference, document retrieval, and report generation.

## Architecture

```
Electron v44 (Desktop Shell)
  ├── React 19 + TypeScript + Vite 8 (UI)
  └── Flask REST API (localhost:7860)
        ├── YOLOv11 (Ultralytics + OpenCV)
        ├── ChromaDB + all-MiniLM-L6-v2
        ├── Phi-3 Mini (Ollama localhost:11434)
        ├── SQLite (digital_twin.db)
        └── ReportLab (PDF generation)
```

## Prerequisites

- Windows 10/11 (x64)
- Python 3.11+
- Node.js 20+
- [Ollama](https://ollama.ai) installed with `phi3:mini` model

## Build Steps

### 1. Pull the LLM model

```bash
ollama pull phi3:mini
```

### 2. Build the Flask backend

```bash
# Activate virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Bundle with PyInstaller
pyinstaller aeroedge_backend.spec
```

Output: `dist/aeroedge-backend/aeroedge-backend.exe`

### 3. Build the Electron frontend

```bash
cd frontend
npm install
npm run build
```

Output: `build/windows/win-unpacked/AeroEdge-X.exe`

### 4. Create the Windows installer

Install [Inno Setup](https://jrsoftware.org/isinfo.php), then compile:

```
installer/AeroEdge-X.iss
```

Output: `installer/output/AeroEdge-X-Setup-v2.exe`

## Installation Directory

```
%LOCALAPPDATA%\Programs\AeroEdge-X\
├── AeroEdge-X.exe              (Electron shell)
└── resources\
    └── aeroedge-backend\
        └── aeroedge-backend.exe  (Flask + AI runtime)
```

## Runtime Data

```
%LOCALAPPDATA%\AeroEdge-X\
├── database\digital_twin.db
├── uploads\
├── reports\
└── logs\
```

## Configuration

Application configuration is read from environment variables.
See `.env.example` for available options.

In production (packaged) mode, the application uses hardened defaults
and does not require a `.env` file.
