"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import LogoutButton from './LogoutButton';
import ProtectedLink from '@/components/common/ProtectedLink';

export default function NavLinks({ showWrite }: { showWrite: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { userId } = useAuthUser();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <button
        type="button"
        className="p-2 rounded md:hidden hover:bg-gray-100 min-w-[44px] min-h-[44px]"
        aria-label="메뉴 토글"
        onClick={() => setOpen((v) => !v)}
      >
        <Menu size={20} />
      </button>
      <nav
        className={
          `items-center text-sm md:text-base text-gray-700 ${open ? 'flex' : 'hidden'} md:flex gap-3 md:gap-4`
        }
      >
        <Link
          href="/posts"
          className={`px-2 py-1 md:px-0 md:py-0 link-gauge ${isActive('/posts') ? 'font-semibold text-black' : ''}`}
        >
          포스트
        </Link>
        <ProtectedLink
          href="/write"
          className={`px-2 py-1 md:px-0 md:py-0 link-gauge ${isActive('/write') ? 'font-semibold text-black' : ''}`}
          ariaLabel="글 작성"
        >
          작성
        </ProtectedLink>
        {userId && (
          <Link
            href="/mypage"
            className={`px-2 py-1 link-gauge ${isActive('/mypage') ? 'font-semibold text-black' : ''} md:hidden`}
          >
            내 계정
          </Link>
        )}
        {userId && (
          <span className="md:hidden"><LogoutButton /></span>
        )}
      </nav>
    </div>
  );
}
