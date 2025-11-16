import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'init_failed' }, { status: 500 });
  }
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const { data: userData } = await supabase.auth.getUser();
    const session = sessionData?.session || null;
    const user = userData?.user || null;
    if (!session || !user) {
      return NextResponse.json({ ok: false, user: null }, { status: 200 });
    }
    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: (user as any).email || null },
      session: {
        access_token: (session as any).access_token,
        refresh_token: (session as any).refresh_token,
        expires_at: (session as any).expires_at,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'session_error' }, { status: 500 });
  }
}

