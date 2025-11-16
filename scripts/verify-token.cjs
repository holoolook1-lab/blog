const crypto = require('crypto');
const http = require('http');

const secret = 'local-dev-secret-5e3b2a7d67c0f5e1c8b4a9d2f3e6a1b0';
const b64u = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const now = Math.floor(Date.now() / 1000);
const data = `${b64u({ alg: 'HS256', typ: 'JWT' })}.${b64u({ sub: 'dev-user', iat: now, exp: now + 3600 })}`;
const sig = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = `${data}.${sig}`;

const body = JSON.stringify({ token });
const req = http.request({ hostname: 'localhost', port: 3000, path: '/api/auth/token/verify', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, (res) => {
  let out = '';
  res.on('data', (c) => out += c);
  res.on('end', () => { console.log(out); });
});
req.on('error', (e) => { console.error('ERR', e.message); });
req.write(body);
req.end();
