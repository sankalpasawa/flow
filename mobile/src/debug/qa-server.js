#!/usr/bin/env node
/**
 * DayFlow Design QA Server — Smart Mode
 *
 * POST /qa/start  — activate QA mode (app starts capturing unique screens)
 * POST /qa/stop   — deactivate QA mode
 * POST /trigger   — force capture current screen
 * GET  /qa-state  — app polls this to know if QA is active
 * POST /upload    — receive screenshot from app
 * POST /ack       — acknowledge force trigger consumed
 * GET  /captures  — list all screenshots
 * GET  /latest    — latest screenshot path
 * GET  /status    — server status
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9876;
const SAVE_DIR = path.join(__dirname, '../../qa-screenshots');
if (!fs.existsSync(SAVE_DIR)) fs.mkdirSync(SAVE_DIR, { recursive: true });

let qaActive = false;
let forceTrigger = false;
let triggerLabel = '';
let pendingCommand = null;   // { command, commandId }
let commandCounter = 0;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  const url = req.url;

  // POST /qa/start
  if (req.method === 'POST' && url === '/qa/start') {
    qaActive = true;
    console.log('🟢 QA mode ON — app will capture each unique screen');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ active: true }));
    return;
  }

  // POST /qa/stop
  if (req.method === 'POST' && url === '/qa/stop') {
    qaActive = false;
    console.log('🔴 QA mode OFF');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ active: false }));
    return;
  }

  // POST /trigger
  if (req.method === 'POST' && url === '/trigger') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      triggerLabel = body ? (JSON.parse(body).label || 'forced') : 'forced';
      forceTrigger = true;
      console.log(`🎯 Force trigger: "${triggerLabel}"`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
    return;
  }

  // POST /command — Claude sends a navigation/control command
  if (req.method === 'POST' && url === '/command') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { command } = JSON.parse(body);
        commandCounter++;
        const commandId = `cmd-${commandCounter}`;
        pendingCommand = { command, commandId };
        console.log(`🎮 Command queued: "${command}" (${commandId})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, commandId }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // GET /qa-state — app polls this
  if (req.method === 'GET' && url === '/qa-state') {
    const response = { active: qaActive, forceTrigger, triggerLabel };
    if (pendingCommand) {
      response.command = pendingCommand.command;
      response.commandId = pendingCommand.commandId;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
    return;
  }

  // POST /ack-cmd — app acknowledges command execution
  if (req.method === 'POST' && url === '/ack-cmd') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { commandId } = JSON.parse(body);
        if (pendingCommand && pendingCommand.commandId === commandId) {
          console.log(`✅ Command acknowledged: ${commandId}`);
          pendingCommand = null;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // POST /ack — app consumed force trigger
  if (req.method === 'POST' && url === '/ack') {
    forceTrigger = false;
    triggerLabel = '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // POST /upload
  if (req.method === 'POST' && url === '/upload') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { filename, base64 } = JSON.parse(body);
        const filePath = path.join(SAVE_DIR, filename);
        fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
        console.log(`📸 ${filename} (${Math.round(Buffer.from(base64, 'base64').length / 1024)}KB)`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, path: filePath }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // GET /captures
  if (req.method === 'GET' && url === '/captures') {
    const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.png')).sort();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: files.length, files }));
    return;
  }

  // GET /latest
  if (req.method === 'GET' && url === '/latest') {
    const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.png')).sort();
    const latest = files[files.length - 1] || null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ latest, path: latest ? path.join(SAVE_DIR, latest) : null }));
    return;
  }

  // GET /status
  if (req.method === 'GET' && (url === '/status' || url === '/')) {
    const files = fs.readdirSync(SAVE_DIR).filter(f => f.endsWith('.png'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ running: true, qaActive, captures: files.length }));
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎨 DayFlow Design QA Server`);
  console.log(`📡 Port ${PORT} | QA mode: OFF`);
  console.log(`\nClaude commands:`);
  console.log(`  POST /qa/start  — start capturing`);
  console.log(`  POST /qa/stop   — stop capturing`);
  console.log(`  POST /trigger   — force one capture`);
  console.log(`  POST /command   — send navigation command`);
  console.log(`    { "command": "navigate:ActivityForm" }`);
  console.log(`    { "command": "tab:Plan" }`);
  console.log(`    { "command": "expandTaskBar" }\n`);
});
