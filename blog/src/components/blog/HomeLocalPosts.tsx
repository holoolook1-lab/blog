"use client";
import { useEffect, useState } from 'react';
import PostCard from '@/components/blog/PostCard';
import { getLocalTestPosts, initializeLocalTestData } from '@/lib/local-test-data';

export default function HomeLocalPosts() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    try { initializeLocalTestData(); } catch {}
    try {
      const list = getLocalTestPosts();
      setPosts(Array.isArray(list) ? list : []);
    } catch { setPosts([]); }
  }, []);

  if (!posts || posts.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">테스트 글</h2>
        <span className="text-xs text-gray-500">로컬 스토리지에서 불러옴</span>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2" aria-label="테스트 포스트 목록">
        {posts.map((p: any, i: number) => (
          <li aria-label={p.title} key={p.id || `${p.slug}-${i}`}>
            <PostCard
              post={{
                id: p.id,
                user_id: p.user_id || 'local',
                title: p.title,
                slug: p.slug,
                excerpt: p.excerpt || '',
                cover_image: p.cover_image || p.cover_url || null,
                content: p.content || '',
                created_at: p.created_at || new Date().toISOString(),
                like_count: p.likes_count ?? null,
                dislike_count: null,
              }}
              variant="polaroid"
              authorName={(p.author && p.author.username) || undefined}
              authorAvatarUrl={(p.author && p.author.avatar_url) || undefined}
              priority={i === 0}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

