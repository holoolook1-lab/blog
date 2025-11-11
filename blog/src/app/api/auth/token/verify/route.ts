import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenHS256 } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = (body?.token || '').toString();
    const secret = process.env.APP_JWT_SECRET || '';
    if (!secret) return NextResponse.json({ ok: false, error: 'missing_secret' }, { status: 500 });
    if (!token) return NextResponse.json({ ok: false, error: 'missing_token' }, { status: 400 });
    const result = verifyTokenHS256(token, secret);
    if (!result.valid) return NextResponse.json({ ok: false, error: result.error || 'invalid' }, { status: 400 });
    return NextResponse.json({ ok: true, payload: result.payload });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'verify_error' }, { status: 500 });
  }
}

