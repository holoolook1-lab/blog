import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// 로컬 개발 환경에서 KV 미설정이어도 서버가 뜨도록 안전가드
const hasKV = !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;
const ratelimit = hasKV
  ? new Ratelimit({
      redis: kv,
      limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests per 60 seconds
      analytics: true,
    })
  : null;

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Rate limit for API routes
  if (req.nextUrl.pathname.startsWith('/api/comments') && ratelimit) {
    // NextRequest 타입에서 ip 프로퍼티가 없을 수 있어 헤더 기반으로 추출
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = (forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1');
    const { success } = await ratelimit.limit(ip);
    if (!success) return new NextResponse('Too many requests', { status: 429 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isProtected = req.nextUrl.pathname.startsWith('/write') || req.nextUrl.pathname.startsWith('/edit');
  if (!isProtected) return res;

  if (!session) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return res;
}

export const config = {
  matcher: ['/write/:path*', '/edit/:path*', '/api/comments/:path*'],
};
