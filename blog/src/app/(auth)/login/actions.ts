'use server';
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';

export async function sendMagicLink(
  email: string,
  redirect?: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const supabase = createServerActionClient({ cookies });
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${site}/auth/callback${redirectParam}`,
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
