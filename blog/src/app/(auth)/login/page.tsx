"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithPassword } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">로그인</h1>
      <form className="mt-6 space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="text-sm text-gray-600">이메일</label>
          <input
            type="email"
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">비밀번호</label>
          <input
            type="password"
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
      <p className="mt-6 text-xs text-gray-500">계정이 없으신가요? 회원가입 페이지에서 이메일 인증 후 로그인하세요.</p>
    </main>
  );
}

