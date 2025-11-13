import Link from 'next/link';
import Image from 'next/image';
import { getOptimizedImageUrl, defaultSizes } from '@/lib/utils/image';
import { getShimmerDataURL } from '@/lib/utils/shimmer';
import { computeReadingMinutes } from '@/lib/utils/reading';
import { formatDateKR } from '@/lib/date';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import ActionBar from '@/components/blog/ActionBar';
import AutoPlayEmbed from '@/components/media/AutoPlayEmbed';

type Post = {
  id: string;
  user_id?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image?: string | null;
  content?: string | null;
  created_at: string;
  like_count?: number | null;
  dislike_count?: number | null;
};

export default function PostCard({ post, variant = 'borderless', showExcerpt = true, authorName, authorAvatarUrl, priority = false }: { post: Post; variant?: 'borderless' | 'card' | 'polaroid'; showExcerpt?: boolean; authorName?: string; authorAvatarUrl?: string; priority?: boolean }) {
  const safe = sanitizeHtml(post.content || '');
  const mins = computeReadingMinutes(safe);
  const isPolaroid = variant === 'polaroid';
  const wrapperClass = isPolaroid
    ? 'rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow'
    : variant === 'card'
      ? 'border rounded overflow-hidden'
      : '';
  // 본문 내 첫 비디오/임베드 추출
  const extractFirstVideo = () => {
    const iframeMatch = safe.match(/<iframe[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (iframeMatch) {
      const src = iframeMatch[1];
      // 지원하는 호스트만 카드에 표시 (YouTube/Vimeo/Dailymotion/Twitch/NaverTV/TikTok/Instagram/Facebook)
      if (/(youtube\.com|youtu\.be|player\.vimeo\.com|dailymotion\.com\/embed|player\.twitch\.tv|tv\.naver\.com\/embed|tiktok\.com\/embed|instagram\.com\/.*\/embed|facebook\.com\/plugins\/video\.php)/i.test(src)) {
        return { type: 'iframe' as const, src };
      }
    }
    const videoMatch = safe.match(/<video[^>]+src=["']([^"']+)["'][^>]*>/i) || safe.match(/<source[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (videoMatch) {
      const src = videoMatch[1];
      if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(src)) {
        return { type: 'file' as const, src };
      }
    }
    // 일반 텍스트/링크 형태의 유튜브 URL을 임베드로 변환
    const ytId = (() => {
      const m1 = safe.match(/https?:\/\/(?:www\.)?youtube\.com\/watch\?[^"'\s]*v=([A-Za-z0-9_-]{11})/i);
      if (m1 && m1[1]) return m1[1];
      const m2 = safe.match(/https?:\/\/(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})/i);
      if (m2 && m2[1]) return m2[1];
      const m3 = safe.match(/https?:\/\/(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/i);
      if (m3 && m3[1]) return m3[1];
      return null;
    })();
    if (ytId) {
      return { type: 'iframe' as const, src: `https://www.youtube.com/embed/${ytId}` };
    }
    return null;
  };
  const firstVideo = extractFirstVideo();
  // 자동 재생용 src 구성 (음소거/인라인)
  const toAutoplaySrc = (src: string) => {
    try {
      const u = new URL(src);
      const host = u.hostname.replace(/^www\./, '');
      const addQS = (params: Record<string, string>) => {
        const qs = new URLSearchParams(u.search);
        for (const [k, v] of Object.entries(params)) qs.set(k, v);
        u.search = `?${qs.toString()}`;
        return u.toString();
      };
      if (host.includes('youtube.com')) {
        return addQS({ autoplay: '1', mute: '1', playsinline: '1' });
      }
      if (host.includes('vimeo.com')) {
        return addQS({ autoplay: '1', muted: '1' });
      }
      if (host.includes('dailymotion.com')) {
        return addQS({ autoplay: '1', mute: '1' });
      }
      if (host.includes('twitch.tv')) {
        // parent는 런타임 도메인 필요하지만 카드에서는 생략 가능(이미 에디터에서 설정됨 가정)
        return addQS({ autoplay: 'true', muted: 'true' });
      }
      if (host.includes('tiktok.com')) {
        // TikTok embed v2는 자동재생 파라미터 미지원 - 그대로 반환
        return src;
      }
      if (host.includes('naver.com')) {
        return addQS({ autoplay: 'true' });
      }
      if (host.includes('facebook.com')) {
        return addQS({ autoplay: '1' });
      }
      if (host.includes('instagram.com')) {
        // Instagram은 공식 embed에 autoplay 파라미터 미지원
        return src;
      }
      return src;
    } catch {
      return src;
    }
  };
  const getAspectClass = (src: string) => /tiktok\.com\/embed|instagram\.com\/.*\/embed/i.test(src) ? 'aspect-[9/16]' : 'aspect-[16/9]';
  // 요약: excerpt가 없으면 본문을 태그 제거 후 140자 내로 절단
  const summary = (() => {
    if (post.excerpt) return post.excerpt as string;
    const text = safe.replace(/<[^>]+>/g, ' ');
    const trimmed = text.replace(/\s+/g, ' ').trim();
    return trimmed.length > 140 ? trimmed.slice(0, 140) + '…' : trimmed;
  })();
  return (
    <article className={wrapperClass} aria-labelledby={`card-title-${post.id}`}>
      {/* 카드 내부 프로필 헤더 */}
      {(authorName || authorAvatarUrl) && (
        <div className={isPolaroid ? 'p-4 md:p-5' : 'p-4 md:p-5'}>
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden border bg-gray-100">
              {authorAvatarUrl ? (
                <Image
                  src={getOptimizedImageUrl(authorAvatarUrl, { width: 36, quality: 80, format: 'webp' })}
                  alt={authorName || '작성자'}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{authorName || '작성자'}</p>
              <p className="text-[11px] text-gray-500">{formatDateKR(post.created_at)} · {mins}분 읽기</p>
            </div>
          </div>
        </div>
      )}
      {firstVideo ? (
        isPolaroid ? (
          <div className="p-3">
            <div className={`relative w-full ${getAspectClass(firstVideo.src)} bg-white border rounded-lg shadow-sm overflow-hidden`}>
              <AutoPlayEmbed type={firstVideo.type} src={toAutoplaySrc(firstVideo.src)} className="absolute inset-0 w-full h-full polaroid-photo" />
            </div>
          </div>
        ) : (
          <AutoPlayEmbed type={firstVideo.type} src={toAutoplaySrc(firstVideo.src)} className={`relative w-full ${getAspectClass(firstVideo.src)}`} />
        )
      ) : post.cover_image && (
        isPolaroid ? (
          <Link href={`/posts/${post.slug}`} aria-label={post.title} className="focus:outline-none focus:ring-2 focus:ring-black rounded">
            <div className="p-3">
              <div className="relative w-full aspect-[16/9] bg-white border rounded-lg shadow-sm overflow-hidden">
                <Image
                  src={getOptimizedImageUrl(post.cover_image, { width: 768, quality: 80, format: 'webp' })}
                  alt={post.title}
                  fill
                  sizes={defaultSizes.list}
                  className="object-cover polaroid-photo"
                  placeholder="blur"
                  blurDataURL={getShimmerDataURL(16, 9)}
                  priority={priority}
                />
              </div>
            </div>
          </Link>
        ) : (
          <Link href={`/posts/${post.slug}`} aria-label={post.title} className="focus:outline-none focus:ring-2 focus:ring-black rounded">
            <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden">
              <Image
                src={getOptimizedImageUrl(post.cover_image, { width: 768, quality: 80, format: 'webp' })}
                alt={post.title}
                fill
                sizes={defaultSizes.list}
                className="object-cover"
                placeholder="blur"
                blurDataURL={getShimmerDataURL(16, 9)}
                priority={priority}
              />
            </div>
          </Link>
        )
      )}
      <div className={isPolaroid ? 'p-4 md:p-5' : 'p-4 md:p-5'}>
          <Link id={`card-title-${post.id}`} href={`/posts/${post.slug}`} className="text-lg font-semibold clamp-2 break-keep link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded">
          {post.title}
        </Link>
        {isPolaroid ? (
          <div className="mt-2 flex items-center justify-between">
            {!(authorName || authorAvatarUrl) ? (
              <p className="text-xs text-gray-500">{formatDateKR(post.created_at)} · {mins}분 읽기</p>
            ) : (
              <span />
            )}
            <ActionBar
              postId={post.id}
              initialLikes={post.like_count || 0}
              initialDislikes={post.dislike_count || 0}
              className="pt-0"
            />
          </div>
        ) : (
          <>
            {/* 날짜/작성자 정보는 헤더로 이동했으며, 헤더가 없는 경우만 본문 상단에 표시 */}
            {!(authorName || authorAvatarUrl) && (
              <p className="text-xs text-gray-500 mt-1">
                {formatDateKR(post.created_at)} · {mins}분 읽기
              </p>
            )}
            <ActionBar postId={post.id} initialLikes={post.like_count || 0} initialDislikes={post.dislike_count || 0} className="pt-2" />
          </>
        )}
        {showExcerpt && summary && <p className="text-sm text-gray-600 mt-2 break-words clamp-3">{summary}</p>}
      </div>
    </article>
  );
}
