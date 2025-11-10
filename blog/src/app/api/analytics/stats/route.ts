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
  try {
    const supabase = await getServerSupabase();
    if (!supabase) {
      // 서버 환경 변수 누락 시 페이지 렌더링을 막지 않고 0으로 응답
      return NextResponse.json({ today: 0, total: 0 });
    }
    const today = todayDateStr();
    const { count: todayCount } = await supabase
      .from('daily_visits')
      .select('visitor_id', { count: 'exact', head: true })
      .eq('visit_date', today);
    const { count: totalCount } = await supabase
      .from('visitors')
      .select('id', { count: 'exact', head: true });
    return NextResponse.json({ today: todayCount || 0, total: totalCount || 0 });
  } catch {
    // 쿼리 오류 시에도 렌더링 지연 없이 기본값 반환
    return NextResponse.json({ today: 0, total: 0 });
  }
}
