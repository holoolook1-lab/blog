import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getServerSupabase } from '@/lib/supabase/server';
import CommentSection from '@/components/blog/CommentSection';
import CommentList from '@/components/blog/CommentList';
import ShareButtons from '@/components/blog/ShareButtons';
import { getLocale } from '@/i18n/getLocale';
import { prefixPath } from '@/lib/i18n/link';
import ReportForm from '@/components/blog/ReportForm';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { computeReadingMinutes } from '@/lib/utils/reading';
import { formatDateKR } from '@/lib/date';
// 커버 이미지를 본문에서 제거하면서 관련 이미지 유틸 import 삭제
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
// 슬러그는 라우터에서 디코드된 상태로 전달되므로 추가 정규화는 생략합니다.
import { getPublicSiteMeta, buildPostUrl } from '@/lib/site';
import BackToTop from '@/components/ui/BackToTop';
import ActionBar from '@/components/blog/ActionBar';
import EditLinkClient from '@/components/blog/EditLinkClient';
import ProfileCard from '@/components/profile/ProfileCard';
import { getPostBySlugCached } from '@/lib/cache/posts';

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
    .maybeSingle();
  const { url: site, name: siteName } = getPublicSiteMeta();
  const title = post?.title || '포스트';
  const description = post?.excerpt || '';
  const images = post?.cover_image ? [`${post.cover_image}`] : undefined;
  return {
    title,
    description,
    alternates: { canonical: buildPostUrl(site, cleanSlug), languages: { en: `/en/posts/${cleanSlug}`, ko: `/posts/${cleanSlug}` } },
    openGraph: {
      type: 'article',
      title,
      description,
      url: buildPostUrl(site, cleanSlug),
      images,
      siteName: siteName || '블로그',
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

export const revalidate = 600;

type Params = { params: Promise<{ slug: string }> };

export default async function PostDetailPage({ params }: Params) {
  // 서버 쿠키 기반 Supabase: 작성자는 비공개 글도 조회 가능
  const supabase = (await getServerSupabase()) || createPublicSupabaseClient();
  if (!supabase) {
    return (
      <main id="main" role="main" aria-labelledby="post-title" className="max-w-3xl mx-auto p-4 space-y-4">
        <h1 id="post-title" className="text-2xl font-bold">포스트</h1>
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
  let post: any = await getPostBySlugCached(cleanSlug);
  if (!post) {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', cleanSlug)
      .maybeSingle();
    post = data || null;
  }

  if (!post) return notFound();

  const safe = sanitizeHtml(post.content);
  const { url: site, name: siteName } = getPublicSiteMeta();
  // 상세 페이지에서 임베드 자동 재생 파라미터 주입
  const enableAutoplay = (html: string) => {
    if (!html) return '';
    // 영상/임베드가 없으면 조기 반환하여 문자열 처리 비용을 절감
    if (!/(<iframe|<video|youtube\.com|vimeo\.com|dailymotion\.com|twitch\.tv|naver\.com|facebook\.com)/i.test(html)) {
      return html;
    }
    let out = html;
    const siteUrl = site;
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
    // 접근성: title 속성이 없는 모든 iframe에 기본 제목 추가
    out = out.replace(/<iframe[^>]*>/gi, (m) => {
      return /\btitle\s*=\s*["'][^"']*["']/.test(m) ? m : m.replace('<iframe', '<iframe title="임베드 콘텐츠"');
    });
    return out;
  };
  const safeWithAutoplay = enableAutoplay(safe);
  // 공통 메타 유틸에서 가져온 site/siteName 사용

  // 읽기 시간 계산(대략 200 wpm)
  const readingMinutes = computeReadingMinutes(safe);

  // 이전/다음 글 조회 제거: 초기 응답 시간을 줄이기 위해 생략합니다.

  // 작성자 활동 통계 조회 제거: 중복 집계를 피하고 초기 응답 시간을 줄입니다.

  return (
    <article id="main" className="max-w-5xl mx-auto p-4 space-y-4" aria-labelledby="post-title">
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
            author: post.user_id ? { '@type': 'Person', name: post.user_id } : undefined,
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': buildPostUrl(site, cleanSlug),
            },
            publisher: {
              '@type': 'Organization',
              name: siteName,
              logo: { '@type': 'ImageObject', url: `${site}/opengraph-image` },
            },
            isPartOf: {
              '@type': 'WebSite',
              url: site,
              name: siteName,
            },
          }),
        }}
      />
      {/* 모바일 상단 프로필 */}
      <div className="block lg:hidden">
        <ProfileCard authorId={post.user_id} />
      </div>
      {/* 요청에 따라 본문 상단 커버 이미지를 렌더링하지 않습니다 */}
      <div className="lg:grid lg:grid-cols-[240px_1fr] lg:gap-8">
        {/* 데스크탑 좌측 고정 프로필 */}
        <aside className="hidden lg:block">
          <ProfileCard authorId={post.user_id} />
        </aside>
        <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 id="post-title" className="text-3xl font-bold">{post.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded border ${post.published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {post.published ? '공개' : '비공개'}
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
          <Link
            href={`/posts?heading=${encodeURIComponent(post.heading)}`}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label={`카테고리 ${post.heading} 글 보기`}
          >
            #{post.heading}
          </Link>
        </div>
      )}
      <div className="pt-4">
        <ShareButtons url={`${site}${prefixPath(await getLocale())}/posts/${slug}`} title={post.title} />
        {/* 신고 상세폼: 공유 영역 아래에 접기/펼치기 형태로 배치 */}
        <ReportForm slug={slug} />
      </div>
      </div>{/* /content column */}
      </div>{/* /grid */}
      {/* 이전/다음 내비게이션 제거: 초기 로딩 성능 최적화 */}
      <section className="mt-8">
        <h2 className="font-semibold">댓글</h2>
        <CommentSection postId={post.id} />
      </section>
      <BackToTop />
    </article>
  );
}
// 중복 정의 제거: 페이지의 ISR 간격은 상단에서 300초로 설정됨
