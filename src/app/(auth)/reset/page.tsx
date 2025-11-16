"use client";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset } from "./actions";
import { outlineButtonSmall } from "@/lib/styles/ui";

export default function ResetRequestPage() {
  const { useTranslations } = require('next-intl');
  const t = useTranslations('auth');
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const em = email.trim();
    if (!em) {
      setError("이메일을 입력하세요");
      return;
    }
    startTransition(async () => {
      const res = await requestPasswordReset(em);
      if (!res.ok) {
        setError(res.message || "재설정 이메일 전송 실패");
      } else {
        setMessage(res.message || "재설정 이메일을 발송했습니다");
      }
    });
  };

  return (
    <main className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">{t('resetTitle')}</h1>
      <p className="text-sm text-gray-600">{t('resetDesc')}</p>
      {params.get("auth_error") && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700 text-sm">
          인증 오류: {params.get("auth_error")}
        </div>
      )}
      {message && <div className="rounded border border-green-200 bg-green-50 p-2 text-green-700 text-sm">{message}</div>}
      {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700 text-sm">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm">{t('email')}</span>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            required
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className={`${outlineButtonSmall} w-full disabled:opacity-60`}
        >
          {pending ? t('sending') : t('sendReset')}
        </button>
      </form>
    </main>
  );
}
