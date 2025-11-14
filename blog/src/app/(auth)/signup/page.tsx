"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signupWithPassword } from "./actions";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { markConsentInClient } from "@/lib/policies";
import { outlineButtonSmall } from "@/lib/styles/ui";

export default function SignupPage() {
  const { useTranslations } = require('next-intl');
  const t = useTranslations('auth');
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);

  const redirect = params.get("redirect") || "/";

  useEffect(() => {
    setMessage(null);
  }, [email, password, confirm]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const em = email.trim();
    const pw = password.trim();
    const cf = confirm.trim();
    if (!em || !pw || !cf) {
      setMessage("이메일, 비밀번호, 비밀번호 확인을 입력하세요");
      return;
    }
    if (!/.+@.+\..+/.test(em)) {
      setMessage("유효한 이메일을 입력하세요");
      return;
    }
    if (pw.length < 8) {
      setMessage("비밀번호는 최소 8자입니다");
      return;
    }
    if (pw !== cf) {
      setMessage("비밀번호가 일치하지 않습니다");
      return;
    }
    if (!consentPrivacy || !consentTerms) {
      setMessage("개인정보 처리 방침과 이용 약관에 모두 동의해 주세요");
      return;
    }
    setLoading(true);
    // 동의 마커 저장(콜백 성공 시 서버에 기록)
    markConsentInClient({ privacy: consentPrivacy, terms: consentTerms });
    const res = await signupWithPassword(em, pw, redirect);
    setLoading(false);
    if (!res.ok) {
      setMessage(res.message || "회원가입 실패");
      return;
    }
    setMessage("확인 이메일을 전송했습니다. 받은 메일의 링크로 인증을 완료해 주세요.");
  };

  return (
    <main id="main" className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">{t('signup')}</h1>
      <form className="mt-6 space-y-3" onSubmit={onSubmit} aria-label="회원가입 폼">
        <div>
          <label className="text-sm text-gray-600" htmlFor="signup-email">{t('email')}</label>
          <input
            type="email"
            id="signup-email"
            className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            aria-required
            aria-invalid={Boolean(message)}
            aria-describedby={message ? "signup-error" : undefined}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600" htmlFor="signup-password">{t('password')}</label>
          <input
            type="password"
            id="signup-password"
            className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="최소 8자"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            aria-required
            aria-invalid={Boolean(message)}
            aria-describedby={message ? "signup-error" : undefined}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600" htmlFor="signup-confirm">{t('confirm')}</label>
          <input
            type="password"
            id="signup-confirm"
            className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="비밀번호 재입력"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            aria-required
            aria-invalid={Boolean(message)}
            aria-describedby={message ? "signup-error" : undefined}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`${outlineButtonSmall} w-full disabled:opacity-50`}
          aria-busy={loading}
          aria-describedby="signup-submit-hint"
        >
          {loading ? t('signingUp') : t('signupNow')}
        </button>
        <p id="signup-submit-hint" className="sr-only">이메일과 비밀번호를 입력해 가입하세요. 로딩 중에는 버튼이 비활성화됩니다.</p>
        <div className="mt-4 flex flex-col gap-2 text-xs text-gray-600">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={consentPrivacy} onChange={(e) => setConsentPrivacy(e.target.checked)} />
            <span><Link href="/privacy" className="link-gauge">{t('consentPrivacy')}</Link>{t('agree')} {t('required')}</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={consentTerms} onChange={(e) => setConsentTerms(e.target.checked)} />
            <span><Link href="/terms" className="link-gauge">{t('consentTerms')}</Link>{t('agree')} {t('required')}</span>
          </label>
        </div>
        <div className="mt-3" aria-describedby="signup-oauth-hint">
          <button
            type="button"
            onClick={async () => {
              setMessage(null);
              if (!consentPrivacy || !consentTerms) {
                setMessage('개인정보 처리 방침과 이용 약관에 모두 동의해 주세요');
                return;
              }
              try {
                const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
                const redirectTo = `${site}/auth/callback?redirect=${encodeURIComponent(redirect)}&flow=login`;
                markConsentInClient({ privacy: consentPrivacy, terms: consentTerms });
                await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
              } catch (e: any) {
                setMessage(e?.message || '구글 로그인 시작 실패');
              }
            }}
            className={`${outlineButtonSmall} w-full inline-flex items-center justify-center gap-2`}
            aria-label={t('googleSignup')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.4 31.9 29.1 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.7 0 19.5-8.3 19.5-19.1 0-1.3-.1-2.1-.3-3.4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14 16.2 18.6 13 24 13c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C34.6 6.1 29.6 4 24 4 15.9 4 8.7 8.6 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5 0 9.6-1.9 13-5l-6.1-5c-2 1.5-4.6 2.5-6.9 2.5-5.1 0-9.4-3.1-11.1-7.5l-6.6 5.1C8.6 39.4 15.8 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.3-4.3 7-11.3 7-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C34.6 6.1 29.6 4 24 4c-11.1 0-20 8.9-20 20s8.9 20 20 20c10.7 0 19.5-8.3 19.5-19.1 0-1.3-.1-2.1-.3-3.4z"/>
            </svg>
            <span>{t('googleSignup')}</span>
          </button>
          <p id="signup-oauth-hint" className="sr-only">구글 계정으로 회원가입합니다. 새 창 또는 리다이렉트가 발생할 수 있습니다.</p>
        </div>
      </form>
      {message && <p id="signup-error" className="mt-3 text-sm text-red-600" aria-live="assertive" role="alert">{message}</p>}
      <p className="mt-6 text-xs text-gray-500">가입 후 이메일로 받은 확인 링크로 인증을 완료하세요.</p>
    </main>
  );
}
