import os
import sys
import uuid
from datetime import datetime, timedelta

# In frozen PyInstaller bundle, register torch DLLs and load torchvision C++ extension
if getattr(sys, 'frozen', False):
    try:
        import torch
        meipass = getattr(sys, '_MEIPASS', '')
        torch_lib = os.path.join(meipass, 'torch', 'lib')
        if os.path.isdir(torch_lib):
            try:
                os.add_dll_directory(torch_lib)
            except Exception:
                pass
        for pyd_name in ['_C_stable.pyd', '_C.pyd', 'image_stable.pyd']:
            pyd_path = os.path.join(meipass, 'torchvision', pyd_name)
            if os.path.exists(pyd_path):
                try:
                    torch.ops.load_library(pyd_path)
                except Exception:
                    pass
    except Exception:
        pass

from flask import Flask, request, jsonify, render_template, send_from_directory, send_file, session, g
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sys
import os

# Windows GUI headless fallback: if stdout/stderr are None, map to devnull BEFORE any prints!
if sys.platform == "win32":
    if sys.stdout is None:
        sys.stdout = open(os.devnull, "w")
    if sys.stderr is None:
        sys.stderr = open(os.devnull, "w")

from dotenv import load_dotenv

from backend.config import get_config
from backend.agents.vision_agent import VisionAgent
from backend.agents.rag_agent import RAGAgent
from backend.agents.reasoning_agent import ReasoningAgent, LocalLLMUnavailableError
from backend.services.report_generator import generate_report
from backend.agents.digital_twin import DigitalTwinAgent
import backend.agents.digital_twin as digital_twin

import sys
if not getattr(sys, 'frozen', False):
    try:
        load_dotenv()
    except Exception:
        pass

# Global Agent instances (loaded once)
print("🚀 Loading AeroEdge-X agents...")
vision = VisionAgent()
rag = RAGAgent()
reasoning = ReasoningAgent()
print("✅ All agents ready!")

