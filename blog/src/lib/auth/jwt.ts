const encoder = new TextEncoder();

function base64url(input: Uint8Array | string) {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input;
  const b64 = Buffer.from(bytes).toString('base64');
  return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export type JwtPayload = Record<string, any> & { sub?: string; iat?: number; exp?: number };

export function signTokenHS256(payload: JwtPayload, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = base64url(JSON.stringify(header));
  const p = base64url(JSON.stringify(payload));
  const data = `${h}.${p}`;
  const signature = require('crypto').createHmac('sha256', secret).update(data).digest('base64')
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${data}.${signature}`;
}

export function verifyTokenHS256(token: string, secret: string): { valid: boolean; payload?: JwtPayload; error?: string } {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return { valid: false, error: 'malformed' };
    const data = `${h}.${p}`;
    const expected = require('crypto').createHmac('sha256', secret).update(data).digest('base64')
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    if (s !== expected) return { valid: false, error: 'signature' };
    const payload = JSON.parse(Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now >= payload.exp) return { valid: false, error: 'expired' };
    return { valid: true, payload };
  } catch (e: any) {
    return { valid: false, error: e?.message || 'verify_error' };
  }
}

