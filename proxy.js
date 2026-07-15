// proxy.js — node proxy.js
// Then open http://localhost:3001

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// ── PUT YOUR OPENROUTER KEY HERE ──
const OPENROUTER_API_KEY = 'sk-or-v1-XXXX';
// ─────────────────────────────────

const PORT = 3001;
const MIME = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.json':'application/json', '.png':'image/png', '.ico':'image/x-icon' };

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && req.url === '/api/messages') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const anthropicReq = JSON.parse(body);
      const openRouterReq = JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        max_tokens: anthropicReq.max_tokens || 1000,
        messages: anthropicReq.messages,
      });

      const opts = {
        hostname: 'openrouter.ai',
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'QuickSell',
          'Content-Length': Buffer.byteLength(openRouterReq),
        }
      };

      const pr = https.request(opts, r => {
        let d = '';
        r.on('data', c => d += c);
        r.on('end', () => {
          console.log('OpenRouter status:', r.statusCode);
          console.log('OpenRouter raw response:', d);

          try {
            const orRes = JSON.parse(d);

            if (orRes.error) {
              console.error('OpenRouter returned an error:', orRes.error);
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify({ error: true, message: orRes.error.message || 'OpenRouter error' }) }] }));
              return;
            }

            const messageContent = orRes.choices?.[0]?.message?.content;
            if (!messageContent) {
              console.error('No content in OpenRouter response:', orRes);
              res.writeHead(200, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({ content: [{ type: 'text', text: JSON.stringify({ error: true, message: 'Empty response from model' }) }] }));
              return;
            }

            const converted = { content: [{ type: 'text', text: messageContent }] };
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(converted));
          } catch(e) {
            console.error('Failed to parse OpenRouter response:', e.message);
            res.writeHead(500); res.end(JSON.stringify({error: 'Parse error', raw: d}));
          }
        });
      });

      pr.on('error', err => { res.writeHead(500); res.end(JSON.stringify({error: err.message})); });
      pr.write(openRouterReq);
      pr.end();
    });
    return;
  }

  let fp = req.url === '/' ? '/index.html' : req.url;
  fp = path.join(__dirname, fp.split('?')[0]);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {'Content-Type': MIME[path.extname(fp)] || 'text/plain'});
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  QuickSell -> http://localhost:${PORT}\n`);
});
