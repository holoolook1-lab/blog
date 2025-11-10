"use client";
import { useSearchParams } from 'next/navigation';
import ActionToast from '@/components/ui/ActionToast';
import { useEffect, useState } from 'react';

export default function AuthToastBridge() {
  const params = useSearchParams();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const success = params.get('auth_success');
    const error = params.get('auth_error');
    const flow = params.get('flow');
    if (error) {
      setToast({ type: 'error', message: `인증 오류: ${decodeURIComponent(error)}` });
      return;
    }
    if (success) {
      const msg = success === 'signup' ? '회원가입이 완료되었습니다.' : '로그인되었습니다.';
      setToast({ type: 'success', message: msg });
      return;
    }
    setToast(null);
  }, [params]);

  if (!toast) return null;
  return <ActionToast toast={toast} onClose={() => setToast(null)} />;
}

