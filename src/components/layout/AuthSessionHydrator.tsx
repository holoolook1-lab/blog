"use client";
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

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
          // Supabase 클라이언트를 동적으로 가져와서 연결 오류 방지
          try {
            const { supabase } = await import('@/lib/supabase/client');
            // 현재 세션과 비교하여 동일 리프레시 토큰이면 재설정 생략
            const { data: cur } = await supabase.auth.getSession();
            const curRt = (cur?.session as any)?.refresh_token || null;
            if (!curRt || curRt !== json.session.refresh_token) {
              await supabase.auth.setSession({
                access_token: json.session.access_token,
                refresh_token: json.session.refresh_token,
              });
            }
          } catch (supabaseError) {
            console.warn('Supabase 연결 실패, 무시하고 계속 진행:', supabaseError);
          }
          // URL 정리: 성공 표시 파라미터 제거
          const url = new URL(window.location.href);
          url.searchParams.delete('auth_success');
          url.searchParams.delete('flow');
          window.history.replaceState(null, '', url.toString());
        }
      } catch (error) {
        console.warn('세션 하이드레이션 실패:', error);
      }
    };
    hydrate();
  }, [params]);

  return null;
}
