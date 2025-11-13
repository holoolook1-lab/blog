"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import type { AriaAttributes } from 'react';

export default function ProtectedLink({ href, children, className, ariaLabel, ariaCurrent }: { href: string; children: React.ReactNode; className?: string; ariaLabel?: string; ariaCurrent?: AriaAttributes['aria-current'] }) {
  const { userId } = useAuthUser();
  const router = useRouter();

  if (userId) {
    return (
      <Link
        href={href}
        className={className}
        aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
        aria-current={ariaCurrent}
      >
        {children}
      </Link>
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
