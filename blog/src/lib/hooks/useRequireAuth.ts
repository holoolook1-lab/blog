"use client";
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/lib/hooks/useAuthUser';

/**
 * 버튼/액션에 로그인 가드를 적용하기 위한 공통 훅.
 * 로그인 상태면 액션을 실행하고, 아니면 로그인 페이지로 리다이렉트합니다.
 * 기본 리다이렉트 목적지는 현재 페이지입니다.
 */
export function useRequireAuth(defaultRedirectTo?: string) {
  const { userId } = useAuthUser();
  const router = useRouter();

  const getCurrentUrl = () => {
    if (typeof window === 'undefined') return '/';
    const { pathname, search } = window.location;
    return `${pathname}${search || ''}`;
  };

  /**
   * 로그인 필요 시 로그인 페이지로 이동하고 false를 반환합니다.
   * 로그인되어 있으면 선택적으로 액션을 실행하고 true를 반환합니다.
   */
  function requireAuth(action?: () => void, redirectTo?: string) {
    const loggedIn = Boolean(userId);
    if (loggedIn) {
      action?.();
      return true;
    }
    const dest = redirectTo || defaultRedirectTo || `/login?redirect=${encodeURIComponent(getCurrentUrl())}`;
    router.push(dest);
    return false;
  }

  return { requireAuth, isLoggedIn: Boolean(userId) };
}

