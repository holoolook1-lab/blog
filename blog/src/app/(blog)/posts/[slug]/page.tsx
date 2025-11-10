import { createPublicSupabaseClient } from '@/lib/supabase/env';
import CommentSection from '@/components/blog/CommentSection';
import CommentList from '@/components/blog/CommentList';
import ShareButtons from '@/components/blog/ShareButtons';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { computeReadingMinutes } from '@/lib/utils/reading';
import Image from 'next/image';
import { getOptimizedImageUrl, defaultSizes } from '@/lib/utils/image';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BackToTop from '@/components/ui/BackToTop';
import ActionBar from '@/components/blog/ActionBar';
import EditLinkClient from '@/components/blog/EditLinkClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createPublicSupabaseClient();
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt, cover_image, created_at, updated_at')
    .eq('slug', slug)
    .single();
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const title = post?.title || '포스트';
  const description = post?.excerpt || '';
  const images = post?.cover_image ? [`${post.cover_image}`] : undefined;
  return {
    title,
    description,
    alternates: { canonical: `${site}/posts/${slug}` },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${site}/posts/${slug}`,
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

type Params = { params: { slug: string } };

export default async function PostDetailPage({ params }: Params) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hyueqldwgertapmhmmni.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5dWVxbGR3Z2VydGFwbWhtbW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQxOTksImV4cCI6MjA3ODI0MDE5OX0.tkQ1H7jzdX2AlIrZiUmiSGqYfjreCgcBv9fpMkEtsg0';
  const supabase = createClient(url, key);
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

  const { data: post } = await supabase
    .from('posts')
    .select('id, user_id, title, content, cover_image, created_at, updated_at, published, like_count, dislike_count')
    .eq('slug', params.slug)
    .single();

  if (!post) return notFound();

  const safe = sanitizeHtml(post.content);
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || '블로그';

  // 읽기 시간 계산(대략 200 wpm)
  const readingMinutes = computeReadingMinutes(safe);

  // 이전/다음 글 조회
  let prev: any | null = null;
  let next: any | null = null;
  const { data: prevData } = await supabase
    .from('posts')
    .select('slug, title')
    .eq('published', true)
    .lt('created_at', post.created_at)
    .order('created_at', { ascending: false })
    .limit(1);
  prev = prevData && prevData.length ? prevData[0] : null;
  const { data: nextData } = await supabase
    .from('posts')
    .select('slug, title')
    .eq('published', true)
    .gt('created_at', post.created_at)
    .order('created_at', { ascending: true })
    .limit(1);
  next = nextData && nextData.length ? nextData[0] : null;

  return (
    <article className="max-w-3xl mx-auto p-4 space-y-4">
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
              '@id': `${site}/posts/${params.slug}`,
            },
            publisher: {
              '@type': 'Organization',
              name: siteName,
            },
          }),
        }}
      />
      {post.cover_image && (
        <div className="relative w-full aspect-[16/9] rounded overflow-hidden">
          <Image
            src={getOptimizedImageUrl(post.cover_image, { width: 1024, quality: 85, format: 'webp' })}
            alt={post.title}
            fill
            sizes={defaultSizes.detail}
            className="object-cover"
            priority
          />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{post.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded border ${post.published ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {post.published ? '공개' : '비공개'}
          </span>
        </div>
        {/* 작성자에게만 편집 링크 노출: 클라이언트에서 인증 확인 */}
        <EditLinkClient authorId={post.user_id} slug={params.slug} />
      </div>
      <p className="text-sm text-gray-600">
        {new Date(post.created_at).toLocaleDateString('ko-KR')} · {readingMinutes}분 읽기
      </p>
      <ActionBar postId={post.id} initialLikes={post.like_count || 0} initialDislikes={post.dislike_count || 0} className="pt-3" />
      <div className="prose mt-4" dangerouslySetInnerHTML={{ __html: safe }} />
      <div className="pt-4"><ShareButtons url={`${site}/posts/${params.slug}`} title={post.title} /></div>
      <nav className="flex justify-between pt-6">
        <div>
          {prev ? (
            <Link href={`/posts/${prev.slug}`} className="text-sm text-gray-700 hover:underline">
              ← {prev.title}
            </Link>
          ) : <span />}
        </div>
        <div>
          {next ? (
            <Link href={`/posts/${next.slug}`} className="text-sm text-gray-700 hover:underline">
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
            <Link href={`/login?redirect=/posts/${params.slug}`} className="underline">로그인하기</Link>
          </p>
        )}
        <CommentSection postId={post.id} />
      </section>
      <BackToTop />
    </article>
  );
}
