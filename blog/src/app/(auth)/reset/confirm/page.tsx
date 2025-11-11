"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "../actions";

export default function ResetConfirmPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const p = password.trim();
    const c = confirm.trim();
    if (p.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다");
      return;
    }
    if (p !== c) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }
    startTransition(async () => {
      const res = await updatePassword(p);
      if (!res.ok) {
        setError(res.message || "비밀번호 변경 실패");
      } else {
        setMessage(res.message || "비밀번호가 변경되었습니다");
        setTimeout(() => router.replace("/login"), 1200);
      }
    });
  };

  return (
    <main className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">새 비밀번호 설정</h1>
      <p className="text-sm text-gray-600">메일의 링크로 진입하셨다면 여기서 새 비밀번호를 설정할 수 있습니다.</p>
      {message && <div className="rounded border border-green-200 bg-green-50 p-2 text-green-700 text-sm">{message}</div>}
      {error && <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700 text-sm">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-sm">새 비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            required
            minLength={8}
          />
        </label>
        <label className="block">
          <span className="text-sm">비밀번호 확인</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            required
            minLength={8}
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black text-white py-2 disabled:opacity-60"
        >
          {pending ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </main>
  );
}

