"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import LogoutButton from './LogoutButton';
import LoginButton from './LoginButton';
import ProtectedLink from '@/components/common/ProtectedLink';
import { useTranslations } from 'next-intl';
import { PWAStatusIndicator } from '@/components/pwa/PWAStatus';
import StatsBarClient from '@/components/analytics/StatsBarClient';

export default function NavLinks({ showWrite }: { showWrite: boolean }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { userId } = useAuthUser();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const [lastFocusable, setLastFocusable] = useState<HTMLElement | null>(null);
  const previousPathnameRef = useRef<string | null>(null);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    // 모바일 메뉴 초기화
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 실행
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted || !open) return;
    
    // 첫 링크에 포커스 이동
    firstLinkRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!rootRef.current) return;
      const inRoot = rootRef.current.contains(target);
      const inPanel = panelRef.current?.contains(target);
      // 메뉴가 열려있고, 클릭한 곳이 메뉴 영역 밖이면 메뉴 닫기
      if (open && !inPanel) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('touchstart', onOutside as EventListener);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('touchstart', onOutside as EventListener);
    };
  }, [open, isMounted]);

  // 경로 변경 감지 및 메뉴 닫기 - Next.js 라우터 이벤트 활용
  useEffect(() => {
    // 메뉴가 열려있고 마운트되었을 때만 처리
    if (!isMounted || !open) return;
    
    // 경로 변경 시 메뉴 닫기
    const handleRouteChange = () => {
      setOpen(false);
      document.body.style.overflow = '';
    };
    
    // 현재 경로와 다르면 즉시 닫기
    if (previousPathnameRef.current !== null && previousPathnameRef.current !== pathname) {
      handleRouteChange();
    }
    
    previousPathnameRef.current = pathname;
  }, [pathname, open, isMounted]); // isMounted 의존성 추가

  // 메뉴 항목 클릭 시 메뉴 닫기
  const handleMenuClick = () => {
    setTimeout(() => {
      setOpen(false);
    }, 150); // 150ms 지연으로 클릭 이벤트가 제대로 전달되도록
  };

  return (
    <div ref={rootRef} className="relative flex items-center gap-2 md:gap-3">
      {isMounted && open && (
        <div
          className="fixed inset-0 z-10 bg-black/30 md:hidden menu-overlay backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="relative md:static flex items-center h-full">
        <button
          type="button"
          className="p-2 rounded-lg md:hidden hover:bg-gray-100 transition-colors duration-200 w-10 h-10 relative hamburger-icon bg-white border border-gray-200"
          aria-label="메뉴 토글"
          aria-expanded={isMounted ? open : false}
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
            `${isMounted ? (open ? 'mobile-menu-enter' : 'mobile-menu-exit') : 'mobile-menu-exit'} 
            ${!open ? 'hidden md:block' : 'block'}
            md:translate-x-0 md:opacity-100 md:flex md:flex-row md:items-center md:gap-6 
            absolute md:relative top-full right-0 md:top-0 md:right-0 h-auto max-h-[calc(100vh-4rem)] md:h-auto w-[calc(100vw-2rem)] max-w-[280px] md:w-auto 
            luxury-menu-bg md:bg-transparent rounded-lg md:rounded-none border md:border-none shadow-xl md:shadow-none
            transition-all duration-300 ease-in-out z-20 overflow-y-auto overflow-x-visible mt-1 md:mt-0`
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
            className="flex flex-col h-full md:h-auto md:flex-row md:items-center md:gap-6 p-6 md:p-0"
            role="dialog"
            aria-modal={isMounted && open ? 'true' : undefined}
          >
            {/* 모바일 헤더 - 닫기 버튼 */}
            <div className="flex md:hidden justify-between items-center mb-8">
              <div className="text-xl font-light text-gray-600">라키라키</div>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="메뉴 닫기"
                onClick={() => setOpen(false)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 메뉴 항목들 - hover 문제 해결 */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-6">
              <Link
                ref={firstLinkRef}
                href={`/posts`}
                className={`text-lg md:text-base font-normal menu-item-luxury
                  ${isActive('/posts') 
                    ? 'active text-black font-medium' 
                    : 'text-gray-700'
                  }`}
                aria-current={isActive('/posts') ? 'page' : undefined}
                onClick={handleMenuClick}
              >
                {t('posts')}
              </Link>
              
              {showWrite && (
                <ProtectedLink
                  href={`/write`}
                  className={`text-lg md:text-base font-normal
                    ${isActive('/write') 
                      ? 'active text-black font-medium' 
                      : 'text-gray-700'
                    }`}
                  ariaLabel={t('write')}
                  ariaCurrent={isActive('/write') ? 'page' : undefined}
                >
                  <span onClick={handleMenuClick}>{t('write')}</span>
                </ProtectedLink>
              )}
              
              {userId && (
                <Link
                  href={`/mypage`}
                  className={`text-lg md:text-base font-normal
                    ${isActive('/mypage') 
                      ? 'active text-black font-medium' 
                      : 'text-gray-700'
                    }`}
                  aria-current={isActive('/mypage') ? 'page' : undefined}
                  onClick={handleMenuClick}
                >
                  {t('mypage')}
                </Link>
              )}
              
              {/* 로그인/로그아웃 버튼을 메뉴 항목으로 이동 */}
              {!userId ? (
                <div className="pointer-events-auto z-40 relative">
                  <Link
                    href="/login"
                    className="text-lg md:text-base font-normal text-gray-700 block w-full select-text"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMenuClick();
                      setTimeout(() => {
                        router.push('/login');
                      }, 50);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {t('login')}
                  </Link>
                </div>
              ) : (
                <div className="md:hidden">
                <LogoutButton onClick={handleMenuClick} />
                </div>
              )}
              
              {/* 방문자 통계 및 PWA 상태 표시기를 메뉴 하단으로 이동 - hover 문제로 임시 제거 */}
              {/*
              <div className="md:hidden mt-8 pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-center">
                  <PWAStatusIndicator />
                  <span className="ml-2 text-xs text-gray-500">연결 상태</span>
                </div>
                <StatsBarClient className="justify-center gap-4 text-xs" />
              </div>
              */}
            </div>
          </div>
        </nav>
      </div>
      {/* 데스크톱용 PWA 상태 표시기 */}
      <div className="hidden md:flex items-center space-x-2 ml-2">
        <PWAStatusIndicator />
      </div>
      
      {userId && (
        <div className="hidden md:block ml-2">
          <nav aria-label={t('accountMenu')}>
            <LogoutButton onClick={handleMenuClick} />
          </nav>
        </div>
      )}
    </div>
  );
}
