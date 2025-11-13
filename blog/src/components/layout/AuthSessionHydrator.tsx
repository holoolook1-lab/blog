"use client";
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthSessionHydrator() {
  const params = useSearchParams();
  const hydratedRef = useRef(false);

  useEffect(() => {
    const success = params.get('auth_success');
    if (!success) return;
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const hydrate = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.ok && json?.session?.access_token && json?.session?.refresh_token) {
          // 현재 세션과 비교하여 동일 리프레시 토큰이면 재설정 생략
          const { data: cur } = await supabase.auth.getSession();
          const curRt = (cur?.session as any)?.refresh_token || null;
          if (!curRt || curRt !== json.session.refresh_token) {
            await supabase.auth.setSession({
              access_token: json.session.access_token,
              refresh_token: json.session.refresh_token,
            });
          }
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
