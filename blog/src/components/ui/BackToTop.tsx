"use client";
import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { useTranslations } = require('next-intl');
  const t = useTranslations('common');

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
      className="fixed z-50 rounded-full bg-black text-white shadow-xl px-3.5 py-2 text-sm hover:bg-black/85 focus:outline-none focus:ring-2 focus:ring-black min-w-[44px] min-h-[44px]"
      style={{
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        right: 'max(16px, env(safe-area-inset-right))',
      }}
      aria-label={t('backToTop')}
      title={t('backToTopTitle')}
    >
      ↑ {t('backToTop')}
    </button>
  );
}
