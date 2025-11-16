"use client";
import Link from 'next/link';
import NavLinks from './NavLinks';
import { useEffect, useState } from 'react';
import Monogram from '@/components/brand/Monogram';
import { SITE_NAME } from '@/lib/brand';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import { outlineButtonSmall } from '@/lib/styles/ui';
import { useTranslations } from 'next-intl';
import { PWAStatusIndicator } from '@/components/pwa/PWAStatus';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Header() {
  const t = useTranslations('common');
  const { userId, email } = useAuthUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    async function loadAvatar() {
      try {
        if (!userId) { setAvatarUrl(null); return; }
        const { supabase } = await import('@/lib/supabase/client');
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).maybeSingle();
        if (!alive) return;
        setAvatarUrl((data as any)?.avatar_url || null);
      } catch { if (!alive) return; setAvatarUrl(null); }
    }
    loadAvatar();
    return () => { alive = false; };
  }, [userId]);

  return (
    <header className="border-b bg-white/80 backdrop-blur antialiased relative z-40" role="banner" aria-labelledby="site-title">
      {/* 스킵 링크: 키보드 포커스 시에만 표시 */}
      <a href="#main" className="sr-only focus:not-sr-only fixed top-2 left-2 z-50 bg-white border rounded px-3 py-1 text-xs shadow-sm" aria-label="메인 콘텐츠로 건너뛰기" aria-describedby="skip-hint">메인으로 건너뛰기</a>
      <p id="skip-hint" className="sr-only">키보드 포커스 시 표시됩니다.</p>
      <div className="max-w-3xl mx-auto px-3 py-2 md:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {userId && (avatarUrl || email) ? (
            avatarUrl ? (
              <img src={avatarUrl} alt="프로필" className="w-6 h-6 rounded-full object-cover border" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center border border-gray-300">
                {email?.slice(0,1).toUpperCase()}
              </div>
            )
          ) : (
            <span aria-hidden="true"><Monogram size={24} /></span>
          )}
          <div className="flex flex-col">
            <Link id="site-title" href={`/`} className="font-bold text-base md:text-lg tracking-tight truncate" aria-label={(SITE_NAME || '블로그') + ' 홈으로 이동'}>{SITE_NAME || '블로그'}</Link>
            <span className="text-xs text-gray-500 font-light hidden sm:block tracking-wider">
              당신의 생각이 반짝이는 곳
            </span>
          </div>
        </div>
        {/* 우측 영역: 햄버거 메뉴/내비게이션 */}
        <div className="flex items-center gap-2 md:gap-4 text-sm md:text-base">
          {userId && <NotificationBell />}
          <NavLinks showWrite={!!userId} />
        </div>
      </div>
    </header>
  );
}
