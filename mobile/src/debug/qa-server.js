#!/usr/bin/env node
/**
 * DayFlow Design QA Server — On-Demand
 *
 * Claude triggers screenshots via POST /trigger.
 * iPhone app polls GET /pending, captures when flagged, uploads via POST /upload.
 * Claude reads screenshots from disk.
 *
 * Usage: node mobile/src/debug/qa-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9876;
const SAVE_DIR = path.join(__dirname, '../../qa-screenshots');

if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });

// Pending capture request (set by Claude, consumed by iPhone)
let pendingCapture = null; // { label: string } or null

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  // POST /trigger — Claude requests a screenshot
  if (req.method === 'POST' && req.url === '/trigger') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const label = body ? (JSON.parse(body).label || 'qa') : 'qa';
      pendingCapture = { label, requestedAt: Date.now() };
      console.log(`🎯 Trigger: "${label}" — waiting for iPhone to capture...`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, label }));
    });
    return;
  }

  // GET /pending — iPhone polls this
  if (req.method === 'GET' && req.url === '/pending') {
    if (pendingCapture) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ pending: true, label: pendingCapture.label }));
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ pending: false }));
    }
    return;
  }

  // POST /ack — iPhone acknowledges capture done
  if (req.method === 'POST' && req.url === '/ack') {
    pendingCapture = null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // POST /upload — iPhone sends screenshot
  if (req.method === 'POST' && req.url === '/upload') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { filename, base64 } = JSON.parse(body);
        const filePath = path.join(SAVE_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
        console.log(`📸 Saved: ${filename} (${Math.round(Buffer.from(base64, 'base64').length / 1024)}KB)`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, path: filePath }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // GET /captures — list screenshots
  if (req.method === 'GET' && req.url === '/captures') {
    const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.png')).sort();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: files.length, files }));
    return;
  }

  // GET /latest — latest screenshot filename
  if (req.method === 'GET' && req.url === '/latest') {
    const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.png')).sort();
    const latest = files[files.length - 1] || null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ latest, path: latest ? path.join(SAVE_DIR, latest) : null }));
    return;
  }

  // GET /status
  if (req.method === 'GET' && (req.url === '/status' || req.url === '/')) {
    const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.png'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ running: true, port: PORT, captures: files.length, pending: !!pendingCapture }));
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎨 DayFlow Design QA Server (on-demand)`);
  console.log(`📡 Port ${PORT}`);
  console.log(`📁 ${SAVE_DIR}\n`);
  console.log(`Claude triggers: POST http://localhost:${PORT}/trigger`);
  console.log(`iPhone polls:    GET  http://<mac-ip>:${PORT}/pending\n`);
});
