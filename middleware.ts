import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
const genNonce = () => {
  try {
    // Prefer Web Crypto
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    const arr = new Uint8Array(16);
    if (globalThis.crypto?.getRandomValues) {
      globalThis.crypto.getRandomValues(arr);
      return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {}
  return Math.random().toString(36).slice(2);
};

// KV 기반 레이트리밋 제거: Edge Runtime 호환성과 단순화를 위해 비활성화

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // CSP nonce 발급(중요 페이지에서 우선 적용하기 위해 쿠키로 전달)
  try {
    const nonce = genNonce();
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

  // 레이트리밋 제거: 추후 필요 시 Edge 호환 솔루션으로 교체

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
