import os
import uuid
from flask import Flask, request, jsonify, render_template
from werkzeug.utils import secure_filename
from vision_agent import VisionAgent
from rag_agent import RAGAgent
from reasoning_agent import ReasoningAgent
from report_generator import generate_report

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Load both agents once at startup
print("🚀 Loading AeroEdge-X agents...")
vision = VisionAgent()
rag = RAGAgent()
reasoning = ReasoningAgent()
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
    threshold = float(request.form.get('threshold',0.4))
    vision_result = vision.detect(filepath,threshold=threshold)

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

    # 5. Reasoning Agent
    if vision_result['status'] == 'defect_found':
        reasoning_result = reasoning.generate(
            defect_type = vision_result['primary_defect'],
            severity = vision_result['detections'][0]['severity'],
            procedure = rag_result['procedure']
        )
    else:
        reasoning_result = {'steps':[],'raw_response':''}    
    
    
    # 6. Digital Twin
    from digital_twin import DigitalTwinAgent
    twin = DigitalTwinAgent()
    inspection_id = twin.log_inspection(vision_result, rag_result, reasoning_result)

    # 7. Return response
    return jsonify({
        'inspection_id': inspection_id,
        'image_url': f'/uploads/{filename}',
        'vision': vision_result,
        'rag': rag_result,
        'reasoning':reasoning_result
    })

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    from flask import send_from_directory
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/history')
def history():
    from digital_twin import DigitalTwinAgent
    twin = DigitalTwinAgent()
    limit = int(request.args.get('limit',10))
    return jsonify(twin.get_history(limit=limit))

@app.route('/digital-twin')
def digital_twin_page():
    return render_template('digital_twin.html')

@app.route('/report/<int:inspection_id>')
def download_report(inspection_id):
    from flask import send_file
    from digital_twin import DigitalTwinAgent
    import json

    # Get inspection from digital twin
    twin = DigitalTwinAgent()
    cursor = twin.conn.execute(
        'SELECT * FROM inspections WHERE id = ?', (inspection_id,)
    )
    row = cursor.fetchone()

    if not row:
        return jsonify({'error': 'Inspection not found'}), 404

    # Rebuild results from stored data
    vision_result = {
        'timestamp': row[1],
        'image': row[2],
        'annotated_image': row[2].replace('.', '_annotated.'),
        'detections': json.loads(row[3]),
        'primary_defect': row[4],
        'status': 'defect_found',
        'total_detections': len(json.loads(row[3]))
    }
    print(f"Annotated image path: {vision_result['annotated_image']}")
    print(f"File exists: {os.path.exists(vision_result['annotated_image'])}")
    rag_result = {
        'procedure': row[6],
        'source': row[7],
        'page': row[8]
    }
    reasoning_result = {'steps': json.loads(row[9]) if row[9] else []}

    # Generate PDF
    os.makedirs('reports', exist_ok=True)
    output_path = f'reports/inspection_{inspection_id}.pdf'
    generate_report(vision_result, rag_result, reasoning_result, inspection_id, output_path)

    return send_file(output_path, as_attachment=True,
                     download_name=f'AeroEdge_Inspection_{inspection_id}.pdf')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7860)  