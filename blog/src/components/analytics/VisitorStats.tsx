"use client";
import StatsBarClient from '@/components/analytics/StatsBarClient';
import { usePathname } from 'next/navigation';

export default function VisitorStats({ className = '' }: { className?: string }) {
  const pathname = usePathname() || '/';
  // 인증 관련 페이지에서는 통계 요청을 건너뜁니다.
  if (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/auth')) {
    return null;
  }
  return <StatsBarClient className={className} />;
}
