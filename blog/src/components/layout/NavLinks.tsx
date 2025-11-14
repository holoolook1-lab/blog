"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const [lastFocusable, setLastFocusable] = useState<HTMLElement | null>(null);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  useEffect(() => {
    if (open) {
      // 첫 링크에 포커스 이동
      firstLinkRef.current?.focus();
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const onOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (!rootRef.current) return;
        const inRoot = rootRef.current.contains(target);
        const inPanel = panelRef.current?.contains(target);
        if (open && (!inRoot || !inPanel)) setOpen(false);
      };
      document.addEventListener('mousedown', onOutside);
      return () => {
        document.body.style.overflow = prev;
        document.removeEventListener('mousedown', onOutside);
      };
    }
  }, [open]);

  useEffect(() => {
    // 경로 변경 시 패널 닫기 및 스크롤 잠금 해제
    if (open) {
      setOpen(false);
      document.body.style.overflow = '';
    }
  }, [pathname]);

  return (
    <div ref={rootRef} className="relative flex items-center gap-2 md:gap-3">
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm md:hidden"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
    )}
      <div className="relative md:static">
      <button
        type="button"
        className="p-2 rounded md:hidden hover:bg-gray-100 min-w-[44px] min-h-[44px] z-30"
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
          `text-sm md:text-base text-gray-800 ${open ? 'block' : 'hidden'} md:flex md:flex-row items-start md:items-center gap-4 md:gap-6 pr-12 md:pr-0 z-30`
        }
        onKeyDown={(e) => {
          if (e.key === 'Escape') { setOpen(false); return; }
          if (!open) return;
          if (e.key === 'Tab') {
            const nodes = panelRef.current?.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (!nodes || nodes.length === 0) return;
            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            setLastFocusable(last);
            const active = document.activeElement as HTMLElement | null;
            if (e.shiftKey) {
              if (active === first) {
                e.preventDefault();
                last.focus();
              }
            } else {
              if (active === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }
        }}
      >
        <div
          ref={panelRef}
          className="md:contents absolute md:static right-0 top-full mt-2 min-w-[180px] w-auto max-w-[240px] overflow-auto max-h-[calc(100vh-6rem)] bg-white md:bg-transparent border md:border-0 rounded-2xl md:rounded-none shadow-xl md:shadow-none p-4 md:p-0 ring-1 ring-black/5 transition-opacity transition-transform duration-200 ease-out"
          style={{
            paddingLeft: 'max(16px, env(safe-area-inset-left))',
            paddingRight: 'max(16px, env(safe-area-inset-right))',
            paddingTop: 'max(16px, env(safe-area-inset-top))',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
          role="dialog"
          aria-modal={open ? 'true' : undefined}
        >
        <Link
          ref={firstLinkRef}
          href={`/posts`}
          className={`px-4 py-3 md:px-4 md:py-2 link-gauge focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 rounded-lg transition-colors whitespace-nowrap break-keep ${isActive('/posts') ? 'font-semibold text-black' : 'text-gray-700 hover:text-black hover:bg-gray-50'}`}
          aria-current={isActive('/posts') ? 'page' : undefined}
        >
          {t('posts')}
        </Link>
        <ProtectedLink
          href={`/write`}
          className={`px-4 py-3 md:px-4 md:py-2 link-gauge focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 rounded-lg transition-colors whitespace-nowrap break-keep ${isActive('/write') ? 'font-semibold text-black' : 'text-gray-700 hover:text-black hover:bg-gray-50'}`}
          ariaLabel={t('write')}
          ariaCurrent={isActive('/write') ? 'page' : undefined}
        >
          {t('write')}
        </ProtectedLink>
        {userId && (
          <Link
            href={`/mypage`}
            className={`px-4 py-3 md:px-4 md:py-2 link-gauge focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 rounded-lg transition-colors whitespace-nowrap break-keep ${isActive('/mypage') ? 'font-semibold text-black' : 'text-gray-700 hover:text-black hover:bg-gray-50'}`}
            aria-current={isActive('/mypage') ? 'page' : undefined}
          >
            {t('mypage')}
          </Link>
        )}
        {userId && (
          <span className="md:hidden block pt-3 border-t mt-3">
            <nav aria-label={t('accountMenu')}>
              <LogoutButton />
            </nav>
          </span>
        )}
        </div>
      </nav>
      </div>
      {userId && (
        <div className="hidden md:block ml-2">
          <nav aria-label={t('accountMenu')}>
            <LogoutButton />
          </nav>
        </div>
      )}
    </div>
  );
}
