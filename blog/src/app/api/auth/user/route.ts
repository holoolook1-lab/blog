import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'env' }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const silent = req.nextUrl.searchParams.get('silent');
    if (silent === '1' || silent === 'true') {
      return NextResponse.json({ authenticated: false, user_id: null, email: null });
    }
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user_id: user.id, email: user.email });
}
