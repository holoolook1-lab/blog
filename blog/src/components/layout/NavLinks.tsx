"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import LogoutButton from './LogoutButton';

export default function NavLinks({ showWrite }: { showWrite: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { userId } = useAuthUser();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="p-2 rounded md:hidden hover:bg-gray-100"
        aria-label="메뉴 토글"
        onClick={() => setOpen((v) => !v)}
      >
        <Menu size={18} />
      </button>
      <nav
        className={
          `items-center text-sm text-gray-700 ${open ? 'flex' : 'hidden'} md:flex gap-4 md:gap-3`
        }
      >
        <Link
          href="/posts"
          className={`hover:underline ${isActive('/posts') ? 'font-semibold text-black' : ''}`}
        >
          포스트
        </Link>
        {showWrite && (
          <Link
            href="/write"
            className={`hover:underline ${isActive('/write') ? 'font-semibold text-black' : ''}`}
          >
            작성
          </Link>
        )}
        {userId && (
          <Link
            href="/mypage"
            className={`hover:underline ${isActive('/mypage') ? 'font-semibold text-black' : ''} md:hidden`}
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
