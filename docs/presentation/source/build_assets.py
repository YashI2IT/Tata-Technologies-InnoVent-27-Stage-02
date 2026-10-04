import os
import json
import subprocess
from pathlib import Path

BASE = Path(r"d:\Tata Innovent\Tata_Innovent-main\docs\presentation")
SRC_DIR = BASE / "source"
ASSETS_DIR = BASE / "assets"

SRC_DIR.mkdir(parents=True, exist_ok=True)
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

MERMAID_CONFIG = {
    "theme": "base",
    "themeVariables": {
        "primaryColor": "#EAF4FF",
        "primaryTextColor": "#000000",
        "primaryBorderColor": "#0000B3",
        "lineColor": "#000000",
        "secondaryColor": "#FFFFFF",
        "tertiaryColor": "#12C6B3",
        "fontFamily": "Arial",
        "fontSize": "18px",
        "nodeTextSize": "16px"
    },
    "flowchart": {
        "curve": "linear",
        "padding": 20,
        "nodeSpacing": 50,
        "rankSpacing": 80,
        "htmlLabels": True
    }
}

DIAGRAMS = {
    "01_problem_gaps": """
flowchart LR
    classDef gap fill:#FF9C00,stroke:#000000,stroke-width:2px,color:#000000
    classDef impact fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000
    
    A1["01 CONNECTIVITY<br/>Inspection support becomes unavailable<br/>when restricted"]:::gap --> B1["Loss of reference data<br/>at point of inspection"]:::impact
    A2["02 DOCUMENTATION<br/>Large collections of manuals"]:::gap --> B2["Time wasted searching<br/>for correct procedures"]:::impact
    A3["03 VISUAL INSPECTION<br/>Inconsistent reporting"]:::gap --> B3["Subjective findings lacking<br/>objective evidence"]:::impact
    A4["04 REPAIR GUIDANCE<br/>Defect translation requires context"]:::gap --> B4["Slower decision making<br/>on the tarmac"]:::impact
    A5["05 TRACEABILITY<br/>Manual logbooks"]:::gap --> B5["Incomplete digital thread<br/>for the component"]:::impact
    """,

    "02_objective_workflow": """
flowchart LR
    classDef step fill:#0000B3,stroke:#000000,stroke-width:2px,color:#FFFFFF
    classDef tech fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000
    classDef info fill:#12C6B3,stroke:#000000,stroke-width:2px,color:#000000

    C["CAPTURE"]:::step --> D["DETECT"]:::step --> R1["RETRIEVE"]:::step --> R2["REASON"]:::step --> R3["REVIEW"]:::step --> R4["RECORD"]:::step --> R5["REPORT"]:::step
    
    C --- CT["Camera / Image"]:::tech
    D --- DT["YOLOv11 + OpenCV"]:::tech
    R1 --- RT["ChromaDB"]:::tech
    R2 --- R2T["Phi-3 Mini"]:::tech
    R3 --- R3T["Technician UI"]:::tech
    R4 --- R4T["SQLite"]:::tech
    R5 --- R5T["ReportLab PDF"]:::tech

    I["OFFLINE-FIRST PRINCIPLE:<br/>Inference local.<br/>Evidence local.<br/>State local.<br/>Synchronize later."]:::info
    R3 -.-> I
    """,

    "03_solution_pipeline": """
flowchart TD
    classDef module fill:#0000B3,stroke:#000000,stroke-width:2px,color:#FFFFFF,width:250px
    classDef out fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000,width:250px

    M1["01 VISION<br/>YOLOv11 + OpenCV"]:::module
    O1["Defect class<br/>Bounding box<br/>Confidence<br/>Severity"]:::out
    M1 --> O1

    M2["02 KNOWLEDGE<br/>ChromaDB + Manuals"]:::module
    O2["Relevant evidence<br/>Source/page reference"]:::out
    M2 --> O2

    M3["03 REASONING<br/>Phi-3 Mini + Ollama"]:::module
    O3["Grounded maintenance<br/>guidance steps"]:::out
    M3 --> O3

    M4["04 INSPECTION STATE<br/>SQLite"]:::module
    O4["Inspection record<br/>Component history"]:::out
    M4 --> O4

    M5["05 REPORTING<br/>ReportLab"]:::module
    O5["Traceable PDF report"]:::out
    M5 --> O5

    O1 --> M2
    O2 --> M3
    O3 --> M4
    O4 --> M5
    """,

    "04_current_poc_architecture": """
flowchart TD
    classDef current fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000
    classDef verified fill:#12C6B3,stroke:#000000,stroke-width:2px,color:#000000

    subgraph ZONE_A ["ZONE A: CURRENT VERIFIED POC"]
        direction TB
        E["Electron Desktop"]:::current
        R["React UI"]:::current
        F["Flask REST API"]:::current
        
        subgraph AI ["AI Workflow (Local)"]
            direction TB
            V["OpenCV + YOLOv11"]:::current
            K["ChromaDB + all-MiniLM-L6-v2"]:::current
            L["Phi-3 Mini + Ollama"]:::current
        end
        
        S["SQLite Database"]:::current
        A["Local Images / Artifacts"]:::current
        P["ReportLab PDF Generation"]:::current
        
        E --> R --> F --> AI
        AI --> S
        S --> A
        A --> P
    end
    
    L1["CURRENT / VERIFIED"]:::verified
    ZONE_A -.-> L1
    """,

    "05_edge_cloud_evolution": """
flowchart LR
    classDef current fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000
    classDef planned fill:#FFFFFF,stroke:#FF9C00,stroke-width:2px,stroke-dasharray: 5 5,color:#000000
    
    subgraph Z1 ["1. CURRENT VERIFIED"]
        A["Desktop Application<br/>Local AI Pipeline"]:::current
    end
    
    subgraph Z2 ["2. NEXT IMPLEMENTATION"]
        B["Jetson Orin Nano<br/>Industrial Camera<br/>ONNX / TensorRT"]:::planned
    end
    
    subgraph Z3 ["3. TARGET CLOUD"]
        C["Offline Sync Outbox<br/>AWS DynamoDB<br/>AWS S3"]:::planned
    end
    
    Z1 ==>|Evolution| Z2
    Z2 ==>|Cloud Integration| Z3
    """,

    "06_technical_implementation_table": """
flowchart TD
    classDef header fill:#0000B3,stroke:#000000,stroke-width:2px,color:#FFFFFF,font-weight:bold
    classDef cell_cur fill:#EAF4FF,stroke:#0000B3,stroke-width:1px,color:#000000
    classDef cell_next fill:#FFFFFF,stroke:#FF9C00,stroke-width:1px,stroke-dasharray: 3 3,color:#000000

    subgraph TABLE ["Technical Implementation Table"]
        direction LR
        
        subgraph LAYER ["Layer"]
            direction TB
            H1["Layer"]:::header
            L1["Desktop"]:::cell_cur
            L2["Vision"]:::cell_cur
            L3["Knowledge"]:::cell_cur
            L4["Reasoning"]:::cell_cur
            L5["Persistence"]:::cell_cur
            L6["Reporting"]:::cell_cur
            L7["Edge"]:::cell_cur
            L8["Cloud"]:::cell_cur
        end
        
        subgraph CURRENT ["Current POC (Verified)"]
            direction TB
            H2["Current POC"]:::header
            C1["Electron + React"]:::cell_cur
            C2["YOLOv11 + OpenCV"]:::cell_cur
            C3["ChromaDB + all-MiniLM-L6-v2"]:::cell_cur
            C4["Phi-3 Mini + Ollama"]:::cell_cur
            C5["SQLite + local files"]:::cell_cur
            C6["ReportLab PDF"]:::cell_cur
            C7["---"]:::cell_cur
            C8["---"]:::cell_cur
        end
        
        subgraph NEXT ["Next (Planned)"]
            direction TB
            H3["Next"]:::header
            N1["---"]:::cell_next
            N2["ONNX / TensorRT"]:::cell_next
            N3["---"]:::cell_next
            N4["Edge optimization"]:::cell_next
            N5["Offline sync outbox"]:::cell_next
            N6["---"]:::cell_next
            N7["Jetson Orin Nano + Camera"]:::cell_next
            N8["DynamoDB + S3"]:::cell_next
        end
        
        LAYER ~~~ CURRENT ~~~ NEXT
    end
    """,

    "07_novelty_integration": """
flowchart TD
    classDef block fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000
    classDef main fill:#0000B3,stroke:#000000,stroke-width:2px,color:#FFFFFF,font-size:20px
    classDef res fill:#12C6B3,stroke:#000000,stroke-width:2px,color:#000000,font-weight:bold

    B1["Computer Vision"]:::block
    B2["Maintenance Retrieval"]:::block
    B3["Local LLM Reasoning"]:::block
    B4["Technician Review"]:::block
    B5["Inspection-State Persistence"]:::block
    B6["Reporting"]:::block

    B1 & B2 & B3 & B4 & B5 & B6 --> M["AeroEdge-X"]:::main
    
    M --> R["Connectivity-restricted point-of-inspection workflow"]:::res
    """,

    "08_differentiation_handoffs": """
flowchart LR
    classDef stage fill:#0000B3,stroke:#000000,stroke-width:2px,color:#FFFFFF
    classDef act fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000

    S1["Inspection<br/>↓<br/>Evidence"]:::stage
    A1["YOLOv11 converts<br/>imagery into<br/>defect evidence"]:::act
    S1 --- A1

    S2["Evidence<br/>↓<br/>Context"]:::stage
    A2["Detected finding<br/>supports local<br/>manual retrieval"]:::act
    S2 --- A2

    S3["Context<br/>↓<br/>Guidance"]:::stage
    A3["Phi-3 Mini<br/>receives retrieved<br/>maintenance context"]:::act
    S3 --- A3

    S4["Guidance<br/>↓<br/>Record"]:::stage
    A4["Technician review,<br/>SQLite state,<br/>PDF report retained"]:::act
    S4 --- A4

    S1 --> S2 --> S3 --> S4
    """,

    "09_challenges_matrix": """
flowchart TD
    classDef header fill:#0000B3,stroke:#000000,stroke-width:2px,color:#FFFFFF,font-weight:bold
    classDef row fill:#EAF4FF,stroke:#0000B3,stroke-width:1px,color:#000000

    subgraph MATRIX ["Engineering Challenges"]
        direction LR
        
        subgraph C ["Challenge"]
            direction TB
            H1["Challenge"]:::header
            R1A["Grounding"]:::row
            R2A["Agent Handoff"]:::row
            R3A["Offline Operation"]:::row
            R4A["Edge Migration"]:::row
            R5A["Traceable Reporting"]:::row
        end
        
        subgraph E ["Engineering Response"]
            direction TB
            H2["Engineering Response"]:::header
            R1B["Local retrieval + source/page context"]:::row
            R2B["Structured inspection data between stages"]:::row
            R3B["Local inference + local retrieval + SQLite"]:::row
            R4B["Hardware-independent POC before Jetson"]:::row
            R5B["Structured inspection record + PDF"]:::row
        end
        
        C ~~~ E
    end
    """,

    "10_results_evidence": """
flowchart TD
    classDef card fill:#FFFFFF,stroke:#0000B3,stroke-width:4px,color:#000000
    classDef hl fill:#12C6B3,stroke:#000000,stroke-width:2px,color:#000000
    classDef field fill:#EAF4FF,stroke:#0000B3,stroke-width:1px,color:#000000

    subgraph CARD ["Verified Evidence Card: Inspection #2"]
        direction TB
        F1["DETECTION:<br/>DENT"]:::field
        F2["MODEL CONFIDENCE:<br/>86.0%"]:::hl
        F3["SEVERITY:<br/>HIGH"]:::field
        F4["MAINTENANCE SOURCE:<br/>AC 43.13-1B (Page 150)"]:::field
        F5["GROUNDED GUIDANCE:<br/>6 repair-guidance steps"]:::field
        F6["LOCAL OUTPUT:<br/>SQLite record + PDF Report"]:::field
        
        F1 ~~~ F2 ~~~ F3 ~~~ F4 ~~~ F5 ~~~ F6
    end
    """,

    "11_demo_storyboard": """
flowchart LR
    classDef thumb fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000,width:180px,height:120px
    classDef arr fill:none,stroke:none

    T1["01<br/>Inspection Setup"]:::thumb --> T2["02<br/>Image Upload"]:::thumb
    T2 --> T3["03<br/>Detection"]:::thumb
    T3 --> T4["04<br/>Retrieval"]:::thumb
    T4 --> T5["05<br/>Recommendation"]:::thumb
    T5 --> T6["06<br/>Review"]:::thumb
    T6 --> T7["07<br/>Record"]:::thumb
    T7 --> T8["08<br/>Report"]:::thumb
    """,

    "12_project_timeline": """
flowchart LR
    classDef comp fill:#12C6B3,stroke:#000000,stroke-width:2px,color:#000000
    classDef next fill:#FF9C00,stroke:#000000,stroke-width:2px,color:#000000
    classDef tgt fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000

    S1["COMPLETED<br/>Stage 1:<br/>Core software POC<br/>(YOLO, RAG, LLM)"]:::comp
    S2["COMPLETED<br/>Stage 2:<br/>Desktop Packaging<br/>(Electron, UI, Installer)"]:::comp
    S3["NEXT<br/>Stage 3:<br/>Jetson + Camera<br/>ONNX / Sync"]:::next
    S4["REMAINING<br/>Validation:<br/>Offline/Online Testing<br/>Thermal Profiling"]:::next
    S5["TARGET<br/>Jan 2027<br/>End-to-End Prototype"]:::tgt

    S1 ==> S2 ==> S3 ==> S4 ==> S5
    """,

    "13_offline_sync_future": """
flowchart TD
    classDef planned fill:#FFFFFF,stroke:#FF9C00,stroke-width:2px,stroke-dasharray: 5 5,color:#000000
    classDef decision fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000

    A["Inspection Complete"]:::planned --> B["Local Record (SQLite)"]:::planned
    B --> C["PENDING Status"]:::planned
    C --> D{{"Connectivity Available?"}}:::decision
    
    D -->|NO| E["Keep Local & Retry"]:::planned
    D -->|YES| F["Sync"]:::planned
    
    F --> G["AWS DynamoDB / S3"]:::planned
    G --> H["Cloud ACK"]:::planned
    H --> I["SYNCED Status"]:::planned
    
    subgraph PLANNED ["PLANNED ARCHITECTURE (NEXT STAGE)"]
        A
    end
    """,

    "14_inspection_data_flow": """
flowchart LR
    classDef node fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000
    classDef tech fill:#0000B3,stroke:#000000,stroke-width:1px,color:#FFFFFF,font-size:12px

    A["Aircraft"]:::node --> B["Image"]:::node
    B -->|YOLOv11| C["Detection<br/>Metadata"]:::node
    C -->|ChromaDB| D["Maintenance<br/>Context"]:::node
    D -->|Phi-3 Mini| E["Grounded<br/>Guidance"]:::node
    E -->|React UI| F["Technician<br/>Review"]:::node
    F -->|SQLite| G["Inspection<br/>Record"]:::node
    G -->|ReportLab| H["PDF<br/>Report"]:::node
    """,

    "15_evidence_traceability": """
flowchart TD
    classDef ev fill:#EAF4FF,stroke:#0000B3,stroke-width:2px,color:#000000
    classDef act fill:#0000B3,stroke:#000000,stroke-width:2px,color:#FFFFFF

    subgraph SE ["INSPECTION EVIDENCE"]
        direction TB
        E1["Image"]:::ev --> E2["Defect"]:::ev --> E3["Bounding Box"]:::ev --> E4["Confidence"]:::ev --> E5["Severity"]:::ev
    end

    subgraph SM ["MAINTENANCE EVIDENCE"]
        direction TB
        M1["Manual"]:::ev --> M2["Retrieved Context"]:::ev --> M3["Source"]:::ev --> M4["Page"]:::ev
    end

    SE --> LLM["Phi-3 Mini"]:::act
    SM --> LLM

    LLM --> G["Grounded Guidance"]:::ev
    G --> R["Technician Review"]:::act
    R --> S["SQLite"]:::ev
    S --> P["PDF"]:::ev
    """
}

