import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';
import crypto from 'crypto';

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
  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // CSP nonce 발급(중요 페이지에서 우선 적용하기 위해 쿠키로 전달)
  try {
    const nonce = crypto.randomBytes(16).toString('base64');
    res.cookies.set('cspnonce', nonce, { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    // 중요 페이지: 보수적 Enforce 헤더 적용(초기에는 inline 허용 유지, nonce 병행)
    const p = req.nextUrl.pathname;
    const isImportantPage =
      p === '/' ||
      p === '/write' ||
      /^\/posts(\/.*)?$/.test(p) ||
      /^\/mypage(\/.*)?$/.test(p) ||
      /^\/privacy(\/.*)?$/.test(p) ||
      /^\/terms(\/.*)?$/.test(p);
    if (isImportantPage) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      let supabaseHost = '';
      try { supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : ''; } catch {}
      const cspEnforce = [
        "default-src 'self'",
        `img-src 'self' https: data: ${supabaseHost} i.ytimg.com`,
        "media-src 'self' https:",
        `script-src 'self' 'nonce-${nonce}'`,
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' https: data:",
        `connect-src 'self' https: wss: ${supabaseHost}`,
        'frame-src https://www.youtube.com https://player.vimeo.com https://www.dailymotion.com https://player.twitch.tv https://tv.naver.com https://www.instagram.com https://www.tiktok.com https://www.facebook.com',
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
      res.headers.set('Content-Security-Policy', cspEnforce);
    }
  } catch {}

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

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = projectUrl && anonKey
    ? createServerClient(projectUrl, anonKey, {
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
      })
    : null as unknown as ReturnType<typeof createServerClient>;
  const session = supabase
    ? (await supabase.auth.getSession()).data.session
    : null;

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
    '/write/:path*',
    '/edit/:path*',
    '/api/comments/:path*',
    '/api/upload/:path*',
    '/api/votes/:path*',
    '/api/bookmarks/:path*',
    '/api/auth/token/:path*',
  ],
};
