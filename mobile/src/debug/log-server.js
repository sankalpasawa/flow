#!/usr/bin/env node
/**
 * Simple log capture server
 * App sends logs here, Claude reads them from disk.
 * 
 * Usage: node mobile/src/debug/log-server.js
 * App sends: POST http://<mac-ip>:9877/log {level, message, data}
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 9877;
const LOG_FILE = path.join(__dirname, '../../app-logs.txt');

// Clear old logs on start
fs.writeFileSync(LOG_FILE, `--- DayFlow Logs (started ${new Date().toISOString()}) ---\n`);

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { level, message, data } = JSON.parse(body);
        const line = `[${new Date().toISOString()}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;
        fs.appendFileSync(LOG_FILE, line);
        if (level === 'ERROR' || level === 'WARN') {
          console.log(`⚠️  ${message}`);
        }
      } catch {}
      res.writeHead(200);
      res.end('ok');
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/logs') {
    const logs = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf8') : '';
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(logs);
    return;
  }

  if (req.method === 'GET' && req.url === '/errors') {
    const logs = fs.existsSync(LOG_FILE) ? fs.readFileSync(LOG_FILE, 'utf8') : '';
    const errors = logs.split('\n').filter(l => l.includes('[ERROR]') || l.includes('[WARN]')).join('\n');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(errors || 'No errors');
    return;
  }

  res.writeHead(200);
  res.end('DayFlow Log Server');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`📋 Log server on port ${PORT}`);
  console.log(`📁 Logs: ${LOG_FILE}`);
});
