"use client";
import StatsBarClient from '@/components/analytics/StatsBarClient';

export default function VisitorStats({ className = '' }: { className?: string }) {
  return <StatsBarClient className={className} />;
}
