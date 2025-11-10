"use client";
import Link from 'next/link';
import NavLinks from './NavLinks';
import UserMenu from './UserMenu';
import { useEffect, useState } from 'react';
import Monogram from '@/components/brand/Monogram';
import { SITE_NAME } from '@/lib/brand';

export default function Header() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/user', { cache: 'no-store' });
        if (!res.ok) { if (mounted) setUserId(null); return; }
        const json = await res.json();
        if (mounted) setUserId(json.user_id || null);
      } catch {
        if (mounted) setUserId(null);
      }
    };
    fetchUser();
    const onVis = () => { if (document.visibilityState === 'visible') fetchUser(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { mounted = false; document.removeEventListener('visibilitychange', onVis); };
  }, []);

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
              <UserMenu />
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/auth/logout', { method: 'POST' });
                  } catch {}
                  window.location.reload();
                }}
                className="inline-flex items-center rounded px-3 py-1 border hover:bg-gray-50"
                aria-label="로그아웃"
              >
                로그아웃
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
