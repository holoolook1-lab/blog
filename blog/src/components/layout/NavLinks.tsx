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
          className="fixed inset-0 z-40 bg-black/50 md:hidden menu-overlay"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="relative md:static">
        <button
          type="button"
          className="p-3 rounded-lg md:hidden hover:bg-gray-100 transition-colors duration-200 min-w-[48px] min-h-[48px] z-50 relative hamburger-icon"
          aria-label="메뉴 토글"
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true"><Menu size={24} /></span>
        </button>
        <nav
          id="primary-nav"
          role="navigation"
          aria-label="주요 메뉴"
          className={
            `${open ? 'mobile-menu-enter' : 'mobile-menu-exit'} 
            md:translate-x-0 md:opacity-100 md:flex md:flex-row md:items-center md:gap-6 
            fixed md:relative top-0 right-0 h-screen md:h-auto w-80 md:w-auto 
            luxury-menu-bg md:bg-transparent 
            transition-all duration-300 ease-in-out z-50 md:z-auto`
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
            className="flex flex-col h-full md:h-auto md:flex-row md:items-center md:gap-6 p-8 md:p-0"
            role="dialog"
            aria-modal={open ? 'true' : undefined}
          >
            {/* 모바일 헤더 - 닫기 버튼 */}
            <div className="flex md:hidden justify-between items-center mb-12">
              <div className="text-xl font-light text-gray-400">라키라키</div>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 메뉴 항목들 */}
            <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-6">
              <Link
                ref={firstLinkRef}
                href={`/posts`}
                className={`text-2xl md:text-base font-light md:font-normal menu-item-luxury menu-typography menu-hover-effect
                  ${isActive('/posts') 
                    ? 'text-black font-medium' 
                    : 'text-gray-600 hover:text-black'
                  }`}
                aria-current={isActive('/posts') ? 'page' : undefined}
                onClick={() => setOpen(false)}
              >
                {t('posts')}
              </Link>
              
              {showWrite && (
                <ProtectedLink
                  href={`/write`}
                  className={`text-2xl md:text-base font-light md:font-normal menu-item-luxury menu-typography menu-hover-effect
                    ${isActive('/write') 
                      ? 'text-black font-medium' 
                      : 'text-gray-600 hover:text-black'
                    }`}
                  ariaLabel={t('write')}
                  ariaCurrent={isActive('/write') ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {t('write')}
                </ProtectedLink>
              )}
              
              {userId && (
                <Link
                  href={`/mypage`}
                  className={`text-2xl md:text-base font-light md:font-normal menu-item-luxury menu-typography menu-hover-effect
                    ${isActive('/mypage') 
                      ? 'text-black font-medium' 
                      : 'text-gray-600 hover:text-black'
                    }`}
                  aria-current={isActive('/mypage') ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {t('mypage')}
                </Link>
              )}
            </div>

            {/* 모바일 푸터 - 계정 메뉴 */}
            {userId && (
              <div className="flex md:hidden mt-auto pt-8 border-t border-gray-100">
                <nav aria-label={t('accountMenu')} className="w-full">
                  <LogoutButton />
                </nav>
              </div>
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
