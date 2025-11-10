import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'env' }, { status: 500 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ user_id: user.id, email: user.email });
}

