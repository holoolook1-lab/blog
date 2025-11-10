import Link from 'next/link';
import Image from 'next/image';
import { getOptimizedImageUrl, defaultSizes } from '@/lib/utils/image';
import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import BackToTop from '@/components/ui/BackToTop';
import PostsSearch from '@/components/blog/PostsSearch';
import PostCard from '@/components/blog/PostCard';

export const revalidate = 60;

export default async function PostsPage({ searchParams }: { searchParams?: Promise<{ page?: string; q?: string; heading?: string }> }) {
  const supabase = createPublicSupabaseClient();
  let posts: any[] | null = null;
  let totalCount = 0;
  const sp = (await searchParams) || {};
  const page = Number(sp.page || '1');
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const pageSize = 20;
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;
  const q = (sp.q || '').trim();
  const heading = (sp.heading || '').trim();
  if (supabase) {
    let query = supabase
      .from('posts')
      .select('id, title, slug, excerpt, cover_image, created_at, content, like_count, dislike_count, heading')
      .eq('published', true);
    if (q) {
      const like = `%${q}%`;
      query = query.or(`title.ilike.${like},content.ilike.${like}`);
    }
    // 머리말 컬럼이 존재하는 경우만 필터 적용 (오류 시 폴백)
    let data: any[] | null = null;
    let err: any = null;
    if (heading) {
      const { data: filtered, error } = await query.eq('heading', heading)
        .order('created_at', { ascending: false })
        .range(from, to);
      data = filtered || null;
      err = error;
      if (err) {
        const { data: noFilter } = await supabase
          .from('posts')
          .select('id, title, slug, excerpt, cover_image, created_at, content, like_count, dislike_count')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .range(from, to);
        data = noFilter || null;
      }
    } else {
      const { data: all } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      data = all || null;
    }
    posts = data || [];

    // 총 결과 개수 조회
    let countQuery = supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('published', true);
    if (q) {
      const like = `%${q}%`;
      countQuery = countQuery.or(`title.ilike.${like},content.ilike.${like}`);
    }
    if (heading) {
      const { count, error } = await countQuery.eq('heading', heading);
      if (!error) totalCount = count || 0;
      else {
        const { count: c } = await supabase
          .from('posts')
          .select('id', { count: 'exact', head: true })
          .eq('published', true);
        totalCount = c || 0;
      }
    } else {
      const { count } = await countQuery;
      totalCount = count || 0;
    }
  } else {
    posts = [];
  }

  // 빈 상태 처리
  if (!posts || posts.length === 0) {
    return (
      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">포스트</h1>
        <PostsSearch />
        {q ? (
          <div className="border rounded p-6 text-center space-y-2">
            <p className="text-sm text-gray-600">검색어 "{q}"에 대한 결과가 없습니다.</p>
            <Link href="/posts" className="inline-flex items-center justify-center border rounded px-3 py-1 text-sm hover:bg-gray-50">검색 초기화</Link>
          </div>
        ) : (
          <div className="border rounded p-6 text-center space-y-2">
            <p className="text-sm text-gray-600">아직 공개된 포스트가 없습니다.</p>
            <p className="text-sm text-gray-600">첫 글을 작성해보세요!</p>
            <Link href="/write" className="inline-flex items-center justify-center border rounded px-3 py-1 text-sm hover:bg-gray-50">글 작성하기</Link>
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">포스트</h1>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600" aria-live="polite">
          {q ? (
            <>현재 검색어: <span className="font-medium text-gray-800">{q}</span> · 결과: {totalCount}건</>
          ) : heading ? (
            <>카테고리: <span className="font-medium text-gray-800">{heading}</span> · 결과: {totalCount}건</>
          ) : (
            <>전체 글 · 총 {totalCount || (posts?.length || 0)}건</>
          )}
        </p>
        <PostsSearch />
      </div>
      <ul className="grid gap-6">
        {(posts || []).map((p) => (
          <PostCard key={p.id} post={p} variant="borderless" />
        ))}
      </ul>
      <div className="flex items-center justify-between pt-2">
        {safePage > 1 ? (
          <Link href={`/posts?page=${safePage - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${heading ? `&heading=${encodeURIComponent(heading)}` : ''}`} className="text-sm underline">이전</Link>
        ) : <span />}
        {(posts || []).length === pageSize ? (
          <Link href={`/posts?page=${safePage + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}${heading ? `&heading=${encodeURIComponent(heading)}` : ''}`} className="text-sm underline">더 보기</Link>
        ) : (
          <span className="text-sm text-gray-500">마지막 페이지</span>
        )}
      </div>
      <BackToTop />
    </main>
  );
}
