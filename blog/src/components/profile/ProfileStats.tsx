'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ProfileStats() {
  const [counts, setCounts] = useState<{ bookmarks: number; likes: number; dislikes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      try {
        const [{ count: bm }, { count: lk }, { count: dk }] = await Promise.all([
          supabase.from('bookmarks').select('post_id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('votes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('value', 1),
          supabase.from('votes').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('value', -1),
        ]);
        setCounts({ bookmarks: bm || 0, likes: lk || 0, dislikes: dk || 0 });
      } catch (e: any) {
        setError('통계 조회 실패');
      }
    }).catch(() => setError('로그인 필요'));
  }, []);

  if (error) return <p className="text-xs text-red-600">{error}</p>;
  if (!counts) return <p className="text-xs text-gray-500">통계 로딩 중…</p>;
  return (
    <div className="flex items-center gap-4 text-sm">
      <span>스크랩: <span className="font-medium">{counts.bookmarks}</span></span>
      <span>좋아요: <span className="font-medium">{counts.likes}</span></span>
      <span>비추천: <span className="font-medium">{counts.dislikes}</span></span>
    </div>
  );
}

