import os
from ultralytics import YOLO

def export_to_tensorrt(model_path="best.pt", input_size=640):
    if not os.path.exists(model_path):
        print(f"Error: {model_path} not found.")
        return

    print(f"Loading PyTorch model from {model_path}...")
    model = YOLO(model_path)
    
    print("Exporting to ONNX format...")
    # Export to ONNX first
    onnx_path = model.export(format="onnx", imgsz=input_size, dynamic=False)
    print(f"ONNX model saved to {onnx_path}")
    
    print("Exporting to TensorRT Engine (FP16)...")
    print("NOTE: This MUST be executed on the physical Jetson device to build the correct engine for its GPU.")
    
    # Export to TensorRT, half precision (FP16)
    try:
        engine_path = model.export(format="engine", imgsz=input_size, half=True, dynamic=False, workspace=4)
        print(f"TensorRT Engine successfully built and saved to {engine_path}")
    except Exception as e:
        print(f"Failed to export to TensorRT. Make sure you are running this on Jetson with TensorRT installed.\nError: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Export YOLOv11 to TensorRT for Jetson")
    parser.add_argument("--model", type=str, default="best.pt", help="Path to input PyTorch model")
    parser.add_argument("--imgsz", type=int, default=640, help="Input size for the model")
    args = parser.parse_args()
    
    export_to_tensorrt(args.model, args.imgsz)
