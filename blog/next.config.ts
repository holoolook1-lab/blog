import type { NextConfig } from 'next';
import path from 'path';

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
    // 원격 이미지 최적화 허용: Supabase Storage 공개 객체
    remotePatterns: [
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
    ],
  },
  // 서버 파일 추적 루트를 turbopack.root와 동일하게 지정
  outputFileTracingRoot: path.resolve(__dirname, '..'),
  turbopack: {
    // Vercel이 자동으로 설정하는 outputFileTracingRoot(`/vercel/path0`)와 일치시키기 위해
    // 프로젝트 디렉터리의 상위(리포지토리 루트)를 사용합니다.
    root: path.resolve(__dirname, '..'),
  },
};

export default nextConfig;
