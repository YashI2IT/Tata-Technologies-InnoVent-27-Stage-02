"""
AeroEdge-X — Vision Agent
YOLOv11 defect detection
"""

import json
from datetime import datetime
from ultralytics import YOLO

MODEL_PATH = 'best.pt'
CONFIDENCE_THRESHOLD = 0.4

def get_severity(confidence):
    if confidence >= 0.80:
        return "high"
    elif confidence >= 0.60:
        return "medium"
    else:
        return "low"

class VisionAgent:
    def __init__(self):
        print("[VisionAgent] Loading YOLOv11...")
        self.model = YOLO(MODEL_PATH)
        print("[VisionAgent] Ready ✅")

    def detect(self, image_path: str) -> dict:
        results = self.model(image_path, conf=CONFIDENCE_THRESHOLD, verbose=False, save=False)
        detections = []

        for result in results:
            for box in result.boxes:
                class_id   = int(box.cls)
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

        return {
            "agent": "VisionAgent",
            "timestamp": datetime.now().isoformat(),
            "image": image_path,
            "primary_defect": primary_defect,
            "total_detections": len(detections),
            "detections": detections,
            "status": "defect_found" if detections else "no_defect"
        }
