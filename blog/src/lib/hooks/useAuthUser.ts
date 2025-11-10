"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export type AuthUser = { userId: string | null; email: string | null };

// 성능 우선: 네트워크 요청 없이 클라이언트 세션에서 즉시 조회.
// 로그인/로그아웃 변화는 auth state change 구독으로 반영.
export function useAuthUser(): { userId: string | null; email: string | null; loading: boolean } {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!alive) return;
        const user = data.user || null;
        setUserId(user?.id || null);
        setEmail(user?.email || null);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setUserId(null);
        setEmail(null);
        setLoading(false);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      const user = session?.user || null;
      setUserId(user?.id || null);
      setEmail(user?.email || null);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { userId, email, loading };
}
