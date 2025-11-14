"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import LogoutButton from './LogoutButton';
import ProtectedLink from '@/components/common/ProtectedLink';
import { useTranslations } from 'next-intl';

export default function NavLinks({ showWrite }: { showWrite: boolean }) {
  const t = useTranslations('nav');
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
          `text-sm md:text-base text-gray-700 ${open ? 'block' : 'hidden'} md:flex md:flex-row items-start md:items-center gap-2 md:gap-4 pr-12 md:pr-0 z-20`
        }
      >
        <div className="md:contents absolute md:static left-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-[720px] bg-white md:bg-transparent border md:border-0 rounded md:rounded-none shadow-sm md:shadow-none p-3 md:p-0">
        <Link
          href={`/posts`}
          className={`px-2 py-1 md:px-0 md:py-0 link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded ${isActive('/posts') ? 'font-semibold text-black' : ''}`}
          aria-current={isActive('/posts') ? 'page' : undefined}
        >
          {t('posts')}
        </Link>
        <ProtectedLink
          href={`/write`}
          className={`px-2 py-1 md:px-0 md:py-0 link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded ${isActive('/write') ? 'font-semibold text-black' : ''}`}
          ariaLabel={t('write')}
          ariaCurrent={isActive('/write') ? 'page' : undefined}
        >
          {t('write')}
        </ProtectedLink>
        {userId && (
          <Link
            href={`/mypage`}
            className={`px-2 py-1 link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded ${isActive('/mypage') ? 'font-semibold text-black' : ''}`}
            aria-current={isActive('/mypage') ? 'page' : undefined}
          >
            {t('mypage')}
          </Link>
        )}
        {userId && (
          <span className="md:hidden block pt-2 border-t mt-2">
            <nav aria-label={t('accountMenu')}>
              <LogoutButton />
            </nav>
          </span>
        )}
        </div>
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
