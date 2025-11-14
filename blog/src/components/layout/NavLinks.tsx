"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import LogoutButton from './LogoutButton';
import ProtectedLink from '@/components/common/ProtectedLink';
import { useTranslations, useLocale } from 'next-intl';

export default function NavLinks({ showWrite }: { showWrite: boolean }) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const prefix = locale === 'en' ? '/en' : '';
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { userId } = useAuthUser();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <div className="relative flex items-center gap-2 md:gap-3">
      <button
        type="button"
        className="p-2 rounded md:hidden hover:bg-gray-100 min-w-[44px] min-h-[44px] absolute right-0 top-1/2 -translate-y-1/2 z-10"
        aria-label="메뉴 토글"
        aria-expanded={open}
        aria-controls="primary-nav"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true"><Menu size={20} /></span>
      </button>
      <nav
        id="primary-nav"
        role="navigation"
        aria-label="주요 메뉴"
        className={
          `items-center text-sm md:text-base text-gray-700 ${open ? 'flex' : 'hidden'} md:flex gap-3 md:gap-4 pr-12 md:pr-0 z-20`
        }
      >
        <Link
          href={`${prefix}/posts`}
          className={`px-2 py-1 md:px-0 md:py-0 link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded ${isActive('/posts') ? 'font-semibold text-black' : ''}`}
          aria-current={isActive('/posts') ? 'page' : undefined}
        >
          {t('posts')}
        </Link>
        <ProtectedLink
          href={`${prefix}/write`}
          className={`px-2 py-1 md:px-0 md:py-0 link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded ${isActive('/write') ? 'font-semibold text-black' : ''}`}
          ariaLabel={t('write')}
          ariaCurrent={isActive('/write') ? 'page' : undefined}
        >
          {t('write')}
        </ProtectedLink>
        {userId && (
          <Link
            href={`${prefix}/mypage`}
            className={`px-2 py-1 link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded ${isActive('/mypage') ? 'font-semibold text-black' : ''}`}
            aria-current={isActive('/mypage') ? 'page' : undefined}
          >
            {t('mypage')}
          </Link>
        )}
        {userId && (
          <span className="md:hidden">
            <nav aria-label={t('accountMenu')}>
              <LogoutButton />
            </nav>
          </span>
        )}
      </nav>
      {userId && (
        <div className="hidden md:block">
          <nav aria-label={t('accountMenu')}>
            <LogoutButton />
          </nav>
        </div>
      )}
    </div>
  );
}
