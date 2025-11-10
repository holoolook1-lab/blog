"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from '@/components/blog/PostCard';
import { supabase } from '@/lib/supabase/client';

export default function BookmarksPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const run = async () => {
      const { data: userResp } = await supabase.auth.getUser();
      const user = userResp?.user || null;
      if (!user) {
        setUserId(null);
        // 로그인 필요 시 자동 리디렉션으로 UX 개선
        router.replace('/login?redirect=/bookmarks');
        setLoading(false);
        return;
      }
      setUserId(user.id);
      const { data } = await supabase
        .from('bookmarks')
        .select('post_id, created_at, posts(title, slug, cover_image, excerpt, created_at)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setBookmarks((data || []).filter((b: any) => b.posts));
      setLoading(false);
    };
    run();
  }, [router]);

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">스크랩</h1>
      {loading ? (
        <p className="text-sm text-gray-600">불러오는 중…</p>
      ) : userId === null ? (
        <>
          <p className="text-sm text-gray-600">로그인 후 이용 가능합니다.</p>
          <Link href="/login?redirect=/bookmarks" className="underline">로그인하기</Link>
        </>
      ) : bookmarks.length === 0 ? (
        <div className="p-6 text-center space-y-2">
          <p className="text-sm text-gray-600">스크랩한 글이 없습니다.</p>
          <Link href="/posts" className="inline-flex items-center justify-center rounded px-3 py-1 text-sm hover:bg-gray-50">글 둘러보기</Link>
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
          <ul className="grid gap-6">
            {displayed.map((b: any) => (
              <PostCard
                key={b.post_id}
                variant="borderless"
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
          </ul>
        </>
      )}
    </main>
  );
}
