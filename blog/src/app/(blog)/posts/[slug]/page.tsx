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
import { getLocalTestPost } from '@/lib/local-test-data';
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
import { generateNaverBlogPostMeta } from '@/lib/seo/naverSEO';
import { Badge } from '@/components/ui/index';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const rawSlug = (slug || '').toString();
  let cleanSlug = rawSlug.trim();
  try { cleanSlug = decodeURIComponent(cleanSlug); } catch {}
  const supabase = createPublicSupabaseClient();
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, cover_image, created_at, updated_at, content, author_id')
    .eq('slug', cleanSlug)
    .maybeSingle();
  
  const { url: site, name: siteName } = getPublicSiteMeta();
  const title = post?.title || '포스트';
  const description = post?.excerpt || '';
  const images = post?.cover_image ? [`${post.cover_image}`] : undefined;
  const postUrl = buildPostUrl(site, cleanSlug);
  
  // 네이버 SEO 메타데이터 생성
  const naverMeta = generateNaverBlogPostMeta({
    title,
    description,
    content: post?.content || '',
    author: '락이락이 블로그',
    publishDate: post?.created_at || new Date().toISOString(),
    modifyDate: post?.updated_at || undefined,
    tags: [], // 태그 시스템이 구현되면 추가
    category: '블로그 포스트',
    readingTime: post?.content ? computeReadingMinutes(post.content) : undefined,
    wordCount: post?.content ? post.content.split(/\s+/).length : undefined,
  });
  
  return {
    ...naverMeta,
    title,
    description,
    alternates: { 
      canonical: postUrl, 
      languages: { ko: `/posts/${cleanSlug}` } 
    },
    openGraph: {
      ...naverMeta.openGraph,
      type: 'article',
      title,
      description,
      url: postUrl,
      images,
      siteName: siteName || '블로그',
      locale: 'ko_KR',
      countryName: 'South Korea',
      publishedTime: post?.created_at || undefined,
      modifiedTime: post?.updated_at || undefined,
      section: '블로그',
      authors: ['락이락이 블로그'],
    },
    twitter: {
      ...naverMeta.twitter,
      card: 'summary_large_image',
      title,
      description,
      images,
      creator: '@rakiraki_blog',
      site: '@rakiraki_blog',
    },
    keywords: [
      '블로그', '한국블로그', '글쓰기', '커뮤니티',
      '게임화시스템', '출석체크', '업적시스템',
      '소셜미디어', '유튜브', '인스타그램',
      'PWA', '프로그레시브웹앱', '오프라인',
      ...(typeof naverMeta.keywords === 'string' ? naverMeta.keywords.split(', ') : naverMeta.keywords || [])
    ].join(', '),
  };
}

export const revalidate = 600;

type Params = { params: Promise<{ slug: string }> };

