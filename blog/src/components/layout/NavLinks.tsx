"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export default function NavLinks({ showWrite }: { showWrite: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="p-2 rounded md:hidden hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="메뉴 토글"
        onClick={() => setOpen((v) => !v)}
      >
        <Menu size={18} />
      </button>
      <nav
        className={
          `items-center gap-3 text-sm text-gray-700 dark:text-gray-200 ${open ? 'flex' : 'hidden'} md:flex`
        }
      >
        <Link
          href="/posts"
          className={`hover:underline ${isActive('/posts') ? 'font-semibold text-black dark:text-white' : ''}`}
        >
          포스트
        </Link>
        {showWrite && (
          <Link
            href="/write"
            className={`hover:underline ${isActive('/write') ? 'font-semibold text-black dark:text-white' : ''}`}
          >
            작성
          </Link>
        )}
      </nav>
    </div>
  );
}
