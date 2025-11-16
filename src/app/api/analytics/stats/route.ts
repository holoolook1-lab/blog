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
  // 로컬 개발 등 환경 변수 누락 시에도 UI 에러가 없도록 200/0값 반환
  if (!supabase) {
    return NextResponse.json({ ok: false, today: 0, total: 0 });
  }

  try {
    const today = todayDateStr();
    const { count: todayCount } = await supabase
      .from('daily_visits')
      .select('visitor_id', { count: 'exact', head: true })
      .eq('visit_date', today);
    const { count: totalCount } = await supabase
      .from('visitors')
      .select('id', { count: 'exact', head: true });

    return NextResponse.json({ ok: true, today: todayCount || 0, total: totalCount || 0 });
  } catch (e) {
    // Supabase 오류 발생 시에도 조용히 0값 반환
    return NextResponse.json({ ok: false, today: 0, total: 0 });
  }
}

