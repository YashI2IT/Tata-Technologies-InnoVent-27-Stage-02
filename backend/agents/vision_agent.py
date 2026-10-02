"""
AeroEdge-X — Vision Agent
YOLOv11 defect detection
"""

import os
import shutil
import cv2
from datetime import datetime
from ultralytics import YOLO
from backend.config import get_config

cfg = get_config()

MODEL_PATH = str(cfg.MODEL_PATH)
CONFIDENCE_THRESHOLD = float(os.environ.get("VISION_CONFIDENCE_THRESHOLD", 0.4))

def get_severity(confidence: float) -> str:
    if confidence >= 0.80:
        return "high"
    elif confidence >= 0.60:
        return "medium"
    else:
        return "low"

class VisionAgent:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or os.environ.get("MODEL_PATH", MODEL_PATH)
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"Vision model weights file '{self.model_path}' not found.")
        self.model = YOLO(self.model_path)

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
            "agent": "VisionAgent",
            "timestamp": datetime.now().isoformat(),
            "image": image_path,
            "annotated_image": annotated_path,
            "primary_defect": primary_defect,
            "total_detections": len(detections),
            "detections": detections,
            "status": "defect_found" if detections else "no_defect"
        }
