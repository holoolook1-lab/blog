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
      limiter: Ratelimit.slidingWindow(10, '60 s'), // comments
      analytics: true,
    })
  : null;
const uploadLimit = hasKV
  ? new Ratelimit({ redis: kv, limiter: Ratelimit.slidingWindow(5, '60 s'), analytics: true })
  : null;
const voteLimit = hasKV
  ? new Ratelimit({ redis: kv, limiter: Ratelimit.slidingWindow(10, '60 s'), analytics: true })
  : null;
const bookmarkLimit = hasKV
  ? new Ratelimit({ redis: kv, limiter: Ratelimit.slidingWindow(10, '60 s'), analytics: true })
  : null;
const authTokenLimit = hasKV
  ? new Ratelimit({ redis: kv, limiter: Ratelimit.slidingWindow(20, '60 s'), analytics: true })
  : null;

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const localeMatch = path.match(/^\/(en|ko)(\/(.*))?$/);
  if (localeMatch) {
    const locale = localeMatch[1];
    const rest = localeMatch[2] ? `/${localeMatch[2].replace(/^\//, '')}` : '';
    const target = new URL(rest || '/', req.nextUrl.origin);
    const res = NextResponse.rewrite(target);
    res.cookies.set('locale', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' });
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.headers.set('X-Frame-Options', 'SAMEORIGIN');
    res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return res;
  }
  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Rate limit for API routes
  if (req.nextUrl.pathname.startsWith('/api/comments') && ratelimit) {
    // NextRequest 타입에서 ip 프로퍼티가 없을 수 있어 헤더 기반으로 추출
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = (forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1');
    const { success } = await ratelimit.limit(ip);
    if (!success) return new NextResponse('Too many requests', { status: 429 });
  }

  if (req.nextUrl.pathname.startsWith('/api/upload') && uploadLimit) {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = (forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1');
    const { success } = await uploadLimit.limit(ip);
    if (!success) return new NextResponse('Too many requests', { status: 429 });
  }
  if (req.nextUrl.pathname.startsWith('/api/votes') && voteLimit) {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = (forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1');
    const { success } = await voteLimit.limit(ip);
    if (!success) return new NextResponse('Too many requests', { status: 429 });
  }
  if (req.nextUrl.pathname.startsWith('/api/bookmarks') && bookmarkLimit) {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = (forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1');
    const { success } = await bookmarkLimit.limit(ip);
    if (!success) return new NextResponse('Too many requests', { status: 429 });
  }
  if (req.nextUrl.pathname.startsWith('/api/auth/token') && authTokenLimit) {
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = (forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1');
    const { success } = await authTokenLimit.limit(ip);
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
  matcher: [
    '/(en|ko)',
    '/(en|ko)/:path*',
    '/write/:path*',
    '/edit/:path*',
    '/api/comments/:path*',
    '/api/upload/:path*',
    '/api/votes/:path*',
    '/api/bookmarks/:path*',
    '/api/auth/token/:path*',
  ],
};
