import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: 'env' }, { status: 500 });
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user || null;
    if (!user) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const json = await req.json().catch(() => ({}));
    const privacy_version = (json?.privacy_version || '').toString() || null;
    const terms_version = (json?.terms_version || '').toString() || null;
    const privacy = !!json?.privacy;
    const terms = !!json?.terms;
    if (!privacy_version || !terms_version || !privacy || !terms) {
      return NextResponse.json({ ok: false, error: 'invalid_payload' }, { status: 400 });
    }

    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')) as string | null;
    const user_agent = req.headers.get('user-agent') || null;
    const { error } = await supabase
      .from('agreements')
      .insert({
        user_id: user.id,
        privacy_version,
        terms_version,
        consented_at: new Date().toISOString(),
        ip,
        user_agent,
      });
    if (error) return NextResponse.json({ ok: false, error: error.message || 'insert_failed' }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown_error' }, { status: 500 });
  }
}
