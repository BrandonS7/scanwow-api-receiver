from flask import Flask, request, jsonify
import os
import time
import json

app = Flask(__name__)

# Config
UPLOAD_DIR = 'uploads'
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

AUTH_TOKEN = os.environ.get('SCANWOW_TOKEN', 'test')

# Middleware: Auth
@app.before_request
def check_auth():
    # Skip auth for public routes if any (none here)
    if request.endpoint and 'static' in request.endpoint:
        return
        
    auth = request.headers.get('Authorization')
    if not auth or len(auth.split(' ')) < 2:
        return jsonify({'error': 'Missing Authorization header'}), 401
        
    token = auth.split(' ')[1]
    if token != AUTH_TOKEN:
        print(f"[AUTH FAILED] Invalid token attempt: {token}")
        return jsonify({'error': 'Invalid token'}), 403

@app.route('/api/scans', methods=['POST'])
def handle_scan():
    # 1. Handle JSON Test Ping
    if request.is_json:
        data = request.get_json()
        print(f"[PING] Received test ping: {data}")
        return jsonify({'success': True, 'message': 'Connection successful!'})

    # 2. Handle Multipart Upload (Real Scan)
    try:
        # Save files
        saved_files = []
        for key, file in request.files.items():
            # Basic sanitization
            safe_name = "".join([c for c in file.filename if c.isalnum() or c in "._-"])
            filename = f"{int(time.time())}_{safe_name}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            file.save(filepath)
            saved_files.append(filename)

        # Log metadata
        metadata_str = request.form.get('metadata')
        metadata = {}
        if metadata_str:
            try:
                metadata = json.loads(metadata_str)
            except:
                pass
                
        ocr_text = request.form.get('ocrText')
        
        print(f"[SCAN RECEIVED] Title: {metadata.get('title', 'Untitled')}")
        print(f"  - Saved {len(saved_files)} files: {saved_files}")
        if ocr_text:
            print(f"  - OCR Text Length: {len(ocr_text)} chars")

        return jsonify({'success': True, 'message': 'Scan received successfully'})

    except Exception as e:
        print(f"[ERROR] {str(e)}")
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    print(f"ScanWow Receiver running on port 5000")
    print(f"Token required: {AUTH_TOKEN}")
    app.run(host='0.0.0.0', port=5000)
