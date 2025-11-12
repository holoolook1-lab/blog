'use client';
import { useEffect, useState } from 'react';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import ActionToast from '@/components/ui/ActionToast';
import { Bookmark } from 'lucide-react';

export default function BookmarkButton({ postId }: { postId: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { userId } = useAuthUser();
  const { requireAuth } = useRequireAuth();

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
    if (!requireAuth()) return;
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
    <>
      <button
        type="button"
        className={`${bookmarked ? 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100' : 'hover:bg-gray-100'} inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm disabled:opacity-50`}
        disabled={loading}
        onClick={toggle}
        aria-label={bookmarked ? '스크랩 해제' : '스크랩'}
        title={bookmarked ? '스크랩 해제' : '스크랩'}
      >
        <Bookmark size={18} className={bookmarked ? 'fill-yellow-500 text-yellow-600' : 'text-gray-700'} />
        <span className="font-medium">{bookmarked ? '저장됨' : '저장'}</span>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </button>
      {toast && <ActionToast toast={toast} onClose={() => setToast(null)} />}
    </>
  );
}
