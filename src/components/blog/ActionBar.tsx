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
  const { useTranslations } = require('next-intl');
  const t = useTranslations('comments');
  
  return (
    <div 
      className={`flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200 ${className}`} 
      role="group" 
      aria-label={t('actionGroup') || '게시글 상호작용'}
    >
      <div className="flex items-center gap-2">
        <VoteButtons 
          postId={postId} 
          initialLikes={initialLikes} 
          initialDislikes={initialDislikes} 
        />
        <BookmarkButton postId={postId} />
      </div>
    </div>
  );
}
