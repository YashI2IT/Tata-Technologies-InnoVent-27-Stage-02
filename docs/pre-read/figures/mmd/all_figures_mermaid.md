# AeroEdge-X — Corrected Mermaid Technical Figures (13–25)

---

## FIGURE 13 — AeroEdge-X End-to-End Technician Workflow

```mermaid
flowchart LR
    classDef verified fill:#12C6B3,color:#000000,stroke:#0000B3,stroke-width:1px;
    classDef current fill:#EAF4FF,color:#000000,stroke:#0000B3,stroke-width:1.5px;
    classDef neutral fill:#F5F7FA,color:#000000,stroke:#667085,stroke-width:1px;

    TECH["TECHNICIAN"]:::neutral

    subgraph P1["01 PREPARE"]
        direction TB
        A1["Open AeroEdge-X"]:::current
        A2["Select Aircraft / Component"]:::current
        A3["Configure Inspection"]:::current
        A1 --> A2 --> A3
    end

    subgraph P2["02 CAPTURE"]
        direction TB
        B1["Local Image Upload\n.jpg / .png"]:::current
    end

    subgraph P3["03 INSPECT"]
        direction TB
        C1["YOLOv11\nUltralytics / PyTorch"]:::verified
        C2["Defect Class\nConfidence\nBounding Box\nSeverity"]:::verified
        C1 --> C2
    end

    subgraph P4["04 UNDERSTAND"]
        direction TB
        D1["ChromaDB\nLocal Maintenance Docs"]:::verified
        D2["Phi-3 Mini\nOllama Local Runtime"]:::verified
        D1 --> D2
    end

    subgraph P5["05 RECORD"]
        direction TB
        E1["Technician Review"]:::current
        E2["SQLite\nInspection-State Persistence"]:::verified
        E3["Local Artifacts"]:::current
        E1 --> E2 --> E3
    end

    subgraph P6["06 REPORT"]
        direction TB
        F1["PDF Report\nReportLab"]:::verified
    end

    TECH --> A1
    A3 --> B1
    B1 --> C1
    C2 --> D1
    D2 --> E1
    E3 --> F1
```

---

## FIGURE 14 — AeroEdge-X AI Inspection Pipeline

```mermaid
flowchart LR
    classDef verified fill:#12C6B3,color:#000000,stroke:#0000B3,stroke-width:1px;
    classDef current fill:#EAF4FF,color:#000000,stroke:#0000B3,stroke-width:1.5px;

    subgraph IN["INPUT"]
        I1["Uploaded Image"]:::current
    end

    subgraph VIS["VISION"]
        V1["OpenCV\nPreprocessing"]:::verified
        V2["YOLOv11\nbest.pt"]:::verified
        V3["Detection Evidence\nDefect Class\nConfidence\nBounding Box\nSeverity"]:::verified
        V1 --> V2 --> V3
    end

    subgraph KNO["KNOWLEDGE"]
        K1["Inspection Context\nDefect Type + Severity"]:::current
        K2["ChromaDB\nall-MiniLM-L6-v2\nSimilarity k=3"]:::verified
        K3["Local Maintenance PDFs\nPyMuPDF Ingestion"]:::verified
        K4["Retrieved Evidence\nProcedure / Source / Page"]:::verified
        K3 --> K2
        K1 --> K2
        K2 --> K4
    end

    subgraph REA["REASONING"]
        R1["Phi-3 Mini\nOllama localhost:11434"]:::verified
        R2["Grounded Maintenance Guidance\n5 Repair Steps"]:::verified
        R1 --> R2
    end

    subgraph OUT["OUTPUT"]
        O1["SQLite\nInspection Record"]:::verified
        O2["PDF Report\nReportLab"]:::verified
        O1 --> O2
    end

    I1 --> V1
    V3 --> K1
    K4 --> R1
    R2 --> O1
```

---

## FIGURE 15 — AeroEdge-X Current System Architecture

