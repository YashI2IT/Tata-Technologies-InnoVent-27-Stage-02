import argparse
import time
import json
import os
from inference import JetsonInferenceService

def test_inference(image_path: str, engine_path: str, fallback_path: str):
    if not os.path.exists(image_path):
        print(f"Error: Image {image_path} not found.")
        return

    print("Initializing inference service...")
    service = JetsonInferenceService(engine_path=engine_path, fallback_path=fallback_path)
    service.initialize()
    
    print(f"Running inference on {image_path}...")
    
    # Run multiple times to show warm vs cold timing
    for i in range(3):
        start_time = time.time()
        result = service.predict(image_path, threshold=0.4)
        total_time = round((time.time() - start_time) * 1000, 2)
        
        print(f"\n--- Run {i+1} ---")
        print(f"Total Request Time: {total_time} ms")
        print(f"Inference Time: {result['inference_time_ms']} ms")
        
        if i == 2:
            print("\nFinal Output JSON Schema:")
            print(json.dumps(result, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Jetson Inference locally")
    parser.add_argument("--image", type=str, required=True, help="Path to test image")
    parser.add_argument("--engine", type=str, default="best.engine", help="Path to TensorRT engine")
    parser.add_argument("--pt", type=str, default="best.pt", help="Path to fallback PyTorch model")
    args = parser.parse_args()
    
    test_inference(args.image, args.engine, args.pt)
