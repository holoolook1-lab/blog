'use server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function sendMagicLink(
  email: string,
  redirect?: string,
  flow: 'login' | 'signup' = 'login'
): Promise<{ ok: boolean; message?: string }> {
  try {
    const supabase = await getServerSupabase();
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const qp = new URLSearchParams();
    if (redirect) qp.set('redirect', redirect);
    qp.set('flow', flow);
    // 교차 브라우저/앱에서 클릭해도 마이페이지에서 승인할 수 있도록 전송 모드를 활성화
    qp.set('transfer', '1');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${site}/auth/callback?${qp.toString()}`,
      },
    });
    if (error) {
      console.error('[sendMagicLink] Supabase error:', error.message);
      return { ok: false, message: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    console.error('[sendMagicLink] Unexpected error:', e?.message || e);
    return { ok: false, message: e?.message || '알 수 없는 오류가 발생했습니다' };
  }
}
