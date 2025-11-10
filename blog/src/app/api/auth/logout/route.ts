import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = await getServerSupabase();
  if (!supabase) return NextResponse.json({ error: 'env' }, { status: 500 });
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}

