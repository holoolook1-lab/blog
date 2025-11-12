"use client";
import Link from 'next/link';
import NavLinks from './NavLinks';
import { useEffect, useState } from 'react';
import Monogram from '@/components/brand/Monogram';
import { SITE_NAME } from '@/lib/brand';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import Image from 'next/image';
import { outlineButton } from '@/lib/styles/ui';

export default function Header() {
  const { userId, email } = useAuthUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const { supabase } = await import('@/lib/supabase/client');
        // 우선 현재 사용자 정보 조회(훅 로딩 전에도 대응)
        const { data: authData } = await supabase.auth.getUser();
        const id = (userId || authData.user?.id) as string | undefined;
        if (!id) { if (alive) setAvatarUrl(null); return; }
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', id)
          .single();
        if (alive) setAvatarUrl((data as any)?.avatar_url || null);
      } catch {
        if (alive) setAvatarUrl(null);
      }
    };
    load();
    return () => { alive = false; };
  }, [userId]);

  return (
    <header className="border-b bg-white/80 backdrop-blur antialiased">
      <div className="max-w-3xl mx-auto px-3 py-2 md:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-3">
          {avatarUrl ? (
            <div className="w-6 h-6 rounded-full overflow-hidden">
              <img src={avatarUrl} alt="내 아바타" className="w-6 h-6 object-cover" loading="lazy" decoding="async" />
            </div>
          ) : userId && email ? (
            <div className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center">
              {email.slice(0,1).toUpperCase()}
            </div>
          ) : (
            <Monogram size={24} />
          )}
          <Link href="/" className="font-bold text-base md:text-lg tracking-tight break-keep whitespace-nowrap" aria-label={(SITE_NAME || '블로그') + ' 홈으로 이동'}>{SITE_NAME || '블로그'}</Link>
          <NavLinks showWrite={!!userId} />
        </div>
        <div className="flex items-center gap-2 md:gap-3 text-sm md:text-base">
          {userId ? (
            <></>
          ) : (
            <Link
              href="/login"
              className={`${outlineButton} min-h-[44px]`}
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
