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
      const res = await sendMagicLink(email, redirect, 'signup');
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
      <div className="space-y-2 text-sm text-gray-700">
        <h2 className="font-semibold">매직 링크란?</h2>
        <p>
          이메일로 전달되는 1회성 가입/로그인 링크입니다. 링크를 클릭하면 해당 브라우저에서 가입 완료 후 자동 로그인됩니다.
        </p>
        <h3 className="font-semibold">회원가입 절차</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>위 입력란에 가입할 이메일을 입력합니다.</li>
          <li>메일함에서 "매직 링크" 안내 메일을 엽니다.</li>
          <li>메일의 링크를 클릭하면 가입이 완료되고 홈으로 이동합니다.</li>
        </ol>
        <h3 className="font-semibold">주의사항</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>링크는 일정 시간 후 만료될 수 있어요. 오래된 메일은 다시 요청하세요.</li>
          <li>이미 가입된 이메일이면 링크 클릭 시 로그인으로 처리됩니다.</li>
        </ul>
      </div>
      <p className="text-sm">
        이미 계정이 있나요? <Link className="underline" href="/login">로그인</Link>
      </p>
    </main>
  );
}
