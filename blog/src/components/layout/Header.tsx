"use client";
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import NavLinks from './NavLinks';
import UserMenu from './UserMenu';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Monogram from '@/components/brand/Monogram';
import { SITE_NAME } from '@/lib/brand';

export default function Header() {
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (mounted) setUserId(user?.id || null);
    }).catch(() => { /* ignore */ });
    return () => { mounted = false; };
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
          {userId ? <UserMenu /> : <Link href="/login" className="hover:underline">로그인</Link>}
        </div>
      </div>
    </header>
  );
}