def allowed_file(filename: str, allowed_extensions: set) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def create_app(config_name=None):
    """Application factory for AeroEdge-X backend."""
    cfg = get_config(config_name)
    cfg.ensure_directories()

    app = Flask(__name__, template_folder=str(cfg.RESOURCE_DIR / "templates"))
    app.config.from_object(cfg)
    app.config['UPLOAD_FOLDER'] = str(cfg.UPLOAD_DIR)
    app.config['REPORT_DIR'] = str(cfg.REPORT_DIR)

    # Sync active database path for DigitalTwinAgent
    os.environ['DATABASE_PATH'] = str(cfg.DATABASE_PATH)
    digital_twin.DB_PATH = str(cfg.DATABASE_PATH)

    # Configure CORS for credentialed requests
    CORS(app, supports_credentials=True, origins=cfg.FRONTEND_ORIGINS)

    # Register blueprints
    # Blueprint removed

    # Centralized Error Handlers
    @app.errorhandler(LocalLLMUnavailableError)
    def handle_llm_unavailable(e):
        return jsonify({
            'error': 'LOCAL_LLM_UNAVAILABLE',
            'message': str(e)
        }), 503

    @app.errorhandler(400)
    def handle_bad_request(e):
        return jsonify({
            'error': 'BAD_REQUEST',
            'message': getattr(e, 'description', 'Bad Request')
        }), 400


    @app.errorhandler(404)
    def handle_not_found(e):
        return jsonify({
            'error': 'NOT_FOUND',
            'message': getattr(e, 'description', 'Resource not found')
        }), 404

    @app.errorhandler(429)
    def handle_rate_limit(e):
        return jsonify({
            'error': 'TOO_MANY_REQUESTS',
            'message': getattr(e, 'description', 'Too many requests. Please try again later.')
        }), 429

    @app.errorhandler(Exception)
    def handle_general_exception(e):
        if hasattr(e, 'code') and getattr(e, 'code', None) is not None:
            return jsonify({
                'error': getattr(e, 'name', 'HTTP_ERROR'),
                'message': getattr(e, 'description', str(e))
            }), e.code
        return jsonify({
            'error': 'INTERNAL_SERVER_ERROR',
            'message': str(e)
        }), 500

    # Request Tracing & Security Headers
    @app.before_request
    def before_request_trace():
        g.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))

    @app.after_request
    def set_security_headers(response):
        response.headers['X-Request-ID'] = getattr(g, 'request_id', str(uuid.uuid4()))
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response

    # Routes
    @app.route('/health', methods=['GET'])
    def health():
        db_path = str(app.config.get('DATABASE_PATH', 'digital_twin.db'))
        db_ok = os.path.exists(db_path)
        vision_ok = hasattr(vision, 'model') and vision.model is not None
        rag_ok = hasattr(rag, 'vectorstore') and rag.vectorstore is not None
        llm_ok = hasattr(reasoning, 'llm') and reasoning.llm is not None

        return jsonify({
            'status': 'healthy',
            'service': 'aeroedge-x',
            'version': app.config.get('APP_VERSION', 'v2.6.0-hardened'),
            'components': {
                'database': 'ready' if db_ok else 'initializing',
                'vision': 'ready' if vision_ok else 'offline',
                'rag': 'ready' if rag_ok else 'offline',
                'reasoning': 'ready' if llm_ok else 'offline'
            }
        }), 200

    @app.route('/')
    def index():
        try:
            return render_template('index.html')
        except Exception:
            return jsonify({
                'name': 'AeroEdge-X API',
                'status': 'online',
                'version': app.config.get('APP_VERSION', 'v2.6.0-hardened')
            })

    @app.route('/analyze', methods=['POST'])
    def analyze():
        # 1. Validate file
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded', 'message': 'Missing image in request'}), 400

        file = request.files['image']
        allowed_exts = app.config.get('ALLOWED_EXTENSIONS', {'png', 'jpg', 'jpeg'})
        if not file.filename or not allowed_file(file.filename, allowed_exts):
            return jsonify({'error': 'Only JPG/PNG allowed', 'message': 'Invalid file format'}), 400

        # 2. Save image with secure filename
        sanitized = secure_filename(file.filename)
        filename = f"{uuid.uuid4()}_{sanitized}"
        upload_folder = app.config['UPLOAD_FOLDER']
        filepath = os.path.join(upload_folder, filename)
        os.makedirs(upload_folder, exist_ok=True)
        file.save(filepath)

        # 3. Vision Agent
        try:
            threshold = float(request.form.get('threshold', app.config.get('VISION_CONFIDENCE_THRESHOLD', 0.4)))
        except (ValueError, TypeError):
            threshold = 0.4
        vision_result = vision.detect(filepath, threshold=threshold)

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
            try:
                reasoning_result = reasoning.generate(
                    defect_type=vision_result['primary_defect'],
                    severity=vision_result['detections'][0]['severity'],
                    procedure=rag_result['procedure']
                )
            except LocalLLMUnavailableError:
                reasoning_result = {
                    'steps': [{
                        'number': 1,
                        'title': 'Local LLM Offline',
                        'description': 'Reasoning generation is unavailable. Please refer to the manual procedure above.'
                    }],
                    'raw_response': 'Local LLM service is offline or unreachable.'
                }
        else:
            reasoning_result = {'steps': [], 'raw_response': ''}

        # 6. Digital Twin
        twin = DigitalTwinAgent()
        inspection_id = twin.log_inspection(vision_result, rag_result, reasoning_result)

        # Generate notification if defect found
        if vision_result['status'] == 'defect_found':
            severity = vision_result['detections'][0]['severity']
            defect_type = vision_result['primary_defect'].upper()
            title = f"{severity.upper()} Severity Defect Detected"
            message = f"Inspection #{inspection_id} detected a {defect_type} classified as {severity.upper()} severity."
            notif_severity = 'high' if severity.lower() in ['high', 'critical'] else 'warning'
            twin.create_notification(title, message, notif_severity, 'inspection', inspection_id)

        # 7. Normalize absolute paths to relative URL paths for frontend
        upload_folder = app.config['UPLOAD_FOLDER']

        def normalize_image_path(abs_path: str) -> str:
            """Convert absolute filesystem path to relative uploads/ URL path."""
            if not abs_path:
                return abs_path
            # Already a relative/URL path
            if abs_path.startswith('uploads/') or abs_path.startswith('/uploads/') or abs_path.startswith('http'):
                return abs_path
            # Extract just the filename and return as relative path
            return 'uploads/' + os.path.basename(abs_path)

        vision_result['image'] = normalize_image_path(vision_result.get('image', ''))
        vision_result['annotated_image'] = normalize_image_path(vision_result.get('annotated_image', ''))

        return jsonify({
            'inspection_id': inspection_id,
            'image_url': f'/uploads/{filename}',
            'vision': vision_result,
            'rag': rag_result,
            'reasoning': reasoning_result
        })

    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        sanitized = secure_filename(filename)
        upload_folder = app.config['UPLOAD_FOLDER']
        target_path = os.path.join(upload_folder, sanitized)
        if not sanitized or not os.path.exists(target_path):
            return jsonify({'error': 'NOT_FOUND', 'message': 'Uploaded file not found'}), 404
        return send_from_directory(upload_folder, sanitized)

    @app.route('/history')
    def history():
        twin = DigitalTwinAgent()
        try:
            limit = int(request.args.get('limit', 10))
        except (ValueError, TypeError):
            limit = 10
        return jsonify(twin.get_history(limit=limit))

    @app.route('/search')
    def search():
        twin = DigitalTwinAgent()
        query = request.args.get('q', '')
        try:
            limit = int(request.args.get('limit', 20))
        except (ValueError, TypeError):
            limit = 20
        if not query:
            return jsonify([])
        return jsonify(twin.search_inspections(query, limit=limit))

    @app.route('/notifications')
    def get_notifications():
        twin = DigitalTwinAgent()
        try:
            limit = int(request.args.get('limit', 50))
        except (ValueError, TypeError):
            limit = 50
        return jsonify(twin.get_notifications(limit=limit))

    @app.route('/notifications/read', methods=['POST'])
    def mark_notifications_read():
        twin = DigitalTwinAgent()
        twin.mark_notifications_read()
        return jsonify({'status': 'success'})

    @app.route('/system/status', methods=['GET'])
    def system_status():
        db_path = str(app.config.get('DATABASE_PATH', 'digital_twin.db'))
        db_size = 'Unknown'
        last_sync = 'Offline'

        if os.path.exists(db_path):
            size_bytes = os.path.getsize(db_path)
            db_size = f"SQLite Local ({size_bytes / (1024 * 1024):.2f} MB)"
            mtime = os.path.getmtime(db_path)
            dt = datetime.fromtimestamp(mtime)
            if dt.date() == datetime.today().date():
                last_sync = f"Today, {dt.strftime('%H:%M')}"
            else:
                last_sync = dt.strftime('%Y-%m-%d %H:%M')

        return jsonify({
            'version': app.config.get('APP_VERSION', 'v2.6.0-hardened'),
            'database': db_size,
            'last_sync': last_sync
        })

    @app.route('/system/diagnostics', methods=['GET'])
    def system_diagnostics():
        import time
        start_time = time.time()

        twin = DigitalTwinAgent()
        metrics = twin.get_db_metrics()

        vision_loaded = hasattr(vision, 'model') and vision.model is not None
        classes_count = len(vision.model.names) if vision_loaded and hasattr(vision.model, 'names') else 0
        weights_path = str(app.config.get('MODEL_PATH', 'best.pt'))
        weights_size_mb = round(os.path.getsize(weights_path) / (1024 * 1024), 2) if os.path.exists(weights_path) else 0

        rag_chunks = 0
        try:
            if hasattr(rag, 'vectorstore') and rag.vectorstore is not None and hasattr(rag.vectorstore, '_collection'):
                rag_chunks = rag.vectorstore._collection.count()
        except Exception:
            pass

        manuals_dir = str(app.config.get('MANUALS_DIR', 'manuals'))
        manuals_count = len([f for f in os.listdir(manuals_dir) if f.endswith('.pdf')]) if os.path.exists(manuals_dir) else 0

        reasoning_loaded = hasattr(reasoning, 'llm') and reasoning.llm is not None
        reasoning_model = getattr(reasoning.llm, 'model', app.config.get('LLM_MODEL', 'phi3:mini')) if reasoning_loaded else 'None'

        db_path = str(app.config.get('DATABASE_PATH', 'digital_twin.db'))
        db_size_mb = round(os.path.getsize(db_path) / (1024 * 1024), 2) if os.path.exists(db_path) else 0

        latency_ms = round((time.time() - start_time) * 1000, 1)

        return jsonify({
            'status': 'healthy',
            'latency_ms': latency_ms,
            'timestamp': datetime.now().isoformat(),
            'telemetry': {
                'vision': {
                    'name': 'Vision Agent',
                    'model': 'YOLOv11 Defect Detector',
                    'status': 'Online' if vision_loaded else 'Offline',
                    'classes': classes_count,
                    'weights_mb': weights_size_mb,
                    'device': 'CPU / PyTorch'
                },
                'rag': {
                    'name': 'Manuals & RAG Index',
                    'engine': 'LangChain ChromaDB',
                    'status': 'Indexed' if rag_chunks > 0 else 'Ready',
                    'chunks_count': rag_chunks,
                    'manuals_count': manuals_count,
                    'embeddings': 'all-MiniLM-L6-v2'
                },
                'reasoning': {
                    'name': 'Reasoning Agent',
                    'engine': f'Ollama ({reasoning_model})',
                    'status': 'Ready' if reasoning_loaded else 'Offline',
                    'temperature': 0.1,
                    'max_tokens': 500
                },
                'database': {
                    'name': 'Digital Twin SQLite',
                    'status': 'Connected (WAL)',
                    'size_mb': db_size_mb,
                    'inspections': metrics['inspections_count'],
                    'notifications': metrics['notifications_count'],
                    'audit_logs': metrics['audit_count'],
                    'users': metrics['users_count']
                }
            }
        })

    @app.route('/digital-twin')
    def digital_twin_page():
        try:
            return render_template('digital_twin.html')
        except Exception:
            return jsonify({'message': 'Digital Twin Page', 'status': 'available'})

    @app.route('/report/<int:inspection_id>')
    def download_report(inspection_id):
        import json

        if inspection_id <= 0:
            return jsonify({'error': 'NOT_FOUND', 'message': 'Invalid inspection ID'}), 404

        twin = DigitalTwinAgent()
        cursor = twin.conn.execute('SELECT * FROM inspections WHERE id = ?', (inspection_id,))
        row = cursor.fetchone()

        if not row:
            return jsonify({'error': 'NOT_FOUND', 'message': 'Inspection not found'}), 404

        raw_detections = json.loads(row[3]) if row[3] else []
        image_path = row[2]
        annotated_image = image_path.rsplit('.', 1)[0] + '_annotated.jpg' if '.' in image_path else image_path + '_annotated.jpg'

        vision_result = {
            'timestamp': row[1],
            'image': image_path,
            'annotated_image': annotated_image,
            'detections': raw_detections,
            'primary_defect': row[4],
            'status': 'defect_found' if row[4] != 'none' else 'no_defect',
            'total_detections': len(raw_detections)
        }
        rag_result = {
            'procedure': row[6] or '',
            'source': row[7] or 'N/A',
            'page': row[8] or 0
        }
        reasoning_result = {'steps': json.loads(row[9]) if row[9] else []}

        report_dir = app.config['REPORT_DIR']
        os.makedirs(report_dir, exist_ok=True)
        output_path = os.path.join(report_dir, f'inspection_{inspection_id}.pdf')

        generate_report(vision_result, rag_result, reasoning_result, inspection_id, output_path)

        as_attachment = request.args.get('download') == 'true'
        return send_file(output_path, as_attachment=as_attachment,
                         download_name=f'AeroEdge_Inspection_{inspection_id}.pdf')

    @app.route('/report/<int:inspection_id>/csv')
    def download_csv(inspection_id):
        import json
        from io import StringIO
        from flask import Response

        if inspection_id <= 0:
            return jsonify({'error': 'NOT_FOUND', 'message': 'Invalid inspection ID'}), 404

        twin = DigitalTwinAgent()
        cursor = twin.conn.execute('SELECT * FROM inspections WHERE id = ?', (inspection_id,))
        row = cursor.fetchone()

        if not row:
            return jsonify({'error': 'NOT_FOUND', 'message': 'Inspection not found'}), 404

        raw_detections = json.loads(row[3]) if row[3] else []
        is_defect = row[4] != 'none'
        
        confidence_str = f"{raw_detections[0]['confidence'] * 100:.1f}%" if is_defect and raw_detections else 'N/A'
        severity_str = raw_detections[0]['severity'].upper() if is_defect and raw_detections else 'NONE'
        
        source = row[7]
        source_str = source.split('/')[-1].split('\\')[-1] if source else 'N/A'
        
        reasoning_steps = json.loads(row[9]) if row[9] else []
        steps_str = ' | '.join([s.get('title', '') for s in reasoning_steps]) if reasoning_steps else 'N/A'

        headers = ["Inspection ID", "Timestamp", "Status", "Primary Defect", "Max Confidence", "Severity Level", "Total Detections", "Source Manual", "Manual Page", "Generated Repair Steps"]
        
        row_data = [
            f"INSP-{inspection_id}",
            row[1],
            'DEFECT FOUND' if is_defect else 'NO DEFECTS',
            row[4].upper() if is_defect else 'NONE',
            confidence_str,
            severity_str,
            str(len(raw_detections)),
            source_str,
            str(row[8] or 'N/A'),
            f'"{steps_str}"'
        ]

        import csv
        output = StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        writer.writerow(headers)
        writer.writerow(row_data)
        
        csv_content = output.getvalue()
        
        return Response(
            csv_content,
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename=AeroEdge_Brief_Report_{inspection_id}.csv"}
        )


    return app

# Default application instance for development and WSGI
app = create_app()

if __name__ == '__main__':
    import multiprocessing
    multiprocessing.freeze_support()

    # Ensure stdout/stderr are valid in frozen/headless mode
    import sys
    import os
    from backend.config import get_config
    logs_dir = str(get_config().LOG_DIR)
    os.makedirs(logs_dir, exist_ok=True)
    if sys.stdout is None:
        try:
            sys.stdout = open(os.path.join(logs_dir, "backend_stdout.log"), "a", encoding="utf-8", buffering=1)
        except Exception:
            pass
    if sys.stderr is None:
        try:
            sys.stderr = open(os.path.join(logs_dir, "backend_stderr.log"), "a", encoding="utf-8", buffering=1)
        except Exception:
            pass

    import argparse
    parser = argparse.ArgumentParser(description="AeroEdge-X Backend Server")
    parser.add_argument('--port', type=int, default=app.config.get('PORT', 7860), help="Port to listen on")
    parser.add_argument('--host', type=str, default='127.0.0.1', help="Host to bind to")
    args, _ = parser.parse_known_args()

    port = args.port
    print(f"🚀 Starting AeroEdge-X on http://{args.host}:{port}")
    app.run(host=args.host, port=port, threaded=True, load_dotenv=False)