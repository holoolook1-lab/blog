import Link from 'next/link';
import ProtectedLink from '@/components/common/ProtectedLink';
import { outlineButtonSmall } from '@/lib/styles/ui';
import Image from 'next/image';
import { getOptimizedImageUrl, defaultSizes } from '@/lib/utils/image';
import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getPublicPostsCached } from '@/lib/cache/posts';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import BackToTop from '@/components/ui/BackToTop';
import PostsSearch from '@/components/blog/PostsSearch';
import PostCard from '@/components/blog/PostCard';
import { getTranslations } from 'next-intl/server';
import { getLocale } from '@/i18n/getLocale';
import { prefixPath } from '@/lib/i18n/link';

export const revalidate = 60;

export default async function PostsPage({ searchParams }: { searchParams?: Promise<{ page?: string; q?: string; heading?: string }> }) {
  const t = await getTranslations('posts');
  const supabase = createPublicSupabaseClient();
  let posts: any[] | null = null;
  let totalCount = 0;
  const sp = (await searchParams) || {};
  const page = Number(sp.page || '1');
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const pageSize = 20;
  const q = (sp.q || '').trim();
  const heading = (sp.heading || '').trim();
  const locale = await getLocale();
  const prefix = prefixPath(locale);
  if (supabase) {
    const { posts: cached, totalCount: tc } = await getPublicPostsCached({ page: safePage, pageSize, q, heading });
    posts = cached;
    totalCount = tc;
  } else {
    posts = [];
  }

  // 빈 상태 처리
  if (!posts || posts.length === 0) {
    return (
      <main className="max-w-3xl mx-auto p-4 space-y-4" role="main" aria-labelledby="posts-title">
        <h1 id="posts-title" className="text-2xl font-bold">{t('title')}</h1>
        <PostsSearch />
        {q ? (
          <div className="border rounded p-6 text-center space-y-2">
            <p className="text-sm text-gray-600">{t('searchNone', { q })}</p>
            <Link href={`${prefix}/posts`} className={outlineButtonSmall}>{t('resetSearch')}</Link>
          </div>
        ) : (
          <div className="border rounded p-6 text-center space-y-2">
            <p className="text-sm text-gray-600">{t('initialNone')}</p>
            <ProtectedLink href={`${prefix}/write`} className={outlineButtonSmall} ariaLabel={t('write')}>
              {t('write')}
            </ProtectedLink>
          </div>
        )}
      </main>
    );
  }

  return (
    <main id="main" className="max-w-3xl mx-auto p-4 space-y-4" role="main" aria-labelledby="posts-title">
      <h1 id="posts-title" className="text-2xl font-bold">{t('title')}</h1>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600" aria-live="polite" role="status">
          {q ? (
            <>{t('currentSearch', { q })} · {t('results', { count: totalCount })}</>
          ) : heading ? (
            <>{t('category', { heading })} · {t('results', { count: totalCount })}</>
          ) : (
            <>{t('all')} · {t('results', { count: totalCount || (posts?.length || 0) })}</>
          )}
        </p>
        <PostsSearch />
      </div>
      <ul className="grid gap-6 sm:grid-cols-2" aria-label="포스트 목록">
        {(posts || []).map((p, i) => (
          <li aria-label={p.title} key={p.id}>
            <PostCard post={p} variant="polaroid" authorName={(p as any).__authorName} authorAvatarUrl={(p as any).__authorAvatar} priority={i === 0} />
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between pt-2">
        {safePage > 1 ? (
          <Link href={`${prefix}/posts?page=${safePage - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${heading ? `&heading=${encodeURIComponent(heading)}` : ''}`} className="text-sm link-gauge">{t('prev')}</Link>
        ) : <span />}
        {(posts || []).length === pageSize ? (
          <Link href={`${prefix}/posts?page=${safePage + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${heading ? `&heading=${encodeURIComponent(heading)}` : ''}`} className="text-sm link-gauge">{t('more')}</Link>
        ) : (
          <span className="text-sm text-gray-500">{t('last')}</span>
        )}
      </div>
      <BackToTop />
    </main>
  );
}
