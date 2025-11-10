'use client';
import { useEffect, useState } from 'react';
import { useAuthUser } from '@/lib/hooks/useAuthUser';

export default function BookmarkButton({ postId }: { postId: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userId } = useAuthUser();

  useEffect(() => {
    const is = Boolean(userId);
    if (is) {
      fetch('/api/bookmarks')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data) return;
          const exists = (data.bookmarks || []).some((b: any) => b.post_id === postId);
          setBookmarked(Boolean(exists));
        })
        .catch(() => {});
    } else {
      setBookmarked(false);
    }
  }, [postId, userId]);

  async function toggle() {
    if (!userId) {
      setError('로그인 후 이용해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (!bookmarked) {
        const res = await fetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: postId }) });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || '스크랩 실패');
          return;
        }
        setBookmarked(true);
      } else {
        const res = await fetch('/api/bookmarks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: postId }) });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || '스크랩 해제 실패');
          return;
        }
        setBookmarked(false);
      }
    } catch (e: any) {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button type="button" className="inline-flex items-center gap-2 border rounded px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50" disabled={loading} onClick={toggle}>
      {bookmarked ? '★ 스크랩 해제' : '☆ 스크랩'}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </button>
  );
}
