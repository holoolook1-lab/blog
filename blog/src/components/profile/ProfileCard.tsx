"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Crown, Diamond, Medal } from 'lucide-react';

type Profile = { username?: string | null; avatar_url?: string | null; bio?: string | null };

export default function ProfileCard({ authorId }: { authorId: string }) {
  const [profile, setProfile] = useState<Profile>({});
  const [postCount, setPostCount] = useState<number>(0);
  const [likeSum, setLikeSum] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        // 1) 집계 뷰(profile_stats) 우선 조회
        const { data: stat } = await supabase
          .from('profile_stats')
          .select('username, avatar_url, bio, post_count, like_sum')
          .eq('user_id', authorId)
          .single();
        if (stat) {
          if (alive) {
            setProfile({
              username: (stat as any)?.username || null,
              avatar_url: (stat as any)?.avatar_url || null,
              bio: (stat as any)?.bio || null,
            });
            setPostCount((stat as any)?.post_count || 0);
            setLikeSum((stat as any)?.like_sum || 0);
            setLoading(false);
            return;
          }
        }
      } catch {}
      try {
        // 2) 폴백: 프로필 + 게시글 직접 조회
        const { data: prof } = await supabase
          .from('profiles')
          .select('username, avatar_url, bio')
          .eq('id', authorId)
          .single();
        if (alive) setProfile({
          username: (prof as any)?.username || null,
          avatar_url: (prof as any)?.avatar_url || null,
          bio: (prof as any)?.bio || null,
        });
      } catch {}
      try {
        const { data: posts } = await supabase
          .from('posts')
          .select('id, like_count')
          .eq('user_id', authorId)
          .eq('published', true);
        const count = (posts || []).length;
        const likes = (posts || []).reduce((sum, p: any) => sum + (p.like_count || 0), 0);
        if (alive) { setPostCount(count); setLikeSum(likes); }
      } catch {}
      if (alive) setLoading(false);
    };
    load();
    return () => { alive = false; };
  }, [authorId]);

  // 점수 공식: 글 수를 추천보다 2배 가중치(글×2 + 추천×1)
  const score = postCount * 2 + likeSum * 1;
  const level = score >= 1000 ? 'platinum' : score >= 500 ? 'gold' : score >= 100 ? 'silver' : 'bronze';
  const borderClass = level === 'platinum'
    ? 'border-2 border-[#e5e4e2] shadow-lg animate-pulse'
    : level === 'gold'
      ? 'border-2 border-[#d4af37] shadow-md'
      : level === 'silver'
        ? 'border border-[#c0c0c0]'
        : 'border';
  const bgClass = level === 'gold' ? 'bg-amber-50' : level === 'platinum' ? 'bg-zinc-50' : 'bg-white';

  const badge = level === 'platinum'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-zinc-100 border"><Diamond size={14} /> 플래티넘</span>
    : level === 'gold'
      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-amber-100 border"><Crown size={14} /> 골드</span>
      : level === 'silver'
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-gray-100 border"><Medal size={14} /> 실버</span>
        : null;

  const username = (profile.username || '').slice(0, 20);
  const fontFamily = 'var(--font-family, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR)';
  const themeColor = 'var(--theme-color, #111827)';

  return (
    <section
      className={`${borderClass} ${bgClass} rounded-lg p-4 transition-transform duration-200 hover:scale-[1.05]`}
      style={{ fontFamily }}
      aria-label="작성자 프로필"
    >
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] rounded-full overflow-hidden border" style={{ borderColor: themeColor }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="프로필 이미지" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">이미지 없음</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <p className="text-lg font-bold" style={{ color: themeColor }}>{username || '사용자'}</p>
            {badge}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            <span>글 수: <strong className="text-gray-800">{postCount}</strong></span>
            <span className="ml-4">추천 받은 수: <strong className="text-gray-800">{likeSum}</strong></span>
            <span className="ml-4">점수: <strong className="text-gray-800">{score}</strong></span>
          </div>
          <div className="mt-3">
            <p className="text-sm text-gray-700 whitespace-pre-line break-words">
              {(profile.bio || '').slice(0, 200) || '자기소개가 없습니다.'}
            </p>
          </div>
        </div>
      </div>
      {loading && <p className="text-xs text-gray-500 mt-2">로딩 중...</p>}
    </section>
  );
}
