import time
import argparse
import os
import json
from inference import JetsonInferenceService
import platform

def run_benchmark(image_path: str, engine_path: str, fallback_path: str, iterations: int):
    print("="*50)
    print("AEROEDGE-X JETSON INFERENCE BENCHMARK")
    print("="*50)
    
    if not os.path.exists(image_path):
        print(f"Error: Benchmark image {image_path} not found.")
        return

    print("Platform:", platform.platform())
    print("Initializing inference service...")
    
    # Measure Load Time
    t_load_start = time.time()
    service = JetsonInferenceService(engine_path=engine_path, fallback_path=fallback_path)
    service.initialize()
    load_time_ms = round((time.time() - t_load_start) * 1000, 2)
    
    print(f"Model Load & Warm-up Time: {load_time_ms} ms")
    print(f"Accelerator used: {service.using_tensorrt and 'TensorRT' or 'CPU (PyTorch)'}")
    
    print(f"\nRunning {iterations} iterations on {image_path}...")
    
    inference_times = []
    
    for i in range(iterations):
        start_time = time.time()
        res = service.predict(image_path, threshold=0.4)
        inf_time = res['inference_time_ms']
        inference_times.append(inf_time)
        
    avg_inf = sum(inference_times) / len(inference_times)
    min_inf = min(inference_times)
    max_inf = max(inference_times)
    
    # Sort for median
    sorted_times = sorted(inference_times)
    mid = len(sorted_times) // 2
    median_inf = sorted_times[mid] if len(sorted_times) % 2 != 0 else (sorted_times[mid-1] + sorted_times[mid]) / 2.0
    
    print("\n" + "="*50)
    print("BENCHMARK RESULTS")
    print("="*50)
    print(f"Jetpack Version: (Run 'cat /etc/nv_tegra_release' to verify)")
    print(f"Model: YOLOv11 {'TensorRT FP16' if service.using_tensorrt else 'PyTorch'}")
    print(f"Iterations: {iterations}")
    print("-"*50)
    print(f"Average Inference Time: {avg_inf:.2f} ms")
    print(f"Median Inference Time:  {median_inf:.2f} ms")
    print(f"Minimum Inference Time: {min_inf:.2f} ms")
    print(f"Maximum Inference Time: {max_inf:.2f} ms")
    print(f"Implied Max FPS:        {1000.0/avg_inf:.2f} FPS")
    print("="*50)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=str, required=True, help="Image to benchmark on")
    parser.add_argument("--engine", type=str, default="best.engine")
    parser.add_argument("--pt", type=str, default="best.pt")
    parser.add_argument("--iter", type=int, default=100, help="Number of iterations")
    args = parser.parse_args()
    
    run_benchmark(args.image, args.engine, args.pt, args.iter)
