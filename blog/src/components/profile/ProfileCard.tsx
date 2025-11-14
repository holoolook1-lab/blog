"use client";
 import { useEffect, useRef, useState } from 'react';
 import Image from 'next/image';
 import { supabase } from '@/lib/supabase/client';
 import Link from 'next/link';
 import { getOptimizedImageUrl } from '@/lib/utils/image';
 import { Crown, Diamond, Medal } from 'lucide-react';

type Profile = { username?: string | null; avatar_url?: string | null; bio?: string | null };

export default function ProfileCard({ authorId }: { authorId: string }) {
  const [profile, setProfile] = useState<Profile>({});
  const [postCount, setPostCount] = useState<number>(0);
  const [likeSum, setLikeSum] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadedRef = useRef<boolean>(false);

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
            loadedRef.current = true;
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
        const likes = (posts || []).reduce((sum: number, p: any) => sum + (p.like_count || 0), 0);
        if (alive) { setPostCount(count); setLikeSum(likes); }
      } catch {}
      if (alive) { setLoading(false); loadedRef.current = true; }
    };
    const el = containerRef.current;
    // IntersectionObserver로 가시화될 때만 로딩(모바일 초기 렌더 비용 감소)
    const observer = new IntersectionObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      if (e.isIntersecting && !loadedRef.current) {
        load();
      }
    }, { threshold: 0.1, rootMargin: '100px 0px' });
    if (el) observer.observe(el);
    return () => { observer.disconnect(); alive = false; };
  }, [authorId]);

  // 점수 공식: 글 수를 추천보다 2배 가중치(글×2 + 추천×1)
  const score = postCount * 2 + likeSum * 1;
  const level = score >= 1000 ? 'platinum' : score >= 500 ? 'gold' : score >= 100 ? 'silver' : 'bronze';
  const borderClass = level === 'platinum'
    ? 'border-2 border-[#e5e4e2] shadow-lg'
    : level === 'gold'
      ? 'border-2 border-[#d4af37] shadow-md'
      : level === 'silver'
        ? 'border border-[#c0c0c0]'
        : 'border';
  const bgClass = level === 'gold' ? 'bg-amber-50' : level === 'platinum' ? 'bg-zinc-50' : 'bg-white';

  // 세련된 배지 디자인 - 명품 느낌 (모바일 최적화)
  const badge = level === 'platinum'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:gap-2 sm:px-3 sm:py-1 text-xs font-light tracking-wider text-gray-700 bg-gray-50 border border-gray-200 rounded-full"><Diamond size={10} className="sm:size-3 text-gray-400" /> <span className="hidden sm:inline">PLATINUM</span></span>
    : level === 'gold'
      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:gap-2 sm:px-3 sm:py-1 text-xs font-light tracking-wider text-amber-800 bg-amber-50 border border-amber-200 rounded-full"><Crown size={10} className="sm:size-3 text-amber-600" /> <span className="hidden sm:inline">GOLD</span></span>
      : level === 'silver'
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:gap-2 sm:px-3 sm:py-1 text-xs font-light tracking-wider text-gray-600 bg-gray-50 border border-gray-200 rounded-full"><Medal size={10} className="sm:size-3 text-gray-400" /> <span className="hidden sm:inline">SILVER</span></span>
        : <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:gap-2 sm:px-3 sm:py-1 text-xs font-light tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded-full"><Medal size={10} className="sm:size-3 text-amber-600" /> <span className="hidden sm:inline">BRONZE</span></span>;

  const username = (profile.username || '').slice(0, 20);
  const fontFamily = 'var(--font-family, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR)';
  const themeColor = 'var(--theme-color, #111827)';

  return (
    <section
      className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-8"
      style={{ fontFamily }}
      aria-label="작성자 프로필"
      ref={containerRef}
    >
      <div className="flex flex-col items-center text-center space-y-3 sm:space-y-6">
        {/* 프로필 이미지 - 고급스러운 원형 */}
        <div className="relative">
          <div className="w-16 h-16 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-gray-200 relative">
            {profile.avatar_url ? (
              <Image
                src={getOptimizedImageUrl(profile.avatar_url || '', { width: 150, quality: 85, format: 'webp' })}
                alt={`${(profile.username || '').slice(0, 20) || '사용자'}의 프로필 이미지`}
                fill
                sizes="(max-width:640px) 64px, 128px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-xs sm:text-sm font-light">
                NO IMAGE
              </div>
            )}
          </div>
          {/* 배지를 이미지 위로 겹치기 */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            {badge}
          </div>
        </div>

        {/* 사용자 정보 */}
        <div className="space-y-2 sm:space-y-4 w-full max-w-xs">
          {/* 이름과 배지 */}
          <div className="space-y-1 sm:space-y-2">
            <Link 
              href={`/user/${authorId}`} 
              className="text-lg sm:text-xl font-light text-gray-900 hover:text-gray-700 transition-colors duration-200 block"
            >
              {username || '사용자'}
            </Link>
          </div>

          {/* 통계 - 미니멀한 수평 레이아웃 */}
          <div className="flex justify-center items-center space-x-4 sm:space-x-6 text-xs sm:text-sm">
            <div className="text-center">
              <div className="text-gray-900 font-light">{postCount}</div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">Posts</div>
            </div>
            <div className="h-4 sm:h-6 w-px bg-gray-200"></div>
            <div className="text-center">
              <div className="text-gray-900 font-light">{likeSum}</div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">Likes</div>
            </div>
            <div className="h-4 sm:h-6 w-px bg-gray-200"></div>
            <div className="text-center">
              <div className="text-gray-900 font-light">{score}</div>
              <div className="text-gray-500 text-xs uppercase tracking-wider">Score</div>
            </div>
          </div>

          {/* 구분선 */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-12 sm:w-16 mx-auto"></div>

          {/* 자기소개 */}
          <div className="min-h-[2rem] sm:min-h-[3rem]">
            {profile.bio ? (
              <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed break-words">
                {(profile.bio || '').slice(0, 150)}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-gray-400 font-light italic">
                자기소개가 없습니다
              </p>
            )}
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-2xl">
          <div className="text-xs text-gray-500">로딩 중...</div>
        </div>
      )}
    </section>
  );
}
