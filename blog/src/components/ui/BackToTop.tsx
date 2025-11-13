"use client";
import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goTop = () => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  if (!visible) return null;

  return (
    <button
      onClick={goTop}
      className="fixed bottom-6 right-6 rounded-full bg-primary text-white shadow-lg px-3 py-1.5 text-xs hover:bg-primary/85 focus:outline-none focus:ring-2 focus:ring-black min-w-[44px] min-h-[44px]"
      aria-label="맨 위로 이동"
      title="맨 위로 이동"
    >
      ↑ 맨 위로
    </button>
  );
}
