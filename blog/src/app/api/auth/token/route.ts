import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { signTokenHS256 } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: 'env' }, { status: 500 });
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user || null;
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const secret = process.env.APP_JWT_SECRET || '';
    if (!secret) return NextResponse.json({ ok: false, error: 'missing_secret' }, { status: 500 });
    const now = Math.floor(Date.now() / 1000);
    const expSec = Math.max(60, Math.min(3600 * 24, Number(body?.expires_in || 3600))); // 기본 1시간, 최대 24시간
    const payload = {
      sub: user.id,
      email: (user as any).email || null,
      iat: now,
      exp: now + expSec,
      ...(body?.claims || {}),
    };
    const token = signTokenHS256(payload, secret);
    return NextResponse.json({ ok: true, token, exp: payload.exp });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'issue_error' }, { status: 500 });
  }
}

