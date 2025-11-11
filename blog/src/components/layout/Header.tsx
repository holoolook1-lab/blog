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
    <header className="border-b bg-white/80 backdrop-blur">
      <div className="max-w-3xl mx-auto p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monogram size={24} />
          <Link href="/" className="font-bold" aria-label={(SITE_NAME || '블로그') + ' 홈으로 이동'}>{SITE_NAME || '블로그'}</Link>
          <NavLinks showWrite={!!userId} />
        </div>
        <div className="flex items-center gap-3 text-sm">
          {userId ? (
            <>
              <Link href="/mypage" className="inline-flex items-center rounded px-3 py-1 border hover:bg-gray-50" aria-label="마이페이지">
                마이페이지
              </Link>
              <UserMenu />
              <button
                onClick={() => logout()}
                className="inline-flex items-center rounded px-3 py-1 border hover:bg-gray-50"
                aria-label="로그아웃"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded px-4 py-2 bg-black text-white font-medium hover:bg-black/85"
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
