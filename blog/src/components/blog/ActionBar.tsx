import VoteButtons from '@/components/blog/VoteButtons';
import BookmarkButton from '@/components/blog/BookmarkButton';

export default function ActionBar({
  postId,
  initialLikes = 0,
  initialDislikes = 0,
  className = '',
}: {
  postId: string;
  initialLikes?: number;
  initialDislikes?: number;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`} role="group" aria-label="글 액션">
      <VoteButtons postId={postId} initialLikes={initialLikes} initialDislikes={initialDislikes} />
      <BookmarkButton postId={postId} />
    </div>
  );
}