export default async function PostDetailPage({ params }: Params) {
  // 서버 사이드에서 인증 세션을 사용하지 않고 공개 클라이언트만 사용
  const supabase = createPublicSupabaseClient();
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
  
  // 로컬 테스트 데이터로 폴백
  if (!post) {
    try {
      post = getLocalTestPost(cleanSlug);
      console.warn('로컬 테스트 데이터 조회:', cleanSlug, post ? '성공' : '실패');
    } catch (error) {
      console.warn('로컬 테스트 데이터 조회 실패:', error);
    }
  }
  
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
  const convertPlainLinksToEmbeds = (html: string) => {
    if (!html) return '';
    let out = html;
    
    // YouTube URL 패턴들 - 더 정교한 매칭
    // 1. 일반 YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
    out = out.replace(/https?:\/\/(?:www\.)?youtube\.com\/watch\?[^"'\s]*v=([A-Za-z0-9_-]{11})(?:[^"'\s\w-]|$)/gi, (_m, id) => {
      return `<div class="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg my-6"><iframe src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1" class="absolute inset-0 w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
    });
    
    // 2. 짧은 YouTube URL: https://youtu.be/VIDEO_ID
    out = out.replace(/https?:\/\/(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})(?:[^"'\s\w-]|$)/gi, (_m, id) => {
      return `<div class="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg my-6"><iframe src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1" class="absolute inset-0 w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
    });
    
    // 3. YouTube Shorts: https://www.youtube.com/shorts/VIDEO_ID
    out = out.replace(/https?:\/\/(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})(?:[^"'\s\w-]|$)/gi, (_m, id) => {
      return `<div class="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg my-6"><iframe src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1" class="absolute inset-0 w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
    });
    
    // 4. YouTube 공유 링크: https://www.youtube.com/embed/VIDEO_ID
    out = out.replace(/https?:\/\/(?:www\.)?youtube\.com\/embed\/([A-Za-z0-9_-]{11})(?:[^"'\s\w-]|$)/gi, (_m, id) => {
      return `<div class="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg my-6"><iframe src="https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1" class="absolute inset-0 w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe></div>`;
    });
    
    out = out.replace(/https?:\/\/(?:player\.)?vimeo\.com\/video\/([0-9]+)/gi, (_m, id) => {
      return `<iframe src="https://player.vimeo.com/video/${id}" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    });
    out = out.replace(/https?:\/\/www\.dailymotion\.com\/video\/([A-Za-z0-9]+)/gi, (_m, id) => {
      return `<iframe src="https://www.dailymotion.com/embed/video/${id}" width="560" height="315" frameborder="0" allow="autoplay" allowfullscreen></iframe>`;
    });
    out = out.replace(/https?:\/\/(?:www\.)?twitch\.tv\/videos\/([0-9]+)/gi, (_m, id) => {
      const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      let parent = 'localhost';
      try { parent = new URL(site).hostname; } catch {}
      return `<iframe src="https://player.twitch.tv/?video=${id}&parent=${parent}" width="560" height="315" frameborder="0" allow="autoplay" allowfullscreen></iframe>`;
    });
    return out;
  };
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
  const safeWithAutoplay = enableAutoplay(convertPlainLinksToEmbeds(safe));
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
        <div className="space-y-6">
          {/* 포스트 헤더 */}
          <header className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* 카테고리 배지 */}
                {post.heading && (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/posts?heading=${encodeURIComponent(post.heading)}`}
                      aria-label={`카테고리 ${post.heading} 글 보기`}
                      className="text-black font-bold text-base hover:underline"
                    >
                      #{post.heading}
                    </Link>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                      post.published 
                        ? 'bg-white text-gray-700 border-gray-300' 
                        : 'bg-neutral-100 text-neutral-800 border-neutral-200'
                    }`}>
                      {post.published ? '공개' : '비공개'}
                    </span>
                  </div>
                )}
                
                {/* 제목 */}
                <h1 id="post-title" className="text-4xl font-bold text-neutral-900 leading-tight">
                  {post.title}
                </h1>
                
                {/* 메타 정보 */}
                <div className="flex items-center gap-4 text-sm text-neutral-600">
                  <time dateTime={post.created_at}>
                    {formatDateKR(post.created_at)}
                  </time>
                  <span>·</span>
                  <span>{readingMinutes}분 읽기</span>
                </div>
              </div>
              
              {/* 편집 버튼 */}
              <EditLinkClient authorId={post.user_id} slug={slug} />
            </div>
            
            {/* 액션 바 */}
            <ActionBar postId={post.id} initialLikes={post.like_count || 0} initialDislikes={post.dislike_count || 0} className="pt-4" />
          </header>

          {/* 본문 내용 */}
          <article className="prose prose-lg max-w-none">
            {safeWithAutoplay && safeWithAutoplay.trim() !== '' ? (
              <div 
                className="content-renderer" 
                dangerouslySetInnerHTML={{ __html: safeWithAutoplay }}
                style={{
                  lineHeight: '1.8',
                  fontSize: '1.125rem'
                }}
              />
            ) : (
              <div className="p-8 bg-neutral-50 rounded-xl border border-neutral-200 text-center">
                <div className="text-neutral-500 text-2xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-neutral-700 mb-2">콘텐츠가 준비되지 않았습니다</h3>
                <p className="text-neutral-600 mb-4">이 게시글의 본문 내용이 없습니다.</p>
                {post.excerpt && (
                  <blockquote className="text-neutral-500 italic border-l-4 border-neutral-300 pl-4 my-4">
                    {post.excerpt}
                  </blockquote>
                )}
                <p className="text-neutral-500 text-sm">게시글을 작성하거나 편집하여 내용을 추가해보세요.</p>
              </div>
            )}
          </article>

          {/* 상호작용 섹션 */}
          <footer className="space-y-6 pt-8 border-t border-neutral-200">
            {/* 공유하기 */}
            <div className="bg-neutral-50 rounded-xl p-6">
              <ShareButtons 
                url={`${site}${prefixPath(await getLocale())}/posts/${slug}`} 
                title={post.title} 
              />
            </div>

            {/* 신고하기 */}
            <div className="bg-neutral-50 rounded-xl p-6">
              <ReportForm slug={slug} />
            </div>
          </footer>
        </div>
      </div>{/* /grid */}
      {/* 이전/다음 내비게이션 제거: 초기 로딩 성능 최적화 */}
      <section className="mt-12">
        <CommentSection postId={post.id} />
      </section>
      <BackToTop />
    </article>
  );
}
// 중복 정의 제거: 페이지의 ISR 간격은 상단에서 300초로 설정됨
