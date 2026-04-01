#!/usr/bin/env node
/**
 * DayFlow Design QA Server
 *
 * Tiny HTTP server running on the dev machine (Mac).
 * Receives screenshots from the iPhone app and saves them to disk.
 * Claude reads them via the Read tool for design QA.
 *
 * Usage: node mobile/src/debug/qa-server.js
 * Port: 9876
 * Screenshots saved to: mobile/qa-screenshots/
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9876;
const SAVE_DIR = path.join(__dirname, '../../qa-screenshots');

// Ensure directory exists
if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  // CORS headers (iPhone app needs these)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // POST /upload — receive screenshot from iPhone
  if (req.method === 'POST' && req.url === '/upload') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { filename, base64, screen, label } = JSON.parse(body);
        const filePath = path.join(SAVE_DIR, filename);
        const buffer = Buffer.from(base64, 'base64');
        fs.writeFileSync(filePath, buffer);

        const sizeKB = Math.round(buffer.length / 1024);
        console.log(`📸 ${screen}/${label} → ${filename} (${sizeKB}KB)`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, path: filePath }));
      } catch (err) {
        console.error('❌ Upload error:', err.message);
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // GET /captures — list all screenshots
  if (req.method === 'GET' && req.url === '/captures') {
    const files = fs.readdirSync(SAVE_DIR)
      .filter(f => f.endsWith('.png'))
      .sort()
      .map(f => ({
        name: f,
        size: fs.statSync(path.join(SAVE_DIR, f)).size,
        modified: fs.statSync(path.join(SAVE_DIR, f)).mtime,
      }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: files.length, files }));
    return;
  }

  // GET /capture/:filename — serve a screenshot
  if (req.method === 'GET' && req.url.startsWith('/capture/')) {
    const filename = req.url.replace('/capture/', '');
    const filePath = path.join(SAVE_DIR, filename);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(data);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  // GET /status
  if (req.method === 'GET' && req.url === '/status') {
    const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.png'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      running: true,
      port: PORT,
      captureDir: SAVE_DIR,
      captureCount: files.length,
      latest: files.sort().pop() || null,
    }));
    return;
  }

  // GET / — info page
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`DayFlow Design QA Server
Port: ${PORT}
Screenshots: ${SAVE_DIR}

Endpoints:
  POST /upload         — receive screenshot from iPhone app
  GET  /captures       — list all screenshots
  GET  /capture/:name  — serve a screenshot PNG
  GET  /status         — server status
`);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎨 DayFlow Design QA Server`);
  console.log(`📡 Listening on port ${PORT} (all interfaces)`);
  console.log(`📁 Saving to: ${SAVE_DIR}`);
  console.log(`\nWaiting for screenshots from iPhone...\n`);
});
