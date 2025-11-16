"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from '@/components/blog/PostCard';
import { outlineButtonSmall } from '@/lib/styles/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuthUser } from '@/lib/hooks/useAuthUser';

export default function BookmarksPage() {
  const router = useRouter();
  const { userId, loading } = useAuthUser();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [sort, setSort] = useState<'new' | 'old' | 'title'>('new');

  const displayed = [...bookmarks].sort((a, b) => {
    if (sort === 'title') {
      const ta = (a.posts?.title || '').toString();
      const tb = (b.posts?.title || '').toString();
      return ta.localeCompare(tb, 'ko');
    }
    const da = new Date(a.created_at).getTime();
    const db = new Date(b.created_at).getTime();
    return sort === 'new' ? db - da : da - db;
  });

  // 로그인 가드: 로딩 종료 후 미로그인이면 로그인 페이지로 이동
  useEffect(() => {
    if (!loading && userId === null) {
      router.replace('/login?redirect=/bookmarks');
      setListLoading(false);
    }
  }, [loading, userId, router]);

  // 데이터 로드: 사용자 존재 시에만 호출
  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      const { data } = await supabase
        .from('bookmarks')
        .select('post_id, created_at, posts(title, slug, cover_image, excerpt, created_at)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setBookmarks((data || []).filter((b: any) => b.posts));
      setListLoading(false);
    };
    load();
  }, [userId]);

  return (
    <main id="main" className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">스크랩</h1>
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-6 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded border p-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                <div className="mt-3 h-20 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : userId === null ? (
        <>
          <p className="text-sm text-gray-600">로그인 후 이용 가능합니다.</p>
        <Link href="/login?redirect=/bookmarks" className="link-gauge">로그인하기</Link>
        </>
      ) : listLoading ? (
        <div className="space-y-4" aria-busy="true" aria-live="polite">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="grid gap-6 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded border p-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="mt-2 h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                <div className="mt-3 h-20 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="p-6 text-center space-y-2">
          <p className="text-sm text-gray-600">스크랩한 글이 없습니다.</p>
          <Link href="/posts" className={outlineButtonSmall}>글 둘러보기</Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">총 {bookmarks.length}개</p>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              정렬
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as 'new' | 'old' | 'title')}
                className="border rounded px-2 py-1 text-sm"
                aria-label="스크랩 정렬"
              >
                <option value="new">최신순</option>
                <option value="old">오래된순</option>
                <option value="title">제목순</option>
              </select>
            </label>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {displayed.map((b: any) => (
              <PostCard
                key={b.post_id}
                variant="polaroid"
                showExcerpt={true}
                post={{
                  id: b.post_id,
                  title: b.posts.title,
                  slug: b.posts.slug,
                  cover_image: b.posts.cover_image,
                  excerpt: b.posts.excerpt,
                  content: null,
                  created_at: b.posts.created_at,
                  like_count: null,
                  dislike_count: null,
                }}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
