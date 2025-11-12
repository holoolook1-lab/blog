import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getServerSupabase } from '@/lib/supabase/server';
import CommentSection from '@/components/blog/CommentSection';
import CommentList from '@/components/blog/CommentList';
import ShareButtons from '@/components/blog/ShareButtons';
import ReportForm from '@/components/blog/ReportForm';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { computeReadingMinutes } from '@/lib/utils/reading';
import { formatDateKR } from '@/lib/date';
import Image from 'next/image';
import { getOptimizedImageUrl, defaultSizes } from '@/lib/utils/image';
import { getShimmerDataURL } from '@/lib/utils/shimmer';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { normalizeSlug } from '@/lib/slug';
import BackToTop from '@/components/ui/BackToTop';
import ActionBar from '@/components/blog/ActionBar';
import EditLinkClient from '@/components/blog/EditLinkClient';
import ProfileCard from '@/components/profile/ProfileCard';
import { Crown, Diamond, Medal } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const rawSlug = (slug || '').toString();
  let cleanSlug = rawSlug.trim();
  try { cleanSlug = decodeURIComponent(cleanSlug); } catch {}
  const supabase = createPublicSupabaseClient();
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, cover_image, created_at, updated_at')
    .eq('slug', cleanSlug)
    .single();
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const title = post?.title || '포스트';
  const description = post?.excerpt || '';
  const images = post?.cover_image ? [`${post.cover_image}`] : undefined;
  return {
    title,
    description,
    alternates: { canonical: `${site}/posts/${cleanSlug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${site}/posts/${cleanSlug}`,
      images,
      siteName: process.env.NEXT_PUBLIC_SITE_NAME || '블로그',
      locale: 'ko_KR',
      publishedTime: post?.created_at || undefined,
      modifiedTime: post?.updated_at || undefined,
    },
    twitter: post?.cover_image
      ? {
          card: 'summary_large_image',
          title,
          description,
          images,
        }
      : {
          card: 'summary_large_image',
          title,
          description,
        },
  };
}

export const revalidate = 300;

type Params = { params: Promise<{ slug: string }> };

