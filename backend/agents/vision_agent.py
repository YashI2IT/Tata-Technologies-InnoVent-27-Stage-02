"""
AeroEdge-X — Vision Agent
Hardware-agnostic vision interface supporting Local (CPU) and Jetson Edge Inference.
"""

import os
import shutil
import cv2
import requests
from datetime import datetime
from ultralytics import YOLO
from backend.config import get_config

cfg = get_config()

MODEL_PATH = str(cfg.MODEL_PATH)
CONFIDENCE_THRESHOLD = float(os.environ.get("VISION_CONFIDENCE_THRESHOLD", 0.4))
VISION_AGENT_MODE = os.environ.get("VISION_AGENT_MODE", "local").lower()
JETSON_URL = os.environ.get("JETSON_URL", "http://127.0.0.1:8000")
JETSON_TIMEOUT = int(os.environ.get("JETSON_TIMEOUT_SECONDS", 30))

def get_severity(confidence: float) -> str:
    if confidence >= 0.80:
        return "high"
    elif confidence >= 0.60:
        return "medium"
    else:
        return "low"

class LocalVisionProvider:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or MODEL_PATH
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Vision model weights file '{self.model_path}' not found.")
        self.model = YOLO(self.model_path)
        self.names = self.model.names

    def detect(self, image_path: str, threshold: float = CONFIDENCE_THRESHOLD) -> dict:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Inspection image file '{image_path}' not found.")

        results = self.model(image_path, conf=threshold, verbose=False, save=False)
        detections = []

        for result in results:
            for box in result.boxes:
                class_id = int(box.cls)
                confidence = round(float(box.conf), 4)
                class_name = result.names[class_id]
                x, y, w, h = [round(float(v), 4) for v in box.xywhn[0]]

                detections.append({
                    "defect_type": class_name,
                    "confidence": confidence,
                    "severity": get_severity(confidence),
                    "location": {"x_center": x, "y_center": y, "width": w, "height": h}
                })

        detections.sort(key=lambda d: d["confidence"], reverse=True)
        primary_defect = detections[0]["defect_type"] if detections else "none"
        annotated_path = image_path.rsplit(".", 1)[0] + "_annotated.jpg"

        # Generate annotated output safely
        saved_annotated = False
        for result in results:
            annotated_img = result.plot()
            cv2.imwrite(annotated_path, annotated_img)
            saved_annotated = True
            break

        if not saved_annotated:
            shutil.copy(image_path, annotated_path)

        return {
            "agent": "VisionAgent (Local)",
            "timestamp": datetime.now().isoformat(),
            "image": image_path,
            "annotated_image": annotated_path,
            "primary_defect": primary_defect,
            "total_detections": len(detections),
            "detections": detections,
            "status": "defect_found" if detections else "no_defect",
            "inference_device": "local_cpu"
        }

class JetsonVisionProvider:
    def __init__(self):
        self.jetson_url = JETSON_URL
        self.timeout = JETSON_TIMEOUT
        self.names = {0: "crack", 1: "dent", 2: "corrosion", 3: "scratch", 4: "gouge"} # Mock fallback names if offline

    def detect(self, image_path: str, threshold: float = CONFIDENCE_THRESHOLD) -> dict:
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Inspection image file '{image_path}' not found.")

        infer_url = f"{self.jetson_url}/infer"
        
        try:
            with open(image_path, 'rb') as f:
                files = {'image': (os.path.basename(image_path), f, 'image/jpeg')}
                data = {'threshold': threshold}
                response = requests.post(infer_url, files=files, data=data, timeout=self.timeout)
            
            response.raise_for_status()
            jetson_result = response.json()
            
        except requests.RequestException as e:
            print(f"[JetsonVisionProvider] Connection failed: {e}. Check Jetson IP and status.")
            raise RuntimeError(f"Jetson Edge Service unavailable: {e}")
            
        # Draw bounding boxes locally since Jetson only returns JSON to save bandwidth
        annotated_path = image_path.rsplit(".", 1)[0] + "_annotated.jpg"
        img = cv2.imread(image_path)
        
        if img is not None:
            h, w, _ = img.shape
            for det in jetson_result.get("detections", []):
                loc = det["location"]
                x_c = int(loc['x_center'] * w)
                y_c = int(loc['y_center'] * h)
                box_w = int(loc['width'] * w)
                box_h = int(loc['height'] * h)
                
                x1 = int(x_c - box_w/2)
                y1 = int(y_c - box_h/2)
                x2 = int(x_c + box_w/2)
                y2 = int(y_c + box_h/2)
                
                cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(img, f"{det['defect_type']} {det['confidence']:.2f}", 
                           (x1, max(y1-10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            cv2.imwrite(annotated_path, img)
        else:
            shutil.copy(image_path, annotated_path)

        return {
            "agent": "VisionAgent (Jetson Edge)",
            "timestamp": datetime.now().isoformat(),
            "image": image_path,
            "annotated_image": annotated_path,
            "primary_defect": jetson_result.get("primary_defect", "none"),
            "total_detections": jetson_result.get("total_detections", 0),
            "detections": jetson_result.get("detections", []),
            "status": jetson_result.get("status", "no_defect"),
            "inference_device": f"jetson_{jetson_result.get('accelerator', 'unknown')}",
            "inference_time_ms": jetson_result.get("inference_time_ms", 0)
        }

def VisionAgent():
    if VISION_AGENT_MODE == "jetson":
        print(f"🚀 Initializing Jetson Vision Provider targeting {JETSON_URL}")
        return JetsonVisionProvider()
    else:
        print("🚀 Initializing Local Vision Provider (CPU fallback)")
        return LocalVisionProvider()
