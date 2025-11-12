import Link from 'next/link';
import ProtectedLink from '@/components/common/ProtectedLink';
import Image from 'next/image';
import { SITE_NAME, TAGLINE } from '@/lib/brand';
import { formatDateKR } from '@/lib/date';
import { getOptimizedImageUrl, defaultSizes } from '@/lib/utils/image';
import { getShimmerDataURL } from '@/lib/utils/shimmer';
import PostCard from '@/components/blog/PostCard';
import { Mail, AtSign, Globe } from 'lucide-react';
import VisitorPing from '@/components/analytics/VisitorPing';
import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { Suspense } from 'react';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import AutoPlayEmbed from '@/components/media/AutoPlayEmbed';
import { outlineButton } from '@/lib/styles/ui';
// Accordion 섹션 제거

export const revalidate = 60;

const SocialLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </a>
);

export default async function HomePage() {
  let latest: any | null = null;
  let recent: any[] = [];
  const supabase = createPublicSupabaseClient();
  try {
    const { data } = await supabase
      .from('posts')
      .select('id, user_id, title, slug, excerpt, cover_image, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(0, 5);
    recent = data || [];
    latest = recent[0] || null;
    if (latest) {
      const { data: full } = await supabase
        .from('posts')
        .select('id, content')
        .eq('id', latest.id)
        .single();
      if (full) latest.content = full.content;
    }
    // 작성자 프로필(닉네임/아바타) 매핑
    const userIds = Array.from(new Set((recent || []).map((p: any) => p.user_id).filter(Boolean)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds as any);
      const nameMap: Record<string, string> = {};
      const avatarMap: Record<string, string> = {};
      (profs || []).forEach((pr: any) => {
        nameMap[pr.id] = pr.username || '';
        avatarMap[pr.id] = pr.avatar_url || '';
      });
      recent = (recent || []).map((p: any) => ({
        ...p,
        __authorName: nameMap[p.user_id] || p.user_id || '',
        __authorAvatar: avatarMap[p.user_id] || '',
      }));
    }
  } catch {}

  return (
    <main id="main" className="max-w-3xl mx-auto p-4 space-y-12">
      {/* 히어로 */}
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">{SITE_NAME}</h1>
        <p className="text-gray-600 text-lg">{TAGLINE}</p>
        {/* 방문자 통계는 푸터에서만 통합 표시합니다 */}
        <div className="flex gap-3 pt-2">
          <Link href="/posts" className={outlineButton}>
            최근 글 보기
          </Link>
          <ProtectedLink href="/write" className={outlineButton} ariaLabel="글 작성">
            글 작성
          </ProtectedLink>
        </div>
        {/* 방문 핑: 새로고침은 중복 집계되지 않음 */}
        <VisitorPing />
      </section>

      {/* 뉴스레터 섹션 제거 */}

      {/* 대표 글 */}
      {latest && (
        <section className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {(() => {
            const safe = sanitizeHtml(latest.content || '');
            const mIframe = safe.match(/<iframe[^>]+src=["']([^"']+)["'][^>]*>/i);
            const mVideo = safe.match(/<video[^>]+src=["']([^"']+)["'][^>]*>/i) || safe.match(/<source[^>]+src=["']([^"']+)["'][^>]*>/i);
            const srcIframe = mIframe?.[1] || '';
            const srcVideo = mVideo?.[1] || '';
            const supported = srcIframe && /(youtube\.com|youtu\.be|player\.vimeo\.com|dailymotion\.com\/embed|player\.twitch\.tv|tv\.naver\.com\/embed|tiktok\.com\/embed|instagram\.com\/.*\/embed|facebook\.com\/plugins\/video\.php)/i.test(srcIframe);
            const isPortrait = srcIframe && /tiktok\.com\/embed|instagram\.com\/.*\/embed/i.test(srcIframe);
            if (supported) {
              // 볼륨 토글 UI
              return (
                <div className={`relative w-full ${isPortrait ? 'aspect-[9/16]' : 'aspect-[16/9]'}`}>
                  {/* 음소거 토글: 기본 음소거 */}
                  {/* 클라이언트에서만 상태 관리 */}
                  {typeof window !== 'undefined' ? (
                    (() => {
                      const React = require('react');
                      const { useState } = React as typeof import('react');
                      const [muted, setMuted] = useState(true);
                      return (
                        <>
                          <AutoPlayEmbed type="iframe" src={srcIframe} muted={muted} className="absolute inset-0 w-full h-full" />
                          <button
                            type="button"
                            onClick={() => setMuted((m: boolean) => !m)}
                            className="absolute bottom-3 right-3 z-10 rounded px-3 py-1 text-xs font-semibold bg-black/60 text-white hover:bg-black/80"
                            aria-label={muted ? '소리 켜기' : '소리 끄기'}
                          >
                            {muted ? '소리 켜기' : '소리 끄기'}
                          </button>
                        </>
                      );
                    })()
                  ) : (
                    <AutoPlayEmbed type="iframe" src={srcIframe} className="absolute inset-0 w-full h-full" />
                  )}
                </div>
              );
            }
            if (srcVideo && /\.(mp4|webm|ogg)(\?.*)?$/i.test(srcVideo)) {
              return (
                <div className="relative w-full aspect-[16/9]">
                  {typeof window !== 'undefined' ? (
                    (() => {
                      const React = require('react');
                      const { useState } = React as typeof import('react');
                      const [muted, setMuted] = useState(true);
                      return (
                        <>
                          <AutoPlayEmbed type="file" src={srcVideo} muted={muted} className="absolute inset-0 w-full h-full" />
                          <button
                            type="button"
                            onClick={() => setMuted((m: boolean) => !m)}
                            className="absolute bottom-3 right-3 z-10 rounded px-3 py-1 text-xs font-semibold bg-black/60 text-white hover:bg-black/80"
                          >
                            {muted ? '소리 켜기' : '소리 끄기'}
                          </button>
                        </>
                      );
                    })()
                  ) : (
                    <AutoPlayEmbed type="file" src={srcVideo} className="absolute inset-0 w-full h-full" />
                  )}
                </div>
              );
            }
            if (latest.cover_image) {
              return (
            <Link href={`/posts/${encodeURIComponent(latest.slug)}`}>
                  <div className="relative w-full aspect-[16/9]">
                    <Image
                      src={getOptimizedImageUrl(latest.cover_image, { width: 1024, quality: 80, format: 'webp' })}
                      alt={latest.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                      placeholder="blur"
                      blurDataURL={getShimmerDataURL(16, 9)}
                    />
                  </div>
                </Link>
              );
            }
            return null;
          })()}
          <div className="p-5">
            <Link href={`/posts/${encodeURIComponent(latest.slug)}`} className="text-xl font-bold">{latest.title}</Link>
            {latest.excerpt && <p className="text-base text-gray-600 mt-2">{latest.excerpt}</p>}
      <p className="text-sm text-gray-500 mt-3">{formatDateKR(latest.created_at)}</p>
          </div>
        </section>
      )}

      {/* 최신 글 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">최신 글</h2>
          <Link href="/posts" className="text-sm font-medium text-gray-600 hover:text-black">전체 보기</Link>
        </div>
        {recent.length === 0 ? (
          <div className="border rounded-lg p-8 text-center space-y-3">
            <p className="text-base text-gray-600">아직 공개된 포스트가 없습니다.</p>
            <ProtectedLink href="/write" className={outlineButton} ariaLabel="첫 글 쓰기">
              첫 글 쓰기
            </ProtectedLink>
          </div>
        ) : (
          <ul className="grid gap-6">
            {recent.map((p) => (
              <PostCard
                key={p.id}
                variant="polaroid"
                showExcerpt={true}
                post={{
                  id: p.id,
                  user_id: p.user_id,
                  title: p.title,
                  slug: p.slug,
                  excerpt: p.excerpt,
                  cover_image: p.cover_image,
                  content: null,
                  created_at: p.created_at,
                  like_count: null,
                  dislike_count: null,
                }}
                authorName={(p as any).__authorName}
                authorAvatarUrl={(p as any).__authorAvatar}
              />
            ))}
          </ul>
        )}
      </section>

      {/* 퀵 링크 */}
      <section className="border rounded-lg p-5">
        <h2 className="text-lg font-bold mb-3">빠른 이동</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/posts" className={outlineButton}>포스트</Link>
          <ProtectedLink href="/write" className={outlineButton} ariaLabel="글 작성">글 작성</ProtectedLink>
          <Link href="/rss.xml" className={outlineButton}>RSS</Link>
          <Link href="/atom.xml" className={outlineButton}>Atom</Link>
        </div>
      </section>

      {/* 소개 박스 */}
      <section className="border rounded-lg p-5">
        <h2 className="text-lg font-bold mb-4">소개</h2>
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src="https://hyueqldwgertapmhmmni.supabase.co/storage/v1/object/public/blog-images/IMG_20250916_085108_380.jpg"
              alt="프로필 이미지"
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="space-y-2">
            <p className="text-base text-gray-700">{TAGLINE}. 라키라키는 담백한 레이아웃으로 글 중심 경험을 제공합니다.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              <SocialLink href="mailto:salad20c@gmail.com" icon={<Mail size={16} />} label="Email" />
              <SocialLink href="https://www.threads.net/@ilovemom_2026" icon={<AtSign size={16} />} label="Threads" />
              <SocialLink href="https://cafe.naver.com/catch10man" icon={<Globe size={16} />} label="키움캐치" />
            </div>
          </div>
        </div>
      </section>

      {/* 정보 아코디언 섹션 제거 */}
    </main>
  );
}

// 서버 함수 기반 StatsBar 제거: 클라이언트 컴포넌트로 대체
