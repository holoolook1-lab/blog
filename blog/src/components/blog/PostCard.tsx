import Link from 'next/link';
import Image from 'next/image';
import { getOptimizedImageUrl, defaultSizes } from '@/lib/utils/image';
import { computeReadingMinutes } from '@/lib/utils/reading';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import ActionBar from '@/components/blog/ActionBar';

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
  content?: string | null;
  created_at: string;
  like_count?: number | null;
  dislike_count?: number | null;
};

export default function PostCard({ post, variant = 'borderless', showExcerpt = true }: { post: Post; variant?: 'borderless' | 'card'; showExcerpt?: boolean }) {
  const safe = sanitizeHtml(post.content || '');
  const mins = computeReadingMinutes(safe);
  const wrapperClass = variant === 'card' ? 'border rounded overflow-hidden' : '';
  return (
    <li className={wrapperClass}>
      {post.cover_image && (
        <Link href={`/posts/${post.slug}`}>
          <div className="relative w-full aspect-[16/9]">
            <Image
              src={getOptimizedImageUrl(post.cover_image, { width: 768, quality: 80, format: 'webp' })}
              alt={post.title}
              fill
              sizes={defaultSizes.list}
              className="object-cover"
            />
          </div>
        </Link>
      )}
      <div className="p-4">
        <Link href={`/posts/${post.slug}`} className="text-lg font-semibold">
          {post.title}
        </Link>
        <p className="text-xs text-gray-500 mt-1">
          {new Date(post.created_at).toLocaleDateString('ko-KR')} · {mins}분 읽기
        </p>
        <ActionBar postId={post.id} initialLikes={post.like_count || 0} initialDislikes={post.dislike_count || 0} className="pt-2" />
        {showExcerpt && post.excerpt && <p className="text-sm text-gray-600 mt-2">{post.excerpt}</p>}
      </div>
    </li>
  );
}
