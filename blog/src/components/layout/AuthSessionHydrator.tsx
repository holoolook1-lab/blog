"use client";
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthSessionHydrator() {
  const params = useSearchParams();

  useEffect(() => {
    const success = params.get('auth_success');
    if (!success) return;

    const hydrate = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.ok && json?.session?.access_token && json?.session?.refresh_token) {
          await supabase.auth.setSession({
            access_token: json.session.access_token,
            refresh_token: json.session.refresh_token,
          });
          // URL 정리: 성공 표시 파라미터 제거
          const url = new URL(window.location.href);
          url.searchParams.delete('auth_success');
          url.searchParams.delete('flow');
          window.history.replaceState(null, '', url.toString());
        }
      } catch {}
    };
    hydrate();
  }, [params]);

  return null;
}

