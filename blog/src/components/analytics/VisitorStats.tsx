"use client";
import StatsBarClient from '@/components/analytics/StatsBarClient';
import { usePathname } from 'next/navigation';

export default function VisitorStats({ className = '' }: { className?: string }) {
  const pathname = usePathname() || '/';
  // 인증 관련 페이지에서는 통계 요청을 건너뜁니다.
  const isAuthPath = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth');
  // 홈 및 포스트 상세/목록 페이지에서만 통계 바를 표시
  const isAllowed = !isAuthPath && (pathname === '/' || pathname === '/posts' || pathname.startsWith('/posts/'));
  // SSR/클라이언트 초기 렌더가 달라도 노드 타입이 동일하도록 항상 동일 래퍼를 반환
  return (
    <div className={className} suppressHydrationWarning>
      {isAllowed ? <StatsBarClient className="" /> : null}
    </div>
  );
}
