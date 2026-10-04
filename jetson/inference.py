import os
import time
from ultralytics import YOLO

class JetsonInferenceService:
    def __init__(self, engine_path: str, fallback_path: str):
        self.engine_path = engine_path
        self.fallback_path = fallback_path
        self.model = None
        self.using_tensorrt = False
    
    def initialize(self):
        # Prioritize TensorRT engine on Jetson
        if os.path.exists(self.engine_path):
            print(f"Loading TensorRT Engine: {self.engine_path}")
            self.model = YOLO(self.engine_path, task='detect')
            self.using_tensorrt = True
        elif os.path.exists(self.fallback_path):
            print(f"TensorRT Engine not found. Falling back to standard PyTorch: {self.fallback_path}")
            self.model = YOLO(self.fallback_path, task='detect')
            self.using_tensorrt = False
        else:
            raise FileNotFoundError(f"Neither {self.engine_path} nor {self.fallback_path} could be found.")
            
        # Warm-up inference
        try:
            import numpy as np
            dummy_img = np.zeros((640, 640, 3), dtype=np.uint8)
            self.model(dummy_img, verbose=False)
            print("Model warm-up complete.")
        except Exception as e:
            print(f"Warm-up failed: {e}")

    def get_severity(self, confidence: float) -> str:
        if confidence >= 0.80:
            return "high"
        elif confidence >= 0.60:
            return "medium"
        else:
            return "low"

    def predict(self, image_path: str, threshold: float) -> dict:
        if not self.model:
            self.initialize()
            
        start_time = time.time()
        results = self.model(image_path, conf=threshold, verbose=False)
        inference_time_ms = round((time.time() - start_time) * 1000, 2)
        
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
                    "severity": self.get_severity(confidence),
                    "location": {"x_center": x, "y_center": y, "width": w, "height": h}
                })

        detections.sort(key=lambda d: d["confidence"], reverse=True)
        primary_defect = detections[0]["defect_type"] if detections else "none"

        return {
            "device": "jetson",
            "accelerator": "tensorrt" if self.using_tensorrt else "cpu",
            "model": "yolov11",
            "inference_time_ms": inference_time_ms,
            "primary_defect": primary_defect,
            "total_detections": len(detections),
            "detections": detections,
            "status": "defect_found" if detections else "no_defect"
        }
