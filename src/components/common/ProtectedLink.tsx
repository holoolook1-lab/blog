"use client";
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import type { AriaAttributes } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ProtectedLink({ href, children, className, ariaLabel, ariaCurrent }: { href: string; children: React.ReactNode; className?: string; ariaLabel?: string; ariaCurrent?: AriaAttributes['aria-current'] }) {
  const { userId, loading } = useAuthUser();
  const router = useRouter();

  if (loading) {
    return (
      <span
        className={`${className || ''} opacity-60 pointer-events-none`}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-current={ariaCurrent}
      >
        {children}
      </span>
    );
  }

  if (userId) {
    const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
      // 보호 경로 진입 전 서버 세션 쿠키를 확실히 동기화해 미들웨어 리다이렉트를 방지
      if (href.startsWith('/write') || href.startsWith('/edit')) {
        e.preventDefault();
        try {
          const { data: s } = await supabase.auth.getSession();
          const at = (s as any)?.session?.access_token;
          const rt = (s as any)?.session?.refresh_token;
          if (at && rt) {
            await fetch('/api/auth/session/set', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({ access_token: at, refresh_token: rt })
            });
          }
        } catch {}
        // 서버 쿠키 설정 직후 보호 경로로 이동
        window.location.assign(href);
        return;
      }
    };
    return (
      <a
        href={href}
        onClick={onClick}
        className={className}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-current={ariaCurrent}
      >
        {children}
      </a>
    );
  }

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const login = `/login?redirect=${encodeURIComponent(href)}`;
    router.push(login);
  };

  return (
    <a
      href={href}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      aria-current={ariaCurrent}
      role="link"
      title="로그인이 필요합니다"
    >
      {children}
    </a>
  );
}
