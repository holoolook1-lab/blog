"use client";
import Link from 'next/link';
import NavLinks from './NavLinks';
import { useState } from 'react';
import Monogram from '@/components/brand/Monogram';
import { SITE_NAME } from '@/lib/brand';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import { outlineButtonSmall } from '@/lib/styles/ui';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

export default function Header() {
  const t = useTranslations('common');
  const locale = useLocale();
  const prefix = locale === 'en' ? '/en' : '';
  const { userId, email } = useAuthUser();
  const [/*avatarUrl*/, /*setAvatarUrl*/] = useState<string | null>(null);

  return (
    <header className="border-b bg-white/80 backdrop-blur antialiased" role="banner" aria-labelledby="site-title">
      {/* 스킵 링크: 키보드 포커스 시에만 표시 */}
      <a href="#main" className="sr-only focus:not-sr-only fixed top-2 left-2 z-50 bg-white border rounded px-3 py-1 text-xs shadow-sm" aria-label="메인 콘텐츠로 건너뛰기" aria-describedby="skip-hint">메인으로 건너뛰기</a>
      <p id="skip-hint" className="sr-only">키보드 포커스 시 표시됩니다.</p>
      <div className="max-w-3xl mx-auto px-3 py-2 md:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          {userId && email ? (
            <div className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center">
              {email.slice(0,1).toUpperCase()}
            </div>
          ) : (
            <span aria-hidden="true"><Monogram size={24} /></span>
          )}
          <Link id="site-title" href={`${prefix}/`} className="font-bold text-base md:text-lg tracking-tight break-keep whitespace-nowrap" aria-label={(SITE_NAME || '블로그') + ' 홈으로 이동'}>{SITE_NAME || '블로그'}</Link>
        </div>
        {/* 우측 영역: 햄버거 메뉴/내비게이션 + 로그인 버튼 */}
        <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
          <NavLinks showWrite={!!userId} />
          <LanguageSwitcher />
          {userId ? (
            <></>
          ) : (
            <Link
              href="/login"
              className={`${outlineButtonSmall} min-h-[40px]`}
              aria-label={t('login')}
            >
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
