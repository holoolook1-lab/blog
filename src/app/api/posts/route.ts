import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { revalidatePath, revalidateTag } from 'next/cache';
import { normalizeSlug, slugifyKorean, isValidSlug } from '@/lib/slug';
import { badRequest, unauthorized } from '@/lib/api';

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const body = await req.json();
  const { title, slug, content, excerpt, cover_image, published, heading } = body;
  // XSS 방지: 저장 전에 콘텐츠/요약 정화
  const safeContent = sanitizeHtml(content || '');
  const safeExcerpt = sanitizeHtml(excerpt || '');

  // 슬러그 정규화(서버 강제): 누락 시 제목에서 생성
  let s = normalizeSlug(slug || '');
  if (!s) s = slugifyKorean(title || '');
  if (!s) {
    s = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }
  if (!isValidSlug(s)) {
    return badRequest('invalid_slug');
  }

  // 커버 이미지가 비어있으면 본문 첫 이미지로 자동 설정
  let autoCover = cover_image as string | null | undefined;
  if (!autoCover) {
    const m = safeContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (m && m[1]) {
      autoCover = m[1];
    }
    // 이미지가 없으면 YouTube 링크로부터 썸네일 자동 설정
    if (!autoCover) {
      const y = safeContent.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
      if (y && y[1]) {
        autoCover = `https://img.youtube.com/vi/${y[1]}/hqdefault.jpg`;
      }
    }
  }

  // 머리말 컬럼이 없을 수 있어 우선 시도 후 실패 시 폴백
  let data: { id: string } | null = null;
  let error: any = null;
  ({ data, error } = await supabase
    .from('posts')
    .insert({ user_id: user.id, title, slug: s, content: safeContent, excerpt: safeExcerpt, cover_image: autoCover, published, heading })
    .select('id')
    .single());
  if (error) {
    const msg = (error.message || '').toLowerCase();
    const isHeadingMissing = msg.includes('column') && msg.includes('heading') && (msg.includes('does not exist') || msg.includes('missing'));
    if (isHeadingMissing) {
      ({ data, error } = await supabase
        .from('posts')
        .insert({ user_id: user.id, title, slug: s, content: safeContent, excerpt: safeExcerpt, cover_image: autoCover, published })
        .select('id')
        .single());
    }
  }
  if (error) return badRequest(error.message);
  try {
    revalidatePath('/');
    revalidatePath('/posts');
    revalidatePath(`/posts/${s}`);
    revalidatePath('/rss.xml');
    revalidatePath('/atom.xml');
    revalidatePath('/sitemap.xml');
    revalidatePath('/feed.xml');
    revalidateTag('posts:list', 'auto');
    revalidateTag(`post:${s}`, 'auto');
    revalidateTag('feed:rss', 'auto');
    revalidateTag('feed:atom', 'auto');
    revalidateTag('feed:sitemap', 'auto');
  } catch {}
  if (!data) return badRequest('insert_failed');
  
  // 포스트 작성 성공 시 팔로워들에게 알림 보내기 (비동기)
  if (published) {
    try {
      // 팔로워들 조회
      const { data: followers, error: followersError } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', user.id);

      if (!followersError && followers && followers.length > 0) {
        // 각 팔로워에게 알림 전송 (병렬 처리)
        const notificationPromises = followers.map(follower =>
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notifications/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'followed_user_post',
              targetUserId: follower.follower_id,
              postId: data.id,
              postTitle: title
            }),
          }).catch(error => {
            console.error(`팔로워 ${follower.follower_id} 알림 전송 실패:`, error);
          })
        );

        // 모든 알림 전송을 기다리지 않고 비동기로 처리
        Promise.allSettled(notificationPromises);
      }
    } catch (error) {
      console.error('팔로워 알림 전송 중 오류:', error);
    }
  }
  
  return NextResponse.json({ id: data.id, slug: s });
}
  
