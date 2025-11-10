'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { sendMagicLink } from './actions';
import ActionToast from '@/components/ui/ActionToast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const search = useSearchParams();
  const redirect = search.get('redirect') || '/';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setToast({ type: 'error', message: '올바른 이메일을 입력해주세요' });
      return;
    }
    try {
      setIsSubmitting(true);
      await sendMagicLink(email, redirect);
      setToast({ type: 'success', message: '매직 링크를 이메일로 전송했습니다. 메일의 링크를 클릭해 로그인하세요.' });
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || '전송 중 오류가 발생했어요' });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <main className="max-w-sm mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">로그인</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input className="border rounded w-full p-2" type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="bg-black text-white w-full py-2 rounded disabled:opacity-60" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '전송 중...' : '매직 링크 보내기'}
        </button>
      </form>
      {toast && <ActionToast toast={{ type: toast.type, message: toast.message }} onClose={() => setToast(null)} />}
      <p className="text-sm">
        계정이 없나요? <Link className="underline" href="/signup">회원가입</Link>
      </p>
    </main>
  );
}