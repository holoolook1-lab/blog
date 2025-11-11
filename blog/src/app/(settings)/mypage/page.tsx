"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import PostCard from '@/components/blog/PostCard';

export default function MyPage() {
  const router = useRouter();
  const { userId } = useAuthUser();
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [recentBookmarks, setRecentBookmarks] = useState<any[]>([]);

  // 로그인 가드: 미로그인 시 로그인 페이지로 이동
  useEffect(() => {
    if (userId === null) {
      router.replace('/login?redirect=/mypage');
    }
  }, [userId, router]);

  // 사용자 정보 로드
  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      const { data } = await supabase.auth.getUser();
      const u = data?.user;
      setEmail(u?.email ?? null);
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single();
        setUsername((prof as any)?.username ?? null);
      } catch {}

      // 최근 작성(본인 글)
      try {
        const { data: posts } = await supabase
          .from('posts')
          .select('id, title, slug, cover_image, excerpt, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(0, 4);
        setRecentPosts(posts || []);
      } catch {}

      // 최근 스크랩
      try {
        const { data: bookmarks } = await supabase
          .from('bookmarks')
          .select('post_id, created_at, posts(title, slug, cover_image, excerpt, created_at)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(0, 4);
        setRecentBookmarks((bookmarks || []).filter((b: any) => b.posts));
      } catch {}
    };
    load();
  }, [userId]);

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <span className="text-xs text-gray-500">내 계정</span>
      </div>
      <section className="rounded border p-4 bg-white">
        <h2 className="text-lg font-semibold">내 정보</h2>
        <p className="text-sm text-gray-600">이메일: {email || '-'}</p>
        <p className="text-sm text-gray-600">닉네임: {username || '-'}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href="/profile" className="border rounded px-3 py-1 hover:bg-gray-50">프로필 변경</Link>
          <Link href="/bookmarks" className="border rounded px-3 py-1 hover:bg-gray-50">스크랩 보기</Link>
          <Link href="/write" className="border rounded px-3 py-1 hover:bg-gray-50">글 작성</Link>
        </div>
      </section>

      {/* 최근 작성 */}
      <section className="rounded border p-4 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 작성</h2>
          <Link href="/posts" className="text-sm text-gray-600 hover:underline">전체 보기</Link>
        </div>
        {recentPosts.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">아직 작성한 글이 없습니다. 첫 글을 작성해보세요.</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3">
            {recentPosts.map((p) => (
              <PostCard key={p.id} post={p} variant="borderless" />
            ))}
          </div>
        )}
      </section>

      {/* 최근 스크랩 */}
      <section className="rounded border p-4 bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">최근 스크랩</h2>
          <Link href="/bookmarks" className="text-sm text-gray-600 hover:underline">전체 보기</Link>
        </div>
        {recentBookmarks.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">스크랩한 글이 없습니다.</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3">
            {recentBookmarks.map((b) => (
              <PostCard key={b.post_id} post={b.posts} variant="borderless" />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
