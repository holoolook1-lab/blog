import type { NextConfig } from 'next';

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
    remotePatterns: hostname
      ? [
          {
            protocol: 'https',
            hostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
  turbopack: {
    // 루트 디렉터리를 명시해 상위 디렉터리 lockfile로 인한 경고를 제거
    root: __dirname,
  },
};

export default nextConfig;