```mermaid
flowchart TB
    classDef verified fill:#12C6B3,color:#000000,stroke:#0000B3,stroke-width:1px;
    classDef current fill:#EAF4FF,color:#000000,stroke:#0000B3,stroke-width:1.5px;

    subgraph APP["TECHNICIAN APPLICATION"]
        direction LR
        T1["Electron Desktop\nWindows Installer"]:::verified
        T2["React UI\nVite + TypeScript"]:::verified
    end

    subgraph SVC["LOCAL SERVICE / WORKFLOW"]
        direction LR
        S1["Flask REST API\nPort 7860"]:::verified
        S2["Inspection Workflow\nVision → RAG → Reasoning → Persist"]:::current
    end

    subgraph AIK["AI + KNOWLEDGE"]
        direction LR
        A1["OpenCV"]:::verified
        A2["YOLOv11\nbest.pt"]:::verified
        A3["ChromaDB\nall-MiniLM-L6-v2"]:::verified
        A4["Phi-3 Mini\nOllama"]:::verified
    end

    subgraph DAT["LOCAL DATA + OUTPUT"]
        direction LR
        D1["SQLite\nInspection-State\nPersistence"]:::verified
        D2["Local Images\nUploads"]:::verified
        D3["Maintenance PDFs\nManuals"]:::verified
        D4["PDF Report\nReportLab"]:::verified
    end

    T1 --- T2
    T2 -->|"HTTP"| S1
    S1 --- S2
    S2 --> A1
    A1 --> A2
    S2 --> A3
    A3 --> A4
    D3 -->|"Indexing"| A3
    A2 -->|"Detection"| S2
    A4 -->|"Guidance"| S2
    S2 -->|"Persist"| D1
    S2 -->|"Store"| D2
    D1 --> D4
```

---

## FIGURE 16 — AeroEdge-X Edge + Cloud Evolution

```mermaid
flowchart LR
    classDef verified fill:#12C6B3,color:#000000,stroke:#0000B3,stroke-width:1px;
    classDef planned fill:#FFF4E0,color:#000000,stroke:#FF9C00,stroke-width:1.5px,stroke-dasharray:6 4;
    classDef future fill:#F3E8FF,color:#000000,stroke:#7B2CBF,stroke-width:1.5px,stroke-dasharray:6 4;

    subgraph CUR["CURRENT VERIFIED"]
        direction TB
        C1["Electron + React UI"]:::verified
        C2["Flask REST API"]:::verified
        C3["YOLOv11"]:::verified
        C4["ChromaDB + Phi-3 Mini"]:::verified
        C5["SQLite + PDF Report"]:::verified
    end

    subgraph NXT["NEXT IMPLEMENTATION — PLANNED"]
        direction TB
        N1["Jetson Orin Nano"]:::planned
        N2["Industrial Camera"]:::planned
        N3["ONNX / TensorRT"]:::planned
        N4["Offline Sync Queue"]:::planned
    end

    subgraph TGT["TARGET CLOUD"]
        direction TB
        F1["AWS Synchronisation Layer"]:::future
        F2["DynamoDB\nInspection Metadata"]:::future
        F3["S3\nImages + Reports"]:::future
    end

    C5 -->|"Edge Deployment\nPLANNED"| N1
    N4 -->|"Cloud Integration\nFUTURE"| F1
```

---

## FIGURE 17 — AeroEdge-X Offline-First Synchronization — Target Workflow

```mermaid
flowchart TD
    classDef verified fill:#12C6B3,color:#000000,stroke:#0000B3,stroke-width:1px;
    classDef current fill:#EAF4FF,color:#000000,stroke:#0000B3,stroke-width:1.5px;
    classDef planned fill:#FFF4E0,color:#000000,stroke:#FF9C00,stroke-width:1.5px,stroke-dasharray:6 4;

    W1["Inspection Complete"]:::current
    W2["Local Inspection Record\n+ Artifacts Saved\nSQLite + Local Storage"]:::verified
    W3["Create Sync Job\nPLANNED"]:::planned
    W4["Status: PENDING\nPLANNED"]:::planned
    W5{{"Internet\nAvailable?\nPLANNED"}}:::planned
    W6["Keep Local"]:::planned
    W7["Retry Later"]:::planned
    W8["Sync Worker\nPLANNED"]:::planned
    W9["Secure Cloud API\nPLANNED"]:::planned
    W10["Metadata + Artifacts\nUploaded\nPLANNED"]:::planned
    W11["Cloud Write Confirmed\nPLANNED"]:::planned
    W12["Local Status = SYNCED\nPLANNED"]:::planned

    W1 --> W2 --> W3 --> W4 --> W5
    W5 -->|"NO"| W6 --> W7 --> W5
    W5 -->|"YES"| W8 --> W9 --> W10 --> W11 --> W12
```

---

