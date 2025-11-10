import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const redirect = url.searchParams.get('redirect') || '/';
  if (!code) return NextResponse.redirect(redirect);

  try {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(redirect);
  } catch (e: any) {
    const message = e?.message ? encodeURIComponent(e.message) : 'exchange_failed';
    return NextResponse.redirect(`${redirect}?auth_error=${message}`);
  }
}
