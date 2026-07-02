import os
import uuid
from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from vision_agent import VisionAgent
from rag_agent import RAGAgent

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Load both agents once at startup
print("🚀 Loading AeroEdge-X agents...")
vision = VisionAgent()
rag = RAGAgent()
print("✅ All agents ready!")

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    # 1. Validate file
    if 'image' not in request.files:
        return jsonify({'error': 'No image uploaded'}), 400

    file = request.files['image']
    if not allowed_file(file.filename):
        return jsonify({'error': 'Only JPG/PNG allowed'}), 400

    # 2. Save image
    filename = str(uuid.uuid4()) + '_' + secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    file.save(filepath)

    # 3. Vision Agent
    vision_result = vision.detect(filepath)

    # 4. RAG Agent
    if vision_result['status'] == 'defect_found':
        rag_result = rag.retrieve(vision_result['primary_defect'])
    else:
        rag_result = {
            'procedure': 'No defects detected.',
            'source': 'N/A',
            'page': 0,
            'chunks': []
        }

    # 5. Digital Twin
    from digital_twin import DigitalTwinAgent
    twin = DigitalTwinAgent()
    inspection_id = twin.log_inspection(vision_result, rag_result)

    # 6. Return response
    return jsonify({
        'inspection_id': inspection_id,
        'image_url': f'/uploads/{filename}',
        'vision': vision_result,
        'rag': rag_result
    })

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    from flask import send_from_directory
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/history')
def history():
    from digital_twin import DigitalTwinAgent
    twin = DigitalTwinAgent()
    return jsonify(twin.get_history())

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)  