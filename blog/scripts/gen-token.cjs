const crypto = require('crypto');

const secret = 'local-dev-secret-5e3b2a7d67c0f5e1c8b4a9d2f3e6a1b0';
const header = { alg: 'HS256', typ: 'JWT' };
const now = Math.floor(Date.now() / 1000);
const payload = { sub: 'dev-user', iat: now, exp: now + 3600 };

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const data = `${b64url(header)}.${b64url(payload)}`;
const sig = crypto.createHmac('sha256', secret).update(data).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
console.log(`${data}.${sig}`);
