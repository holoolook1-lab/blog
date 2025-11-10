'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { sendMagicLink } from '../login/actions';
import ActionToast from '@/components/ui/ActionToast';

export default function SignupPage() {
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
      const res = await sendMagicLink(email, redirect);
      if (res.ok) {
        setToast({ type: 'success', message: '회원가입 링크를 이메일로 전송했습니다. 메일의 링크를 클릭해 가입을 완료하세요.' });
      } else {
        setToast({ type: 'error', message: res.message || '전송 중 오류가 발생했어요' });
      }
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || '전송 중 오류가 발생했어요' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-sm mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">회원가입</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          className="border rounded w-full p-2"
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="bg-black text-white w-full py-2 rounded disabled:opacity-60" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '전송 중...' : '매직 링크로 가입하기'}
        </button>
      </form>
      {toast && <ActionToast toast={{ type: toast.type, message: toast.message }} onClose={() => setToast(null)} />}
      <p className="text-sm">
        이미 계정이 있나요? <Link className="underline" href="/login">로그인</Link>
      </p>
    </main>
  );
}

