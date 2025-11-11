"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithPassword } from "./actions";
import Link from "next/link";
import { useTransition } from "react";
import { supabase } from "@/lib/supabase/client";
import { markConsentInClient } from "@/lib/policies";
// 회원가입은 별도 라우트(`/signup`)에서 처리합니다

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  // 인라인 회원가입 UI 제거: 별도 페이지로 이동

  const redirect = params.get("redirect") || "/";

  useEffect(() => {
    setMessage(null);
  }, [email, password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const em = email.trim();
    const pw = password.trim();
    if (!em || !pw) {
      setMessage("이메일과 비밀번호를 입력하세요");
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
    setLoading(true);
    const res = await loginWithPassword(em, pw);
    setLoading(false);
    if (!res.ok) {
      setMessage(res.message || "로그인 실패");
      return;
    }
    // 서버 쿠키 세션을 클라이언트 Supabase 세션으로 동기화
    try {
      const sres = await fetch('/api/auth/session', { credentials: 'same-origin' });
      if (sres.ok) {
        const json = await sres.json();
        const at = json?.session?.access_token;
        const rt = json?.session?.refresh_token;
        if (json?.ok && at && rt) {
          await supabase.auth.setSession({ access_token: at, refresh_token: rt });
        }
      }
    } catch {}
    router.replace(`${redirect}${redirect.includes('?') ? '&' : '?'}auth_success=login`);
  };

  const onGoogleLogin = async () => {
    setMessage(null);
    try {
      const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const redirectTo = `${site}/auth/callback?redirect=${encodeURIComponent(redirect)}&flow=login`;
      // 선택적 동의 마커 저장(로그인 화면에서는 필수는 아님)
      markConsentInClient({ privacy: consentPrivacy, terms: consentTerms });
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    } catch (e: any) {
      setMessage(e?.message || '구글 로그인 시작 실패');
    }
  };


  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">로그인</h1>
      <form className="mt-6 space-y-3" onSubmit={onSubmit} aria-label="로그인 폼">
        <div>
          <label className="text-sm text-gray-700" htmlFor="login-email">이메일</label>
          <input
            type="email"
            id="login-email"
            className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-required
          />
        </div>
        <div>
          <label className="text-sm text-gray-700" htmlFor="login-password">비밀번호</label>
          <input
            type="password"
            id="login-password"
            className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-required
          />
          <div className="mt-2 text-right">
            <Link href="/reset" className="text-sm text-black underline underline-offset-2">
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black"
          aria-label="로그인"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={consentPrivacy} onChange={(e) => setConsentPrivacy(e.target.checked)} />
            <span>
              <Link href="/privacy" className="underline">개인정보 처리 방침</Link>에 동의
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={consentTerms} onChange={(e) => setConsentTerms(e.target.checked)} />
            <span>
              <Link href="/terms" className="underline">이용 약관</Link>에 동의
            </span>
          </label>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={onGoogleLogin}
            className="w-full inline-flex items-center justify-center gap-2 rounded border px-4 py-2 bg-white hover:bg-gray-50"
            aria-label="구글로 계속하기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.4 31.9 29.1 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c10.7 0 19.5-8.3 19.5-19.1 0-1.3-.1-2.1-.3-3.4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14 16.2 18.6 13 24 13c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C34.6 6.1 29.6 4 24 4 15.9 4 8.7 8.6 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5 0 9.6-1.9 13-5l-6.1-5c-2 1.5-4.6 2.5-6.9 2.5-5.1 0-9.4-3.1-11.1-7.5l-6.6 5.1C8.6 39.4 15.8 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.3-4.3 7-11.3 7-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.4 2.8l5.7-5.7C34.6 6.1 29.6 4 24 4c-11.1 0-20 8.9-20 20s8.9 20 20 20c10.7 0 19.5-8.3 19.5-19.1 0-1.3-.1-2.1-.3-3.4z"/>
            </svg>
            <span>Google로 계속하기</span>
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-800">
          아직 회원이 아니신가요?{' '}
          <Link
            href={`/signup${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="text-black underline underline-offset-2"
          >
            가입하기
          </Link>
        </p>
      </form>
      {message && <p className="mt-3 text-sm text-red-600" aria-live="polite">{message}</p>}
      <p className="mt-6 text-xs text-gray-500">가입 후 이메일 인증을 완료해 주세요.</p>

      {/* 회원가입 인라인 섹션 제거: `/signup` 페이지로 이동 유도 */}
    </main>
  );
}
