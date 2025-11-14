"use client";
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4" aria-labelledby="error-title" role="main">
      <h1 id="error-title" className="text-2xl font-bold">문제가 발생했습니다</h1>
      <p className="text-sm text-gray-600">잠시 후 다시 시도해 주세요. 아래 버튼으로 초기화할 수 있습니다.</p>
      <button onClick={reset} className="inline-flex items-center px-3 py-1 rounded border text-sm">다시 시도</button>
    </main>
  );
}

