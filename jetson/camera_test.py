import cv2
import time
from inference import JetsonInferenceService
import argparse
import os

def test_camera(engine_path: str, fallback_path: str, camera_id: int):
    print("Initializing inference service...")
    service = JetsonInferenceService(engine_path=engine_path, fallback_path=fallback_path)
    service.initialize()

    print(f"Opening camera /dev/video{camera_id}...")
    # On Jetson, typical V4L2 backend is preferred
    cap = cv2.VideoCapture(camera_id, cv2.CAP_V4L2)
    
    if not cap.isOpened():
        print(f"Error: Could not open camera {camera_id}.")
        # Fallback to default backend
        cap = cv2.VideoCapture(camera_id)
        if not cap.isOpened():
            print(f"Error: Camera {camera_id} completely unavailable.")
            return

    # Set typical USB camera resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    print("Camera opened successfully. Press 'q' to quit.")
    
    frames_processed = 0
    start_time = time.time()
    
    # Create temp dir for frames
    import tempfile
    temp_dir = tempfile.mkdtemp()
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Failed to grab frame.")
                break
                
            temp_path = os.path.join(temp_dir, "frame.jpg")
            cv2.imwrite(temp_path, frame)
            
            # Run inference
            t1 = time.time()
            result = service.predict(temp_path, threshold=0.4)
            infer_time = round((time.time() - t1) * 1000, 2)
            
            # Display results on frame
            fps = 1000.0 / infer_time if infer_time > 0 else 0
            
            # Draw detections
            for det in result['detections']:
                loc = det['location']
                h, w, _ = frame.shape
                
                # YOLO returns normalized coordinates
                x_c = int(loc['x_center'] * w)
                y_c = int(loc['y_center'] * h)
                box_w = int(loc['width'] * w)
                box_h = int(loc['height'] * h)
                
                x1 = int(x_c - box_w/2)
                y1 = int(y_c - box_h/2)
                x2 = int(x_c + box_w/2)
                y2 = int(y_c + box_h/2)
                
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 0, 255), 2)
                cv2.putText(frame, f"{det['defect_type']} {det['confidence']:.2f}", 
                           (x1, max(y1-10, 0)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            # Draw overlay info
            cv2.putText(frame, f"Device: {result['device'].upper()} | Accel: {result['accelerator'].upper()}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
            cv2.putText(frame, f"Infer: {infer_time}ms | FPS: {fps:.1f}", 
                       (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
                       
            cv2.imshow('AeroEdge-X Jetson Camera Test', frame)
            
            frames_processed += 1
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    finally:
        cap.release()
        cv2.destroyAllWindows()
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)
        print(f"Processed {frames_processed} frames in {round(time.time() - start_time, 2)} seconds.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test Jetson Camera Inference")
    parser.add_argument("--camera", type=int, default=0, help="Camera device ID (e.g. 0 for /dev/video0)")
    parser.add_argument("--engine", type=str, default="best.engine", help="Path to TensorRT engine")
    parser.add_argument("--pt", type=str, default="best.pt", help="Path to fallback PyTorch model")
    args = parser.parse_args()
    
    test_camera(args.engine, args.pt, args.camera)