## FIGURE 18 — AeroEdge-X Jetson Orin Nano Edge Deployment — Target

```mermaid
flowchart LR
    classDef planned fill:#FFF4E0,color:#000000,stroke:#FF9C00,stroke-width:1.5px,stroke-dasharray:6 4;
    classDef neutral fill:#F5F7FA,color:#000000,stroke:#667085,stroke-width:1px;

    TITLE["TARGET EDGE DEPLOYMENT\nNOT YET VERIFIED"]:::neutral

    subgraph CAP["IMAGE CAPTURE — PLANNED"]
        direction TB
        J1["Industrial Camera\nPLANNED"]:::planned
        J2["Frame Capture\nPLANNED"]:::planned
        J1 --> J2
    end

    subgraph JET["JETSON ORIN NANO — PLANNED"]
        direction TB
        J3["Jetson Orin Nano"]:::planned
        J4["OpenCV\nEdge Port"]:::planned
        J5["TensorRT-Optimised\nYOLOv11"]:::planned
        J6["Detection Output"]:::planned
        J7["Local AI Pipeline"]:::planned
        J3 --> J4 --> J5 --> J6 --> J7
    end

    subgraph VAL["VALIDATION METRICS — TBD"]
        direction TB
        V1["Inference Latency\nTBD"]:::planned
        V2["GPU Utilisation\nTBD"]:::planned
        V3["RAM Usage\nTBD"]:::planned
        V4["Temperature\nTBD"]:::planned
        V5["Power Draw\nTBD"]:::planned
    end

    TITLE ~~~ CAP
    J2 --> J3
    J7 --> V1
```

---

## FIGURE 19 — AeroEdge-X AWS Synchronization Architecture — Target

```mermaid
flowchart LR
    classDef verified fill:#12C6B3,color:#000000,stroke:#0000B3,stroke-width:1px;
    classDef planned fill:#FFF4E0,color:#000000,stroke:#FF9C00,stroke-width:1.5px,stroke-dasharray:6 4;
    classDef future fill:#F3E8FF,color:#000000,stroke:#7B2CBF,stroke-width:1.5px,stroke-dasharray:6 4;
    classDef neutral fill:#F5F7FA,color:#000000,stroke:#667085,stroke-width:1px;

    TITLE["TARGET ARCHITECTURE\nNOT YET IMPLEMENTED"]:::neutral

    subgraph EDG["EDGE"]
        direction TB
        E1["Local Inspection\nCompleted"]:::verified
        E2["SQLite + Local Artifacts"]:::verified
        E3["Sync Queue\nPLANNED"]:::planned
        E4["Secure API\nPLANNED"]:::planned
        E1 --> E2 --> E3 --> E4
    end

    subgraph CLD["AWS CLOUD — TARGET"]
        direction TB
        A1["DynamoDB\nInspection Metadata\nTARGET"]:::future
        A2["S3\nImages + Reports\nTARGET"]:::future
    end

    W1["Cloud Write Confirmation\nPLANNED"]:::planned
    W2["Local Sync Status\nPLANNED"]:::planned

    TITLE ~~~ EDG
    E4 -->|"HTTPS\nPLANNED"| A1
    E4 -->|"HTTPS\nPLANNED"| A2
    A1 --> W1
    A2 --> W1
    W1 --> W2
```

---

## FIGURE 20 — AeroEdge-X Inspection Data Flow

```mermaid
flowchart TD
    classDef verified fill:#12C6B3,color:#000000,stroke:#0000B3,stroke-width:1px;
    classDef current fill:#EAF4FF,color:#000000,stroke:#0000B3,stroke-width:1.5px;
    classDef planned fill:#FFF4E0,color:#000000,stroke:#FF9C00,stroke-width:1.5px,stroke-dasharray:6 4;

    IC["Aircraft / Component\nInspection Context"]:::current
    IMG["Image\nimage_path"]:::verified
    DET["Detection Metadata\ndefect_type / confidence\nbounding_box / severity"]:::verified
    RET["Retrieved Maintenance Context\nprocedure / source / page"]:::verified
    GEN["AI Guidance\nreasoning_steps"]:::verified
    REC["Inspection Record\nid / timestamp / image_path\nprimary_defect / severity\nprocedure / source / page\nreasoning_steps"]:::verified
    RPT["Report Artifact\npdf_path"]:::verified
    STR["Local Storage\nSQLite + Uploads + Reports"]:::verified
    SYN["Cloud Synchronisation\nPLANNED"]:::planned

    IC --> IMG --> DET --> RET --> GEN --> REC --> RPT --> STR --> SYN
```