# Write config files
with open(SRC_DIR / "mermaid_config.json", "w") as f:
    json.dump(MERMAID_CONFIG, f, indent=2)

pup_config = {"args": ["--no-sandbox", "--disable-setuid-sandbox"]}
chrome_paths = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
]
for p in chrome_paths:
    if os.path.exists(p):
        pup_config["executablePath"] = p
        break

with open(SRC_DIR / "puppeteer_config.json", "w") as f:
    json.dump(pup_config, f, indent=2)

with open(SRC_DIR / "package.json", "w") as f:
    json.dump({"name": "presentation-builder", "dependencies": {"@mermaid-js/mermaid-cli": "^10.8.0"}}, f)

# Write batch script to render
with open(SRC_DIR / "render_all.bat", "w") as f:
    f.write("@echo off\n")
    f.write("call npm install\n")
    for name, code in DIAGRAMS.items():
        mmd_path = SRC_DIR / f"{name}.mmd"
        png_path = ASSETS_DIR / f"{name}.png"
        with open(mmd_path, "w", encoding="utf-8") as mmd_file:
            mmd_file.write(code.strip())
        
        f.write(f"echo Rendering {name}...\n")
        f.write(f"call npx mmdc -i \"{mmd_path}\" -o \"{png_path}\" -c \"mermaid_config.json\" -p \"puppeteer_config.json\" -b white -s 4 --width 3000\n")
    f.write("echo ALL RENDERED!\n")

print("Generated build scripts and MMD sources.")
