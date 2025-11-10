import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function todayDateStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function GET() {
  const supabase = await getServerSupabase();
  const today = todayDateStr();
  const { count: todayCount } = await supabase
    .from('daily_visits')
    .select('visitor_id', { count: 'exact', head: true })
    .eq('visit_date', today);
  const { count: totalCount } = await supabase
    .from('visitors')
    .select('id', { count: 'exact', head: true });
  return NextResponse.json({ today: todayCount || 0, total: totalCount || 0 });
}

