"use client";
import Link from 'next/link';
import ProtectedLink from '@/components/common/ProtectedLink';
import { outlineButtonSmall } from '@/lib/styles/ui';

export default function PostNotFound() {
  return (
    <main id="main" className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">글을 찾을 수 없습니다</h1>
        <span className="text-xs text-gray-500">404 Not Found</span>
      </div>
      <p className="text-sm text-gray-600">요청하신 글이 삭제되었거나, 주소가 잘못되었을 수 있습니다. 슬러그의 공백/오타를 확인해 주세요.</p>
      <div className="flex items-center gap-3">
        <Link href="/posts" className={outlineButtonSmall}>포스트 목록</Link>
        <ProtectedLink href="/write" className={outlineButtonSmall} aria-label="새 글 작성">새 글 작성</ProtectedLink>
        <Link href="/" className={outlineButtonSmall}>홈으로</Link>
      </div>
    </main>
  );
}
