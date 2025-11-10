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
    const timer = setTimeout(() => controller.abort(), 1500); // 1.5초 타임아웃
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
        clearTimeout(timer);
      }
    })();
    return () => { clearTimeout(timer); controller.abort(); };
  }, []);

  return (
    <div className={`text-sm text-gray-600 flex items-center gap-3 ${className}`}>
      <span>
        오늘 방문자: <span className="font-medium text-gray-800">{today ?? '—'}</span>
      </span>
      <span>
        누적 방문자: <span className="font-medium text-gray-800">{total ?? '—'}</span>
      </span>
    </div>
  );
}

