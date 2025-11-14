import type { NextConfig } from 'next';
import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';

// 환경변수가 비어 있어도 이미지 최적화가 동작하도록 기본값 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hyueqldwgertapmhmmni.supabase.co';
const hostname = (() => {
  try {
    return supabaseUrl ? new URL(supabaseUrl).hostname : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  images: {
    unoptimized: false,
    // 원격 이미지 최적화 허용: Supabase Storage 공개 객체
    remotePatterns: [
      // localhost (개발 환경)
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      } as const,
      // Supabase Storage 공개 객체 (프로젝트별 호스트)
      ...(hostname
        ? [
            {
              protocol: 'https',
              hostname,
              pathname: '/storage/v1/object/public/**',
            } as const,
          ]
        : []),
      // YouTube 썸네일 이미지
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        // 예: /vi/<videoId>/maxresdefault.jpg
        pathname: '/vi/**',
      } as const,
      // YouTube 대체 이미지 도메인
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        // 예: /vi/<videoId>/hqdefault.jpg
        pathname: '/vi/**',
      } as const,
      // YouTube CDN 도메인
      {
        protocol: 'https',
        hostname: 'ytimg.googleusercontent.com',
        pathname: '/**',
      } as const,
    ],
  },
  // 서버 파일 추적 루트를 turbopack.root와 동일하게 지정
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  turbopack: {
    // Vercel이 자동으로 설정하는 outputFileTracingRoot(`/vercel/path0`)와 일치시키기 위해
    // 프로젝트 디렉터리의 상위(리포지토리 루트)를 사용합니다.
    root: path.resolve(__dirname, '..'),
  },
  async headers() {
    const supabaseHost = hostname || '';
    
    // 개발 환경에서는 CSP 완화
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Vercel 배포 환경 체크
    const isVercel = process.env.VERCEL === '1';
    
    const csp = [
      "default-src 'self'",
      `img-src 'self' https: data: ${supabaseHost} i.ytimg.com`,
      "media-src 'self' https:",
      (isDevelopment || isVercel) ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' https: data:",
      `connect-src 'self' https: wss: ${supabaseHost}`,
      'frame-src https://www.youtube.com https://player.vimeo.com https://www.dailymotion.com https://player.twitch.tv https://tv.naver.com https://www.instagram.com https://www.tiktok.com https://www.facebook.com',
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    const cspReportOnly = [
      "default-src 'self'",
      `img-src 'self' https: data: ${supabaseHost} i.ytimg.com`,
      "media-src 'self' https:",
      (isDevelopment || isVercel) ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self'",
      (isDevelopment || isVercel) ? "style-src 'self' 'unsafe-inline'" : "style-src 'self'",
      "font-src 'self' https: data:",
      `connect-src 'self' https: wss: ${supabaseHost}`,
      'frame-src https://www.youtube.com https://player.vimeo.com https://www.dailymotion.com https://player.twitch.tv https://tv.naver.com https://www.instagram.com https://www.tiktok.com https://www.facebook.com',
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // 보고용 엔드포인트
      'report-uri /api/csp-report'
    ].join('; ');
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
