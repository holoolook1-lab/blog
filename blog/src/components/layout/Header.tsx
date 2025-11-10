"use client";
import Link from 'next/link';
import NavLinks from './NavLinks';
import UserMenu from './UserMenu';
import { useEffect, useState } from 'react';
import Monogram from '@/components/brand/Monogram';
import { SITE_NAME } from '@/lib/brand';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import { logout } from '@/lib/auth/logout';

export default function Header() {
  const { userId } = useAuthUser();

  return (
    <header className="border-b bg-white/80 dark:bg-neutral-900/85 dark:border-neutral-800 backdrop-blur">
      <div className="max-w-3xl mx-auto p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monogram size={24} />
          <Link href="/" className="font-bold" aria-label={(SITE_NAME || '블로그') + ' 홈으로 이동'}>{SITE_NAME || '블로그'}</Link>
          <NavLinks showWrite={!!userId} />
        </div>
        <div className="flex items-center gap-3 text-sm">
          {userId ? (
            <>
              <UserMenu />
              <button
                onClick={() => logout()}
                className="inline-flex items-center rounded px-3 py-1 border hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                aria-label="로그아웃"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded px-4 py-2 bg-black text-white font-medium hover:bg-black/85 dark:bg-blue-600 dark:hover:bg-blue-500"
              aria-label="로그인"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