export default async function PostDetailPage({ params }: Params) {
  // 서버 쿠키 기반 Supabase: 작성자는 비공개 글도 조회 가능
  const supabase = (await getServerSupabase()) || createPublicSupabaseClient();
  if (!supabase) {
    return (
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">포스트</h1>
        <p className="text-sm text-gray-600">환경변수 설정 후 콘텐츠가 표시됩니다.</p>
      </main>
    );
  }

  // 서버에서 인증 조회를 하지 않아 쿠키 어댑터 오류를 회피
  const user = null as unknown as { id: string } | null;

  const { slug } = await params;
  const rawSlug = (slug || '').toString();
  let cleanSlug = rawSlug.trim();
  try { cleanSlug = decodeURIComponent(cleanSlug); } catch {}
  cleanSlug = normalizeSlug(cleanSlug);
  const { data: post } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', cleanSlug)
    .single();

  if (!post) return notFound();

  const safe = sanitizeHtml(post.content);
  // 상세 페이지에서 임베드 자동 재생 파라미터 주입
  const enableAutoplay = (html: string) => {
    if (!html) return '';
    let out = html;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let parentHost = 'localhost';
    try {
      const u = new URL(siteUrl);
      parentHost = u.hostname;
    } catch {}
    // YouTube
    out = out.replace(/<iframe([^>]+)src=["']([^"']*youtube\.com\/embed\/[^"']+)["']([^>]*)>/gi, (m, pre, src, post) => {
      try {
        const u = new URL(src);
        const qs = new URLSearchParams(u.search);
        qs.set('autoplay', '1');
        qs.set('mute', '1');
        qs.set('playsinline', '1');
        u.search = `?${qs.toString()}`;
        return `<iframe${pre}src="${u.toString()}"${post}>`;
      } catch { return m; }
    });
    // Vimeo
    out = out.replace(/<iframe([^>]+)src=["']([^"']*player\.vimeo\.com\/video\/[^"']+)["']([^>]*)>/gi, (m, pre, src, post) => {
      try {
        const u = new URL(src);
        const qs = new URLSearchParams(u.search);
        qs.set('autoplay', '1');
        qs.set('muted', '1');
        u.search = `?${qs.toString()}`;
        return `<iframe${pre}src="${u.toString()}"${post}>`;
      } catch { return m; }
    });
    // Dailymotion
    out = out.replace(/<iframe([^>]+)src=["']([^"']*dailymotion\.com\/embed\/video\/[^"']+)["']([^>]*)>/gi, (m, pre, src, post) => {
      try {
        const u = new URL(src);
        const qs = new URLSearchParams(u.search);
        qs.set('autoplay', '1');
        qs.set('mute', '1');
        u.search = `?${qs.toString()}`;
        return `<iframe${pre}src="${u.toString()}"${post}>`;
      } catch { return m; }
    });
    // Twitch (parent 필요)
    out = out.replace(/<iframe([^>]+)src=["']([^"']*player\.twitch\.tv[^"']+)["']([^>]*)>/gi, (m, pre, src, post) => {
      try {
        const u = new URL(src);
        const qs = new URLSearchParams(u.search);
        if (!qs.get('parent')) qs.set('parent', parentHost);
        qs.set('autoplay', 'true');
        qs.set('muted', 'true');
        u.search = `?${qs.toString()}`;
        return `<iframe${pre}src="${u.toString()}"${post}>`;
      } catch { return m; }
    });
    // Naver TV
    out = out.replace(/<iframe([^>]+)src=["']([^"']*tv\.naver\.com\/embed\/[^"']+)["']([^>]*)>/gi, (m, pre, src, post) => {
      try {
        const u = new URL(src);
        const qs = new URLSearchParams(u.search);
        qs.set('autoplay', 'true');
        u.search = `?${qs.toString()}`;
        return `<iframe${pre}src="${u.toString()}"${post}>`;
      } catch { return m; }
    });
    // Facebook video plugin
    out = out.replace(/<iframe([^>]+)src=["']([^"']*facebook\.com\/plugins\/video\.php[^"']+)["']([^>]*)>/gi, (m, pre, src, post) => {
      try {
        const u = new URL(src);
        const qs = new URLSearchParams(u.search);
        qs.set('autoplay', '1');
        u.search = `?${qs.toString()}`;
        return `<iframe${pre}src="${u.toString()}"${post}>`;
      } catch { return m; }
    });
    // HTML5 <video>
    out = out.replace(/<video(?![^>]*autoplay)([^>]*)>/gi, '<video$1 autoplay muted playsinline>');
    return out;
  };
  const safeWithAutoplay = enableAutoplay(safe);
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || '블로그';

  // 읽기 시간 계산(대략 200 wpm)
  const readingMinutes = computeReadingMinutes(safe);

  // 이전/다음 글 조회 (created_at + id 타이브레이커)
  let prev: any | null = null;
  let next: any | null = null;
  // 1차: created_at 비교
  const { data: prevData1 } = await supabase
    .from('posts')
    .select('slug, title, id, created_at')
    .eq('published', true)
    .lt('created_at', post.created_at)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(1);
  if (prevData1 && prevData1.length) {
    prev = prevData1[0];
  } else {
    // 2차: 동일 시각에서 id 타이브레이커
    const { data: prevData2 } = await supabase
      .from('posts')
      .select('slug, title, id, created_at')
      .eq('published', true)
      .eq('created_at', post.created_at)
      .lt('id', post.id)
      .order('id', { ascending: false })
      .limit(1);
    prev = prevData2 && prevData2.length ? prevData2[0] : null;
  }

  const { data: nextData1 } = await supabase
    .from('posts')
    .select('slug, title, id, created_at')
    .eq('published', true)
    .gt('created_at', post.created_at)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(1);
  if (nextData1 && nextData1.length) {
    next = nextData1[0];
  } else {
    const { data: nextData2 } = await supabase
      .from('posts')
      .select('slug, title, id, created_at')
      .eq('published', true)
      .eq('created_at', post.created_at)
      .gt('id', post.id)
      .order('id', { ascending: true })
      .limit(1);
    next = nextData2 && nextData2.length ? nextData2[0] : null;
  }

  // 작성자 활동 통계로 레벨 아이콘 계산
  let authorScore = 0;
  let authorLevel: 'platinum' | 'gold' | 'silver' | 'bronze' = 'bronze';
  try {
    // 집계 뷰(profile_stats)를 우선 사용
    const { data: stat } = await supabase
      .from('profile_stats')
      .select('post_count, like_sum, level')
      .eq('user_id', post.user_id)
      .single();
    if (stat) {
      authorScore = ((stat as any)?.post_count || 0) * 2 + ((stat as any)?.like_sum || 0) * 1;
      authorLevel = (stat as any)?.level || 'bronze';
    } else {
      // 폴백: 직접 집계
      const { data: authorPosts } = await supabase
        .from('posts')
        .select('id, like_count')
        .eq('user_id', post.user_id)
        .eq('published', true);
      const postCount = (authorPosts || []).length;
      const likeSum = (authorPosts || []).reduce((sum: number, p: any) => sum + (p.like_count || 0), 0);
      authorScore = postCount * 2 + likeSum * 1;
      authorLevel = authorScore >= 1000 ? 'platinum' : authorScore >= 500 ? 'gold' : authorScore >= 100 ? 'silver' : 'bronze';
    }
  } catch {}

  return (
    <article id="main" className="max-w-5xl mx-auto p-4 space-y-4">
      {/* Article JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            datePublished: post.created_at,
            dateModified: post.updated_at,
            image: post.cover_image ? [post.cover_image] : undefined,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${site}/posts/${slug}`,
            },
            publisher: {
              '@type': 'Organization',
              name: siteName,
            },
          }),
        }}
      />
      {/* 모바일 상단 프로필 */}
      <div className="block lg:hidden">
        <ProfileCard authorId={post.user_id} />
      </div>
      {post.cover_image && (
        <div className="relative w-full aspect-[16/9] rounded overflow-hidden">
          <Image
            src={getOptimizedImageUrl(post.cover_image, { width: 1024, quality: 85, format: 'webp' })}
            alt={post.title}
            fill
            sizes={defaultSizes.detail}
            className="object-cover"
            priority
            placeholder="blur"
            blurDataURL={getShimmerDataURL(16, 9)}
          />
        </div>
      )}
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        {/* 데스크탑 좌측 고정 프로필 */}
        <aside className="hidden lg:block">
          <ProfileCard authorId={post.user_id} />
        </aside>
        <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded border ${post.published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {post.published ? '공개' : '비공개'}
          </span>
          {/* 레벨/배지 표시: 모든 등급 노출 */}
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border bg-gray-50">
            {authorLevel === 'platinum' ? <Diamond size={14} /> : authorLevel === 'gold' ? <Crown size={14} /> : <Medal size={14} />}
            {authorLevel === 'platinum' ? '플래티넘' : authorLevel === 'gold' ? '골드' : authorLevel === 'silver' ? '실버' : '브론즈'}
          </span>
        </div>
        {/* 작성자에게만 편집 링크 노출: 클라이언트에서 인증 확인 */}
        <EditLinkClient authorId={post.user_id} slug={slug} />
      </div>
      <p className="text-sm text-gray-600">
        {formatDateKR(post.created_at)} · {readingMinutes}분 읽기
      </p>
      <ActionBar postId={post.id} initialLikes={post.like_count || 0} initialDislikes={post.dislike_count || 0} className="pt-3" />
      <div className="prose mt-4" dangerouslySetInnerHTML={{ __html: safeWithAutoplay }} />
      {post.heading && (
        <div className="pt-4">
          <Link href={`/posts?heading=${encodeURIComponent(post.heading)}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-gray-50 hover:bg-gray-100">
            #{post.heading}
          </Link>
        </div>
      )}
      <div className="pt-4">
        <ShareButtons url={`${site}/posts/${slug}`} title={post.title} />
        {/* 신고 상세폼: 공유 영역 아래에 접기/펼치기 형태로 배치 */}
        <ReportForm slug={slug} />
      </div>
      </div>{/* /content column */}
      </div>{/* /grid */}
      <nav className="flex justify-between pt-6">
        <div>
          {prev ? (
        <Link href={`/posts/${encodeURIComponent(prev.slug)}`} className="text-sm text-gray-700 link-gauge">
              ← {prev.title}
            </Link>
          ) : <span />}
        </div>
        <div>
          {next ? (
        <Link href={`/posts/${encodeURIComponent(next.slug)}`} className="text-sm text-gray-700 link-gauge">
              {next.title} →
            </Link>
          ) : <span />}
        </div>
      </nav>
      <section className="mt-8">
        <h2 className="font-semibold">댓글</h2>
        {!user && (
          <p className="text-sm text-gray-600 mt-1">
            댓글 작성은 로그인 후 가능합니다.{' '}
        <Link href={`/login?redirect=/posts/${slug}`} className="link-gauge">로그인하기</Link>
          </p>
        )}
        <CommentSection postId={post.id} />
      </section>
      <BackToTop />
    </article>
  );
}
// 중복 정의 제거: 페이지의 ISR 간격은 상단에서 300초로 설정됨
