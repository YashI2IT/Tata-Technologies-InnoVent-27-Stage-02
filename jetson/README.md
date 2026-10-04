# AeroEdge-X Jetson Vision Service

This directory contains the standalone Jetson Orin Nano deployment package for the AeroEdge-X vision layer.

## Setup on Jetson Device

1. **Install Dependencies**
   Ensure you have JetPack installed (L4T).
   ```bash
   pip install -r requirements.txt
   ```

2. **Copy Model**
   Place your `best.pt` inside the `jetson/` directory.

3. **Convert to TensorRT (Must be done ON the Jetson)**
   ```bash
   python export_model.py --model best.pt
   ```
   This will generate `best.engine`.

4. **Verify Inference**
   ```bash
   python test_inference.py --image path/to/sample.jpg
   ```

5. **Verify Camera**
   ```bash
   python camera_test.py --camera 0
   ```

6. **Run Benchmark**
   ```bash
   python benchmark.py --image path/to/sample.jpg --iter 100
   ```

## Running the API Server

```bash
uvicorn jetson_api:app --host 0.0.0.0 --port 8000
```

The desktop application should now be configured with:
```env
VISION_AGENT_MODE=jetson
JETSON_URL=http://<jetson-ip>:8000
```
