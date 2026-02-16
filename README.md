# ScanWow API Receiver (Starter Kit)

This repository contains simple, plug-and-play server examples for receiving scans from the ScanWow iOS App's "Secure API Export" feature.

Use this if you want to:
- Automatically save scans to your own server/laptop
- Process scans with custom scripts (Python/Node)
- Bypass Zapier/Make fees
- Integrate scanning into your own workflow

## How it works

1. Deploy one of these servers (Node.js or Python).
2. Set a secret token (e.g., `MY_SECRET_KEY`).
3. Point your ScanWow app to `https://your-server.com/api/scans`.
4. Enter the same token in the app.

## Quick Start

### Option A: Node.js (Recommended)

1. `cd node-express`
2. `npm install`
3. Create `.env` file: `SCANWOW_TOKEN=mysecret`
4. `npm start`

### Option B: Python (Flask)

1. `cd python-flask`
2. `pip install flask`
3. `export SCANWOW_TOKEN=mysecret`
4. `python app.py`

## Payload Format

The app sends a `multipart/form-data` POST request with:

- **Files**:
  - `pdf`: The full PDF document
  - `image_0`, `image_1`, ...: Original JPG images (if enabled)
- **Fields**:
  - `metadata`: JSON string with scan details (`title`, `scanId`, `pageCount`, `ocrLanguage`, etc.)
  - `ocrText`: Full OCR text content (if enabled)

## Hosting Ideas

- **Free/Cheap**: Render, Railway, Fly.io, Heroku
- **Self-Hosted**: Raspberry Pi, DigitalOcean Droplet, Home Server (expose via Cloudflare Tunnel or Ngrok)

## License

MIT - Do whatever you want with this code!
