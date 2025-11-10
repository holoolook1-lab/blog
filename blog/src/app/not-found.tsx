'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
        <span className="text-xs text-gray-500">404 Not Found</span>
      </div>
      <p className="text-sm text-gray-600">요청하신 주소가 잘못되었거나, 페이지가 이동/삭제되었을 수 있습니다.</p>
      <div className="flex items-center gap-3">
        <Link href="/" className="border rounded px-3 py-1 hover:bg-gray-50">홈으로</Link>
        <Link href="/posts" className="border rounded px-3 py-1 hover:bg-gray-50">포스트 목록</Link>
        <Link href="/write" className="border rounded px-3 py-1 hover:bg-gray-50">글 작성</Link>
      </div>
    </main>
  );
}