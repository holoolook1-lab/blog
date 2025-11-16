import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getServerSupabase } from '@/lib/supabase/server';
import Image from 'next/image';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { formatDateKR } from '@/lib/date';
import { Crown, Diamond, Medal } from 'lucide-react';

type Params = { params: Promise<{ id: string }> };

export const revalidate = 300;

function levelLabel(level: string) {
  return level === 'platinum' ? '플래티넘' : level === 'gold' ? '골드' : level === 'silver' ? '실버' : '브론즈';
}

function levelIcon(level: string) {
  return level === 'platinum' ? <Diamond size={16} /> : level === 'gold' ? <Crown size={16} /> : <Medal size={16} />;
}

export default async function UserProfilePage({ params }: Params) {
  const supabase = (await getServerSupabase()) || createPublicSupabaseClient();
  const { id } = await params;

  // 프로필/집계 조회
  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, bio')
    .eq('id', id)
    .single();

  let postCount = 0;
  let likeSum = 0;
  let score = 0;
  let level: 'platinum' | 'gold' | 'silver' | 'bronze' = 'bronze';
  const { data: stat } = await supabase
    .from('profile_stats')
    .select('post_count, like_sum, score, level')
    .eq('user_id', id)
    .single();
  if (stat) {
    postCount = (stat as any)?.post_count || 0;
    likeSum = (stat as any)?.like_sum || 0;
    score = (stat as any)?.score || (postCount * 2 + likeSum * 1);
    level = ((stat as any)?.level || 'bronze') as any;
  } else {
    const { data: posts } = await supabase
      .from('posts')
      .select('id, like_count')
      .eq('published', true)
      .eq('user_id', id);
    postCount = (posts || []).length;
    likeSum = (posts || []).reduce((s: number, p: any) => s + (p.like_count || 0), 0);
    score = postCount * 2 + likeSum * 1;
    level = score >= 1000 ? 'platinum' : score >= 500 ? 'gold' : score >= 100 ? 'silver' : 'bronze';
  }

  // 배지 목록
  const { data: pb } = await supabase
    .from('profile_badges')
    .select('badge_key, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: true });
  const badgeKeys = (pb || []).map((b: any) => b.badge_key);
  let badges: Array<{ key: string; name: string; icon: string; created_at?: string }> = [];
  if (badgeKeys.length) {
    const { data: bd } = await supabase
      .from('badges')
      .select('key, name, icon')
      .in('key', badgeKeys);
    const byKey: Record<string, any> = {};
    (bd || []).forEach((b: any) => { byKey[b.key] = b; });
    badges = (pb || []).map((b: any) => ({ key: b.badge_key, name: byKey[b.badge_key]?.name || b.badge_key, icon: byKey[b.badge_key]?.icon || 'medal', created_at: b.created_at }));
  }
  // 현재 레벨 배지는 기본으로 맨 앞에 노출
  if (!badges.find(b => b.key === level)) badges.unshift({ key: level, name: levelLabel(level), icon: level === 'platinum' ? 'diamond' : level === 'gold' ? 'crown' : 'medal', created_at: undefined });

  // 등급 히스토리(누적 점수에 따라 임계치 돌파 시각 계산)
  const thresholds = [100, 500, 1000];
  const { data: tsPosts } = await supabase
    .from('posts')
    .select('created_at, like_count')
    .eq('published', true)
    .eq('user_id', id)
    .order('created_at', { ascending: true });
  const history: Array<{ level: string; at: string }> = [];
  let acc = 0;
  let reached: Record<number, boolean> = { 100: false, 500: false, 1000: false };
  (tsPosts || []).forEach((p: any) => {
    acc += 2 + (p.like_count || 0);
    thresholds.forEach(t => {
      if (!reached[t] && acc >= t) {
        reached[t] = true;
        const lvl = t === 1000 ? 'platinum' : t === 500 ? 'gold' : 'silver';
        history.push({ level: lvl, at: p.created_at });
      }
    });
  });

  return (
    <main className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex flex-row lg:flex-col items-start gap-4">
        <div className="relative w-[96px] h-[96px] sm:w-[140px] sm:h-[140px] lg:w-[180px] lg:h-[180px] rounded-full overflow-hidden border">
          {profile?.avatar_url ? (
            <Image
              src={getOptimizedImageUrl(profile?.avatar_url || '', { width: 180, quality: 85, format: 'webp' })}
              alt="프로필 이미지"
              fill
              sizes="(max-width:640px) 96px, (max-width:1024px) 140px, 180px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">이미지 없음</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{profile?.username || '사용자'}</h1>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border bg-gray-50">
              {levelIcon(level)} {levelLabel(level)}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-700 whitespace-pre-line break-words">{profile?.bio || '자기소개가 없습니다.'}</p>
          <p className="mt-2 text-sm text-gray-600">글 수: <strong>{postCount}</strong> · 추천 합: <strong>{likeSum}</strong> · 점수: <strong>{score}</strong></p>
        </div>
      </header>

      <section>
        <h2 className="text-lg font-semibold">배지</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {badges.length ? badges.map(b => (
            <span key={b.key + (b.created_at || '')} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border bg-white">
              {b.key === 'platinum' ? <Diamond size={14} /> : b.key === 'gold' ? <Crown size={14} /> : <Medal size={14} />}
              {b.name}
              {b.created_at ? <span className="ml-2 text-[10px] text-gray-500">{formatDateKR(b.created_at)}</span> : null}
            </span>
          )) : <p className="text-sm text-gray-600">배지가 없습니다.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">등급 히스토리</h2>
        <div className="mt-2 flex flex-col gap-2">
          {history.length ? history.map(h => (
            <div key={h.level + h.at} className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded border bg-white">
              {levelIcon(h.level)} <span className="font-semibold">{levelLabel(h.level)}</span> <span className="text-gray-500">{formatDateKR(h.at)}</span>
            </div>
          )) : <p className="text-sm text-gray-600">아직 임계치 돌파 기록이 없습니다.</p>}
        </div>
      </section>
    </main>
  );
}

