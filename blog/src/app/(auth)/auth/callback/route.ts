import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
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
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!projectUrl || !anonKey) {
      const qp = new URLSearchParams();
      qp.set('flow', flow);
      qp.set('auth_error', 'missing_supabase_env');
      const dest = redirect.includes('?') ? `${redirect}&${qp.toString()}` : `${redirect}?${qp.toString()}`;
      return NextResponse.redirect(dest);
    }

    // Response 객체에 쿠키를 써야 PKCE 교환 후 세션이 설정됩니다.
    const response = new NextResponse(null, { status: 302 });
    const supabase = createServerClient(projectUrl, anonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options?: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options?: any) {
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    });

    await supabase.auth.exchangeCodeForSession(code);
    const qp = new URLSearchParams();
    qp.set('flow', flow);
    qp.set('auth_success', flow);
    const dest = redirect.includes('?') ? `${redirect}&${qp.toString()}` : `${redirect}?${qp.toString()}`;
    response.headers.set('Location', dest);
    return response;
  } catch (e: any) {
    const qp = new URLSearchParams();
    qp.set('flow', flow);
    qp.set('auth_error', e?.message ? decodeURIComponent(e.message) : 'exchange_failed');
    const dest = redirect.includes('?') ? `${redirect}&${qp.toString()}` : `${redirect}?${qp.toString()}`;
    return NextResponse.redirect(dest);
  }
}
