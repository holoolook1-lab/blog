import PostCard from '@/components/blog/PostCard';
import { TEST_POSTS } from '@/lib/local-test-data';

export default function ServerPreviewPosts() {
  // 서버프리뷰 환경에서는 바로 테스트 데이터 사용
  const posts = TEST_POSTS.slice(0, 6).map((p, i) => ({
    ...p,
    __authorName: '테스트 작성자',
    __authorAvatar: '',
  }));

  if (!posts || posts.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">서버프리뷰 테스트 글</h2>
        <span className="text-xs text-gray-500">서버프리뷰 전용 데이터</span>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2" aria-label="서버프리뷰 테스트 포스트 목록">
        {posts.map((p: any, i: number) => (
          <li aria-label={p.title} key={p.id || `${p.slug}-${i}`}>
            <PostCard
              post={{
                id: p.id,
                user_id: p.user_id || 'preview',
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
              authorName={p.__authorName}
              authorAvatarUrl={p.__authorAvatar}
              priority={i === 0}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}