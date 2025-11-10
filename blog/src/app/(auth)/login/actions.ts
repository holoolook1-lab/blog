'use server';
import { cookies } from 'next/headers';
import { createServerActionClient } from '@supabase/auth-helpers-nextjs';

export async function sendMagicLink(email: string, redirect?: string) {
  const supabase = createServerActionClient({ cookies });
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const redirectParam = redirect ? `?redirect=${encodeURIComponent(redirect)}` : '';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${site}/auth/callback${redirectParam}`,
    },
  });
  if (error) throw new Error(error.message);
}