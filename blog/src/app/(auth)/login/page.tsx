"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithPassword } from "./actions";
import Link from "next/link";
import { useTransition } from "react";
import { supabase } from "@/lib/supabase/client";
// 회원가입은 별도 라우트(`/signup`)에서 처리합니다

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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

  // 회원가입은 `/signup` 라우트에서 진행


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
