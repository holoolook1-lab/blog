"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithPassword } from "./actions";
import Link from "next/link";
import { useTransition } from "react";
import { signupWithPassword } from "../signup/actions";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suMessage, setSuMessage] = useState<string | null>(null);
  const [suPending, startSuTransition] = useTransition();

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
    router.replace(redirect);
  };

  const onSignupInline = (e: React.FormEvent) => {
    e.preventDefault();
    setSuMessage(null);
    const em = suEmail.trim();
    const pw = suPassword.trim();
    const cf = suConfirm.trim();
    if (!em || !pw || !cf) {
      setSuMessage("이메일, 비밀번호, 비밀번호 확인을 입력하세요");
      return;
    }
    if (!/.+@.+\..+/.test(em)) {
      setSuMessage("유효한 이메일을 입력하세요");
      return;
    }
    if (pw.length < 8) {
      setSuMessage("비밀번호는 최소 8자입니다");
      return;
    }
    if (pw !== cf) {
      setSuMessage("비밀번호가 일치하지 않습니다");
      return;
    }
    startSuTransition(async () => {
      const res = await signupWithPassword(em, pw, redirect);
      if (!res.ok) {
        setSuMessage(res.message || "회원가입 실패");
      } else {
        setSuMessage("확인 이메일을 전송했습니다. 받은 메일의 링크로 인증을 완료해 주세요.");
      }
    });
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
        <p className="mt-3 text-sm text-gray-800">
          아직 회원이 아니신가요?{' '}
          <button
            type="button"
            onClick={() => setShowSignup((v) => !v)}
            className="text-black underline underline-offset-2"
            aria-expanded={showSignup}
            aria-controls="inline-signup"
          >
            가입하기
          </button>
        </p>
      </form>
      {message && <p className="mt-3 text-sm text-red-600" aria-live="polite">{message}</p>}
      <p className="mt-6 text-xs text-gray-500">가입 후 이메일 인증을 완료해 주세요.</p>

      {showSignup && (
        <section id="inline-signup" className="mt-6 border-t pt-6" aria-label="회원가입 섹션">
          <h2 className="text-lg font-semibold">회원가입</h2>
          <form className="mt-4 space-y-3" onSubmit={onSignupInline} aria-label="회원가입 폼">
            <div>
              <label className="text-sm text-gray-700" htmlFor="signup-email">이메일</label>
              <input
                type="email"
                id="signup-email"
                className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="you@example.com"
                value={suEmail}
                onChange={(e) => setSuEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700" htmlFor="signup-password">비밀번호</label>
              <input
                type="password"
                id="signup-password"
                className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="최소 8자"
                value={suPassword}
                onChange={(e) => setSuPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-700" htmlFor="signup-confirm">비밀번호 확인</label>
              <input
                type="password"
                id="signup-confirm"
                className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="비밀번호 재입력"
                value={suConfirm}
                onChange={(e) => setSuConfirm(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={suPending}
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black"
            >
              {suPending ? "가입 중..." : "가입하기"}
            </button>
          </form>
          {suMessage && <p className="mt-3 text-sm text-gray-700" aria-live="polite">{suMessage}</p>}
        </section>
      )}
    </main>
  );
}
