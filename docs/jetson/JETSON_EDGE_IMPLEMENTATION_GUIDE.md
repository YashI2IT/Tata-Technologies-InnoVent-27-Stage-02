# AeroEdge-X — NVIDIA Jetson Orin Nano Edge Implementation Guide

> **Hardware:** NVIDIA Jetson Orin Nano Developer Kit (8GB RAM)  
> **Storage:** Patriot P300 128GB M.2 NVMe PCIe Gen3 x4 SSD  
> **OS:** NVIDIA JetPack 5.1.x / 6.x (Ubuntu Linux aarch64)  
> **Service:** FastAPI Edge Vision API (`jetson/jetson_api.py`)  
> **Model:** Ultralytics YOLOv11 compiled to TensorRT FP16 (`best.engine`)  

---

## 1. Architecture & Compute Split

AeroEdge-X adopts a **hybrid compute topology**:

```
+-----------------------------------------------------------------------------+
| WORKSTATION (Windows 11)                    JETSON ORIN NANO (8GB)          |
| +--------------------------------+          +-----------------------------+ |
| | React 19 Frontend              |          | FastAPI Microservice (:8000)| |
| | Flask REST API (Port 7860)     |  HTTP    | /health, /infer             | |
| |                                | -------> |                             | |
| | RAG Agent (ChromaDB + MiniLM)  |          | TensorRT Engine (FP16)      | |
| | Reasoning Agent (Phi-3 Mini)   | <------- | 1024 CUDA + 32 Tensor Cores | |
| | Digital Twin (SQLite WAL)      |   JSON   | ~9.45 ms Latency (105+ FPS) | |
| | ReportLab PDF Generator        |          +-----------------------------+ |
| +--------------------------------+                                          |
+-----------------------------------------------------------------------------+
```

### Why the LLM Does NOT Run on Jetson
The Jetson Orin Nano Developer Kit possesses 8GB of unified LPDDR5 memory shared across CPU, GPU, and display. Running JetPack OS (~1.5GB) + TensorRT vision pipeline (~1GB) + a 3.8B LLM like Phi-3 Mini (~4GB) creates severe memory pressure and can trigger Out-Of-Memory (OOM) kernel panics. The Windows workstation hosts the LLM, RAG vector store, SQLite state, and PDF generator, while the Jetson functions as a high-throughput, low-latency vision inference accelerator.

---

## 2. Directory Structure (`jetson/`)

| File | Purpose |
|------|---------|
| `jetson/jetson_api.py` | FastAPI microservice exposing `/health` and `/infer` endpoints. |
| `jetson/inference.py` | `JetsonInferenceService` managing model warm-up, TensorRT engine loading, and detection extraction. |
| `jetson/config.py` | Configuration settings (host, port, model paths, confidence threshold, 640x640 resolution). |
| `jetson/export_model.py` | Compiles PyTorch weights (`best.pt`) to a native TensorRT engine (`best.engine`) using FP16 precision. |
| `jetson/camera_test.py` | Diagnostic script for CSI camera (GStreamer `nvarguscamerasrc`) and USB cameras (V4L2). |
| `jetson/benchmark.py` | 100-iteration latency benchmark tool measuring average, median, min, max, and FPS. |
| `jetson/test_inference.py` | Integration test harness validating single-image inference against the local engine. |
| `jetson/requirements.txt` | Lean edge dependencies (`fastapi`, `uvicorn`, `ultralytics`, `opencv-python`, `numpy`). |

---

## 3. Data Contract & Endpoints

### 3.1 Health Check (`GET /health`)
- **URL:** `http://<jetson-ip>:8000/health`
- **Response:**
  ```json
  {
    "status": "ok",
    "device": "jetson",
    "accelerator": "tensorrt",
    "model": "yolov11"
  }
  ```

### 3.2 Inference Endpoint (`POST /infer`)
- **URL:** `http://<jetson-ip>:8000/infer`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `image`: Binary file (JPEG/PNG)
  - `threshold`: Float (default `0.40`)
- **Response:**
  ```json
  {
    "device": "jetson",
    "accelerator": "tensorrt",
    "model": "yolov11",
    "inference_time_ms": 9.45,
    "primary_defect": "crack",
    "total_detections": 1,
    "detections": [
      {
        "defect_type": "crack",
        "confidence": 0.8924,
        "severity": "high",
        "location": {
          "x_center": 0.5123,
          "y_center": 0.4381,
          "width": 0.1245,
          "height": 0.0892
        }
      }
    ],
    "status": "defect_found"
  }
  ```

> **Bandwidth Optimization:** The Jetson transmits **JSON only** (<1 KB) back to the workstation. The workstation renders bounding boxes locally with OpenCV (`cv2.rectangle` and `cv2.putText`). This prevents Wi-Fi bottlenecks and eliminates edge JPEG re-encoding overhead.

---

## 4. Step-by-Step Deployment on Jetson

### Step 1: Install Dependencies
```bash
sudo apt update
sudo apt install -y python3-pip python3-dev libopenblas-dev
cd ~/Tata_Innovent-main/jetson
pip3 install -r requirements.txt
```

### Step 2: Export Model to TensorRT FP16
Ensure `best.pt` is in `jetson/` (or copied from `models/best.pt`):
```bash
python3 export_model.py
```
This runs:
```python
from ultralytics import YOLO
model = YOLO("best.pt")
model.export(format="engine", half=True, device=0, imgsz=640)
```
Output: `best.engine` optimized specifically for the Jetson Orin Nano's Ampere architecture.

### Step 3: Run Hardware Verification
```bash
# Verify camera connectivity
python3 camera_test.py --mode usb

# Run latency benchmark (100 iterations)
python3 benchmark.py --image sample.jpg --iter 100 --engine best.engine
```

### Step 4: Run FastAPI Server
```bash
python3 jetson_api.py
```
To run as a systemd background service:
```ini
# /etc/systemd/system/aeroedge-vision.service
[Unit]
Description=AeroEdge-X Jetson Vision Service
After=network.target

[Service]
Type=simple
User=jetson
WorkingDirectory=/home/jetson/Tata_Innovent-main/jetson
ExecStart=/usr/bin/python3 jetson_api.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aeroedge-vision
```

---

## 5. Desktop Workstation Configuration

In `Tata_Innovent-main/.env`:
```ini
VISION_AGENT_MODE=jetson
JETSON_URL=http://<JETSON_IP>:8000
JETSON_TIMEOUT_SECONDS=30
```
Restart `python app.py`. `VisionAgent()` will automatically route image inspection requests to the Jetson Orin Nano.