---

## FIGURE 21 — AeroEdge-X Inspection Evidence Traceability

```mermaid
flowchart LR
    classDef verified fill:#12C6B3,color:#000000,stroke:#0000B3,stroke-width:1px;
    classDef current fill:#EAF4FF,color:#000000,stroke:#0000B3,stroke-width:1.5px;
    classDef neutral fill:#F5F7FA,color:#000000,stroke:#667085,stroke-width:1px;

    subgraph VE["VISUAL EVIDENCE"]
        direction TB
        V1["Captured Image"]:::verified
        V2["YOLOv11 Detection"]:::verified
        V3["Bounding Box +\nConfidence"]:::verified
        V1 --> V2 --> V3
    end

    subgraph ME["MAINTENANCE EVIDENCE"]
        direction TB
        M1["Maintenance PDF"]:::verified
        M2["ChromaDB Retrieval\nSource + Page"]:::verified
        M3["Retrieved Context"]:::verified
        M1 --> M2 --> M3
    end

    subgraph GG["GENERATED GUIDANCE"]
        direction TB
        G1["Phi-3 Mini\nOllama"]:::verified
        G2["Grounded Guidance\n5 Repair Steps"]:::verified
        G1 --> G2
    end

    subgraph HR["HUMAN REVIEW"]
        H1["Technician Review"]:::current
    end

    subgraph RO["RECORDED OUTPUT"]
        direction TB
        O1["SQLite\nInspection Record"]:::verified
        O2["PDF Report"]:::verified
        O1 --> O2
    end

    V3 --> G1
    M3 --> G1
    G2 --> H1
    H1 --> O1

    CHAIN["Image > Evidence > Source > Guidance > Record > Report"]:::neutral
```

---

## FIGURE 22 — AeroEdge-X Current Status and Roadmap

```mermaid
flowchart LR
    classDef verified fill:#12C6B3,color:#000000,stroke:#0000B3,stroke-width:1px;
    classDef planned fill:#FFF4E0,color:#000000,stroke:#FF9C00,stroke-width:1.5px,stroke-dasharray:6 4;
    classDef future fill:#F3E8FF,color:#000000,stroke:#7B2CBF,stroke-width:1.5px,stroke-dasharray:6 4;

    subgraph M1["M1 — COMPLETED"]
        M1A["Core AI POC\nYOLOv11 / ChromaDB\nPhi-3 Mini / SQLite / PDF"]:::verified
    end

    subgraph M2["M2 — COMPLETED"]
        M2A["Architecture + Desktop\nElectron / React / Flask"]:::verified
    end

    subgraph M3["M3 — NEXT IMPLEMENTATION"]
        M3A["Jetson / Camera\nONNX / TensorRT\nAWS Synchronisation"]:::planned
    end

    subgraph M4["M4 — REMAINING VALIDATION"]
        M4A["End-to-End Integration\nDataset Validation\nLatency Measurement\nResource Profiling\nOffline / Reconnect"]:::planned
    end

    subgraph M5["M5 — STAGE 3 TARGET"]
        M5A["End-to-End Prototype\nJanuary 2027"]:::future
    end

    subgraph M6["M6 — FUTURE SCOPE"]
        M6A["Thermal / Multimodal\nMulti-Camera / Multi-Jetson\nFleet Analytics / Digital Twin\nPredictive Maintenance\nProduction Controls"]:::future
    end

    M1 --> M2 --> M3 --> M4 --> M5 --> M6
```

---

## FIGURE 23 — AeroEdge-X Future Evolution

