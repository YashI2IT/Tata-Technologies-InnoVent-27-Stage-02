import os
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import shutil
import tempfile
from config import JetsonConfig
from inference import JetsonInferenceService

app = FastAPI(title="AeroEdge-X Jetson Vision API")

# Initialize the inference service globally
inference_service = JetsonInferenceService(
    engine_path=JetsonConfig.MODEL_PATH,
    fallback_path=JetsonConfig.FALLBACK_MODEL_PATH
)

@app.on_event("startup")
def load_model():
    # Warm up the model on startup
    print("Initializing Jetson Inference Service...")
    inference_service.initialize()

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "device": "jetson",
        "accelerator": "tensorrt" if inference_service.using_tensorrt else "cpu",
        "model": "yolov11"
    }

@app.post("/infer")
async def infer(
    image: UploadFile = File(...), 
    threshold: float = Form(JetsonConfig.CONFIDENCE_THRESHOLD)
):
    if not image.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
        shutil.copyfileobj(image.file, temp_file)
        temp_path = temp_file.name

    try:
        # Run inference
        results = inference_service.predict(temp_path, threshold=threshold)
        return JSONResponse(content=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    uvicorn.run("jetson_api:app", host=JetsonConfig.HOST, port=JetsonConfig.PORT, reload=False)
