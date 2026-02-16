const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.SCANWOW_TOKEN;

// Setup upload directory
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Keep original filename but ensure it's safe
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const crypto = require('crypto');

// ... (imports remain)

const app = express();
const port = process.env.PORT || 3000;
// Don't read AUTH_TOKEN here, read it inside middleware to ensure env is loaded or handle missing case

// ... (upload config remains)

// Middleware: Bearer Token Auth
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization header format' });
  }
  
  const token = parts[1];
  const validToken = process.env.SCANWOW_TOKEN;

  if (!validToken) {
    console.error('FATAL: SCANWOW_TOKEN is not set in environment.');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Timing-safe comparison to prevent timing attacks
  // Compare length first (leaks length but that's acceptable for tokens)
  if (token.length !== validToken.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(validToken))) {
    console.warn(`[AUTH FAILED] Invalid token attempt`);
    return res.status(403).json({ error: 'Invalid token' });
  }
  next();
};

app.use(express.json());

// Endpoint: POST /api/scans
// Handles both 'test ping' (JSON body) and real scans (multipart)
app.post('/api/scans', authenticate, (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  
  // 1. Handle JSON Test Ping
  if (contentType.includes('application/json')) {
    console.log('[PING] Received test ping from ScanWow');
    return res.json({ success: true, message: 'Connection successful!' });
  }
  
  // 2. Handle Multipart Upload (Real Scan)
  upload.any()(req, res, (err) => {
    if (err) {
      console.error('[UPLOAD ERROR]', err);
      return res.status(400).json({ error: err.message });
    }
    
    // Parse metadata (comes as a JSON string field named 'metadata')
    let metadata = {};
    if (req.body.metadata) {
      try {
        metadata = JSON.parse(req.body.metadata);
      } catch (e) {
        console.warn('[METADATA] Failed to parse metadata JSON');
      }
    }
    
    // Log details
    console.log(`[SCAN RECEIVED] Title: "${metadata.title || 'Untitled'}"`);
    console.log(`  - Files: ${req.files.length}`);
    console.log(`  - Scan ID: ${metadata.scanId}`);
    console.log(`  - Page Count: ${metadata.pageCount}`);
    if (req.body.ocrText) {
      console.log(`  - OCR Text Length: ${req.body.ocrText.length} chars`);
    }

    req.files.forEach(f => {
      console.log(`  -> Saved: ${f.filename} (${(f.size / 1024).toFixed(1)} KB)`);
    });

    res.json({ success: true, message: 'Scan received successfully' });
  });
});

app.listen(port, () => {
  console.log(`ScanWow Receiver running on port ${port}`);
  if (!AUTH_TOKEN) console.warn('WARNING: SCANWOW_TOKEN is not set in .env!');
});