```mermaid
flowchart LR
    classDef future fill:#F3E8FF,color:#000000,stroke:#7B2CBF,stroke-width:1.5px,stroke-dasharray:6 4;

    subgraph INS["INSPECTION"]
        direction TB
        I1["Real-Time Industrial Camera"]:::future
        I2["Thermal Sensing\nIR Camera"]:::future
        I3["RGB + Thermal\nMultimodal Inspection"]:::future
    end

    subgraph ESC["EDGE SCALE"]
        direction TB
        E1["Multi-Camera\nSingle Jetson"]:::future
        E2["Multi-Jetson\nDistributed Edge"]:::future
    end

    subgraph FLT["FLEET"]
        direction TB
        F1["AWS Fleet Analytics"]:::future
        F2["Fleet Management"]:::future
    end

    subgraph INT["INTELLIGENCE"]
        direction TB
        N1["Advanced Digital Twin"]:::future
        N2["Predictive Maintenance"]:::future
        N3["Technician Feedback"]:::future
        N4["Model Monitoring\nControlled Retraining"]:::future
    end

    subgraph PRD["PRODUCTION CONTROLS"]
        direction TB
        P1["Human Approval\nAudit Trail"]:::future
        P2["RBAC"]:::future
        P3["Secure Device Identity\nEncryption"]:::future
        P4["Versioned Models\nSigned Updates\nRollback / Recovery"]:::future
    end

    INS --> ESC --> FLT --> INT --> PRD
```

---

## FIGURE 24 — AeroEdge-X Prototype Validation Plan

```mermaid
flowchart TD
    classDef verified fill:#12C6B3,color:#000000,stroke:#0000B3,stroke-width:1px;
    classDef planned fill:#FFF4E0,color:#000000,stroke:#FF9C00,stroke-width:1.5px,stroke-dasharray:6 4;
    classDef neutral fill:#F5F7FA,color:#000000,stroke:#667085,stroke-width:1px;

    ROOT["AeroEdge-X\nPrototype Validation Plan"]:::neutral

    subgraph VFD["VERIFIED"]
        direction LR
        V1["Offline Inspection\nComplete local workflow\nVERIFIED"]:::verified
        V2["Defect Detection\nYOLOv11 localisation\nVERIFIED"]:::verified
        V3["RAG Retrieval\nCorrect source + page\nVERIFIED"]:::verified
        V4["Local Reasoning\nGrounded guidance\nVERIFIED"]:::verified
        V5["Persistence\nSQLite record\nVERIFIED"]:::verified
        V6["Reporting\nPDF via ReportLab\nVERIFIED"]:::verified
    end

    subgraph PLN["PLANNED — NOT YET VERIFIED"]
        direction LR
        P1["Jetson\nEdge inference\nPLANNED"]:::planned
        P2["Industrial Camera\nLive acquisition\nPLANNED"]:::planned
        P3["Synchronisation\nOffline queue + reconnect\nPLANNED"]:::planned
        P4["Recovery\nRestart / network failure\nPLANNED"]:::planned
        P5["Performance\nLatency / RAM / GPU / Temp\nPLANNED — no data"]:::planned
    end

    ROOT --> VFD
    ROOT --> PLN
```

---

## FIGURE 25 — AeroEdge-X Architecture Evolution

```mermaid
flowchart LR
    classDef verified fill:#12C6B3,color:#000000,stroke:#0000B3,stroke-width:1px;
    classDef planned fill:#FFF4E0,color:#000000,stroke:#FF9C00,stroke-width:1.5px,stroke-dasharray:6 4;
    classDef future fill:#F3E8FF,color:#000000,stroke:#7B2CBF,stroke-width:1.5px,stroke-dasharray:6 4;

    subgraph S1["STAGE 1 — LOCAL POC\nVERIFIED"]
        direction TB
        L1["Electron + React"]:::verified
        L2["Flask REST API"]:::verified
        L3["YOLOv11 — best.pt"]:::verified
        L4["ChromaDB\nall-MiniLM-L6-v2"]:::verified
        L5["Phi-3 Mini / Ollama"]:::verified
        L6["SQLite + PDF"]:::verified
    end

    subgraph S2["STAGE 2 — EDGE + CLOUD\nNEXT IMPLEMENTATION"]
        direction TB
        E1["Jetson Orin Nano\nPLANNED"]:::planned
        E2["Industrial Camera\nPLANNED"]:::planned
        E3["ONNX / TensorRT\nPLANNED"]:::planned
        E4["Offline Sync Queue\nPLANNED"]:::planned
        E5["AWS Synchronisation\nPLANNED"]:::planned
    end

    subgraph S3["STAGE 3 — SCALABLE PROTOTYPE\nFUTURE"]
        direction TB
        F1["Multi-Jetson\nDistributed Edge"]:::future
        F2["Fleet Analytics"]:::future
        F3["Advanced Digital Twin"]:::future
        F4["Production Controls"]:::future
    end

    L6 -->|"Edge Deployment\nPLANNED"| E1
    E5 -->|"Scale + Harden\nFUTURE"| F1
```
