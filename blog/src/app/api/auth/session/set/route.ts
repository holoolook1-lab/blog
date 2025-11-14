import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!projectUrl || !anonKey) return NextResponse.json({ ok: false, error: 'missing_supabase_env' }, { status: 500 });
  const body = await req.json();
  const access_token = body?.access_token;
  const refresh_token = body?.refresh_token;
  if (!access_token || !refresh_token) return NextResponse.json({ ok: false, error: 'missing_tokens' }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  const supabase = createServerClient(projectUrl, anonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options?: any) {
        res.cookies.set(name, value, options);
      },
      remove(name: string, options?: any) {
        res.cookies.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });
  await supabase.auth.setSession({ access_token, refresh_token });
  return res;
}
