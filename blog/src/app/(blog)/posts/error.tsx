"use client";
import { useEffect } from 'react';

export default function PostsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4" aria-labelledby="posts-error-title" role="main">
      <h1 id="posts-error-title" className="text-2xl font-bold">포스트 로딩 오류</h1>
      <p className="text-sm text-gray-600">네트워크 또는 서버 상태에 문제가 있을 수 있습니다. 다시 시도해 주세요.</p>
      <button onClick={reset} className="inline-flex items-center px-3 py-1 rounded border text-sm">다시 시도</button>
    </main>
  );
}

