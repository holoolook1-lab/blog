import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function todayDateStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST() {
  const supabase = await getServerSupabase();
  if (!supabase) {
    // 로컬에서 Supabase 공개 환경변수가 없으면 안전하게 종료
    return NextResponse.json({ ok: false, error: 'supabase_env_missing' }, { status: 500 });
  }

  const c = await cookies();
  let visitorId = c.get('visitor_id')?.value || '';
  let newCookie = false;
  if (!visitorId) {
    // ES 모듈 호환성: Node.js crypto 모듈 안전하게 사용
    try {
      // Node.js 14.17+ 에서 사용 가능
      const { randomUUID } = await import('node:crypto');
      visitorId = randomUUID();
    } catch {
      // Fallback: crypto가 없으면 대체 방법 사용
      visitorId = globalThis.crypto?.randomUUID?.() || 
                Math.random().toString(36).substring(2) + 
                Date.now().toString(36) + 
                Math.random().toString(36).substring(2);
    }
    newCookie = true;
  }

  // 고유 방문자 등록
  await supabase.from('visitors').upsert({ id: visitorId }, { onConflict: 'id' });

  // 일별 고유 방문 등록
  const today = todayDateStr();
  await supabase.from('daily_visits').upsert({ visit_date: today, visitor_id: visitorId }, { onConflict: 'visit_date,visitor_id' });

  // 집계 조회
  const { count: todayCount } = await supabase
    .from('daily_visits')
    .select('visitor_id', { count: 'exact', head: true })
    .eq('visit_date', today);
  const { count: totalCount } = await supabase
    .from('visitors')
    .select('id', { count: 'exact', head: true });

  const res = NextResponse.json({ ok: true, today: todayCount || 0, total: totalCount || 0 });
  if (newCookie) {
    res.cookies.set('visitor_id', visitorId, { httpOnly: true, path: '/', maxAge: 365 * 24 * 60 * 60 });
  }
  return res;
}
