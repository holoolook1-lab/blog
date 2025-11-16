'use client';
import { useEffect } from 'react';

export default function VisitorPing() {
  useEffect(() => {
    // 방문 기록: 동일 방문자의 새로고침은 일별 고유에 의해 중복 집계되지 않음
    try {
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
        // HMR/페이지 언로드에도 중단되지 않도록 sendBeacon 사용
        navigator.sendBeacon('/api/analytics/visit');
      } else {
        // Fallback: keepalive로 언로드 중단 방지
        fetch('/api/analytics/visit', { method: 'POST', keepalive: true }).catch(() => {});
      }
    } catch {
      // 네트워크/환경 오류는 무시
    }
  }, []);
  return null;
}
