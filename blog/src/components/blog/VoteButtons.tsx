'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function VoteButtons({ postId, initialLikes = 0, initialDislikes = 0 }: { postId: string; initialLikes?: number; initialDislikes?: number }) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

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
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(Boolean(data.user));
    }).catch(() => setLoggedIn(false));
  }, [postId]);

  async function handleVote(value: 1 | -1) {
    if (!loggedIn) {
      setError('로그인 후 이용해주세요.');
      return;
    }
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
    <div className="flex items-center gap-3">
      <button type="button" className="inline-flex items-center gap-2 border rounded px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50" disabled={loading} onClick={() => handleVote(1)}>
        👍 좋아요 <span className="font-medium">{likes}</span>
      </button>
      <button type="button" className="inline-flex items-center gap-2 border rounded px-2 py-1 text-sm hover:bg-gray-50 disabled:opacity-50" disabled={loading} onClick={() => handleVote(-1)}>
        👎 비추천 <span className="font-medium">{dislikes}</span>
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
