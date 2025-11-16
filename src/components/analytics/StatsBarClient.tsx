"use client";
import { useEffect, useRef, useState } from 'react';

export default function StatsBarClient({ className = '' }: { className?: string }) {
  const [today, setToday] = useState<number | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return; // 단 한 번만 요청
    fetchedRef.current = true;
    const controller = new AbortController();
    const timeoutAbort = setTimeout(() => controller.abort(), 1500); // 1.5초 타임아웃
    const start = () => {
      (async () => {
        try {
          const res = await fetch('/api/analytics/stats', { cache: 'no-store', signal: controller.signal });
          if (!res.ok) return; // 조용히 실패
          const json = await res.json();
          setToday(typeof json.today === 'number' ? json.today : 0);
          setTotal(typeof json.total === 'number' ? json.total : 0);
        } catch (e: any) {
          // Abort/네트워크 오류는 무시
        } finally {
          clearTimeout(timeoutAbort);
        }
      })();
    };
    // 초기 로딩과 경쟁을 줄이기 위해 idle 시점으로 지연
    if (typeof (window as any).requestIdleCallback === 'function') {
      const id = (window as any).requestIdleCallback(() => start(), { timeout: 800 });
      return () => { (window as any).cancelIdleCallback?.(id); clearTimeout(timeoutAbort); controller.abort(); };
    } else {
      const t = setTimeout(start, 600);
      return () => { clearTimeout(t); clearTimeout(timeoutAbort); controller.abort(); };
    }
  }, []);

  return (
    <div className={`text-sm text-gray-600 flex items-center gap-6 pointer-events-none ${className}`}>
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        오늘 방문자: <span className="font-semibold text-gray-800">{today ?? '—'}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
        누적 방문자: <span className="font-semibold text-gray-800">{total ?? '—'}</span>
      </span>
    </div>
  );
}
