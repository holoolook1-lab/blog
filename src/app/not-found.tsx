'use client';

import Link from 'next/link';
import ProtectedLink from '@/components/common/ProtectedLink';
import { outlineButtonSmall } from '@/lib/styles/ui';

export default function NotFound() {
  return (
    <main id="main" className="max-w-3xl mx-auto p-6 space-y-4" role="main" aria-labelledby="notfound-title">
      <div className="flex items-center justify-between">
        <h1 id="notfound-title" className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
        <span className="text-xs text-gray-500">404 Not Found</span>
      </div>
      <p className="text-sm text-gray-600">요청하신 주소가 잘못되었거나, 페이지가 이동/삭제되었을 수 있습니다.</p>
      <div className="flex items-center gap-3">
        <Link href="/" className={outlineButtonSmall}>홈으로</Link>
        <Link href="/posts" className={outlineButtonSmall}>포스트 목록</Link>
        <ProtectedLink href="/write" className={outlineButtonSmall} aria-label="글 작성">글 작성</ProtectedLink>
      </div>
    </main>
  );
}
