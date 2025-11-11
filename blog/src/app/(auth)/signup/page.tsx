"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signupWithPassword } from "./actions";

export default function SignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    setLoading(true);
    const res = await signupWithPassword(em, pw, redirect);
    setLoading(false);
    if (!res.ok) {
      setMessage(res.message || "회원가입 실패");
      return;
    }
    setMessage("확인 이메일을 전송했습니다. 받은 메일의 링크로 인증을 완료해 주세요.");
  };

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="text-2xl font-bold">회원가입</h1>
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
            placeholder="최소 8자"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">비밀번호 확인</label>
          <input
            type="password"
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="비밀번호 재입력"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "가입 중..." : "가입하기"}
        </button>
      </form>
      {message && <p className="mt-3 text-sm text-gray-700">{message}</p>}
      <p className="mt-6 text-xs text-gray-500">가입 후 이메일로 받은 확인 링크로 인증을 완료하세요.</p>
    </main>
  );
}

