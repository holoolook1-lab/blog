"use client";
import { useSearchParams } from 'next/navigation';
import ActionToast from '@/components/ui/ActionToast';
import { useEffect, useState } from 'react';
import { ensureProfileGuarded } from '@/lib/supabase/ensureProfile';
import { clearConsentMark, getConsentMarkFromClient } from '@/lib/policies';

export default function AuthToastBridge() {
  const params = useSearchParams();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const success = params.get('auth_success');
    const error = params.get('auth_error');
    const flow = params.get('flow');
    if (error) {
      setToast({ type: 'error', message: `인증 오류: ${error}` });
      return;
    }
    if (success) {
      const msg = success === 'signup' ? '회원가입이 완료되었습니다.' : '로그인되었습니다.';
      setToast({ type: 'success', message: msg });
      // 성공 시 최초 로그인 업서트 폴백 수행(가드 포함)
      ensureProfileGuarded();
      // 동의 마커가 있으면 서버에 기록 (비동기 처리)
      (async () => {
        try {
          const mark = getConsentMarkFromClient();
          if (mark && mark.privacy && mark.terms) {
            await fetch('/api/consent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'same-origin',
              body: JSON.stringify({
                privacy: mark.privacy,
                terms: mark.terms,
                privacy_version: mark.privacy_version,
                terms_version: mark.terms_version,
              }),
            });
            clearConsentMark();
          }
        } catch {}
      })();
      return;
    }
    setToast(null);
  }, [params]);

  // 페이지 로드시 한 번 폴백 수행(가드로 중복 방지)
  useEffect(() => {
    ensureProfileGuarded();
  }, []);

  if (!toast) return null;
  return <ActionToast toast={toast} onClose={() => setToast(null)} />;
}
