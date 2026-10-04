import os

class JetsonConfig:
    PORT = int(os.environ.get("JETSON_PORT", 8000))
    HOST = os.environ.get("JETSON_HOST", "0.0.0.0")
    
    # Model parameters
    MODEL_PATH = os.environ.get("MODEL_PATH", "best.engine")
    FALLBACK_MODEL_PATH = os.environ.get("FALLBACK_MODEL_PATH", "best.pt")
    CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", 0.40))
    
    # Target resolution for YOLOv11 (must match training resolution)
    INPUT_SIZE = int(os.environ.get("INPUT_SIZE", 640))
