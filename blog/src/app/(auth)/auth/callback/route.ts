import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const flow = url.searchParams.get('flow') || 'login';
  const err = url.searchParams.get('error');
  const errCode = url.searchParams.get('error_code');
  const errDesc = url.searchParams.get('error_description');
  const redirect = url.searchParams.get('redirect') || '/';
  // Supabase가 에러 파라미터만 전달한 경우 에러를 함께 리디렉트
  if (!code) {
    if (err || errCode || errDesc) {
      const qp = new URLSearchParams();
      qp.set('flow', flow);
      qp.set('auth_error', decodeURIComponent(errDesc || errCode || err || 'unknown_error'));
      const dest = redirect.includes('?') ? `${redirect}&${qp.toString()}` : `${redirect}?${qp.toString()}`;
      return NextResponse.redirect(dest);
    }
    return NextResponse.redirect(redirect);
  }

  try {
    const supabase = await getServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
    const qp = new URLSearchParams();
    qp.set('flow', flow);
    qp.set('auth_success', flow);
    const dest = redirect.includes('?') ? `${redirect}&${qp.toString()}` : `${redirect}?${qp.toString()}`;
    return NextResponse.redirect(dest);
  } catch (e: any) {
    const qp = new URLSearchParams();
    qp.set('flow', flow);
    qp.set('auth_error', e?.message ? decodeURIComponent(e.message) : 'exchange_failed');
    const dest = redirect.includes('?') ? `${redirect}&${qp.toString()}` : `${redirect}?${qp.toString()}`;
    return NextResponse.redirect(dest);
  }
}
