# AeroEdge-X — Vercel Deployment Guide

## Overview

The Vercel deployment is a **public web demonstration** of the AeroEdge-X
application workflow. The complete offline-first local AI runtime is
delivered through the Windows desktop application.

## What the Vercel Demo Provides

- Full React UI with all 9 pages
- Interactive inspection workflow demonstration
- Sample AI detection, retrieval, and reasoning results
- Dashboard, analytics, and report views

## What the Vercel Demo Does NOT Provide

- Real-time YOLOv11 inference
- Local Ollama/Phi-3 Mini execution
- ChromaDB vector retrieval
- SQLite persistence
- PDF report generation
- Electron desktop features

## Deployment

### Prerequisites

- [Vercel CLI](https://vercel.com/docs/cli) installed
- GitHub repository connected to Vercel

### Deploy

```bash
# From repository root
npm install -g vercel
vercel login
vercel          # Preview deployment
vercel --prod   # Production deployment
```

### Configuration

The `vercel.json` in the repository root configures:

- **Build Command**: `cd frontend && npm install && npm run build:web`
- **Output Directory**: `frontend/dist`
- **SPA Routing**: All routes rewrite to `index.html`

### Environment Variables (Vercel Dashboard)

| Variable | Type | Value |
|----------|------|-------|
| `VITE_DEMO_MODE` | Config | `true` |
| `VITE_API_BASE_URL` | Config | (leave empty for demo mode) |

### Demo Mode

When `VITE_DEMO_MODE=true` or when the app detects a non-localhost host
without a configured API URL, it automatically switches to demo mode.

Demo mode provides:
- Sample inspection results (crack detection, confidence 0.87)
- Sample maintenance retrieval (AC 43.13-1B)
- Sample repair guidance (5 steps)
- Sample inspection history (3 records)
- Sample diagnostics telemetry

All demo data is clearly labeled. No fabricated performance metrics.

## Architecture

```
Vercel CDN
  └── React SPA (Vite build)
        └── Demo Mode API layer (client-side)
              └── Sample data responses
```

No server-side Flask, Ollama, or database is required.
