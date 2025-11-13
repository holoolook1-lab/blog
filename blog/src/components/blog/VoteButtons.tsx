'use client';
import { useEffect, useState } from 'react';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import ActionToast from '@/components/ui/ActionToast';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export default function VoteButtons({ postId, initialLikes = 0, initialDislikes = 0 }: { postId: string; initialLikes?: number; initialDislikes?: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { userId } = useAuthUser();
  const loggedIn = Boolean(userId);
  const { requireAuth } = useRequireAuth();

  async function refreshCounts() {
    try {
      const res = await fetch(`/api/votes?post_id=${postId}`);
      if (!res.ok) return;
      const data = await res.json();
      setLikes(data.likes || 0);
      setDislikes(data.dislikes || 0);
    } catch {}
  }

  useEffect(() => {
    refreshCounts();
  }, [postId]);

  async function handleVote(value: 1 | -1) {
    if (!requireAuth()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/votes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ post_id: postId, value }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '처리 중 오류가 발생했습니다');
      }
      await refreshCounts();
    } catch (e: any) {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="투표 버튼" aria-busy={loading}>
      <button
        type="button"
        className="group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black min-w-[44px] min-h-[36px]"
        disabled={loading}
        onClick={() => handleVote(1)}
        aria-label="좋아요"
        title="좋아요"
      >
        <ThumbsUp size={16} className="text-gray-700 group-hover:text-black" aria-hidden="true" focusable="false" />
        <span className="font-medium tabular-nums">{likes}</span>
      </button>
      <button
        type="button"
        className="group inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs hover:bg-gray-100 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-black min-w-[44px] min-h-[36px]"
        disabled={loading}
        onClick={() => handleVote(-1)}
        aria-label="비추천"
        title="비추천"
      >
        <ThumbsDown size={16} className="text-gray-700 group-hover:text-black" aria-hidden="true" focusable="false" />
        <span className="font-medium tabular-nums">{dislikes}</span>
      </button>
      {error && <span className="text-xs text-red-600" role="alert" aria-live="assertive">{error}</span>}
      {toast && <ActionToast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
