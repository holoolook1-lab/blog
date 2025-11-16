import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { containsProfanity } from '@/lib/profanity';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { unauthorized, badRequest } from '@/lib/api';

const userCommentCount = new Map<string, { count: number; timestamp: number }>();

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await req.json();
  let { post_id, parent_id, content } = body as { post_id: string; parent_id?: string | null; content: string };
  if (!post_id || typeof content !== 'string') return badRequest('invalid_payload');
  content = content.trim();
  if (content.length < 3) {
    return badRequest('too_short');
  }
  if (content.length > 2000) {
    return badRequest('too_long');
  }
  if (containsProfanity(content)) {
    return badRequest('profanity');
  }

  // XSS 방지: 저장 전에 콘텐츠 정화
  content = sanitizeHtml(content);

  // 먼저 포스트 정보를 가져와서 작성자 ID 확인
  const { data: postData, error: postError } = await supabase
    .from('posts')
    .select('user_id, title')
    .eq('id', post_id)
    .single();

  if (postError) {
    console.error('포스트 정보 조회 실패:', postError);
  }

  // RPC가 존재하면 사용, 없으면 일반 insert로 폴백
  let commentId;
  try {
    const { data: rpc } = await (supabase as any).rpc('insert_comment', { p_post_id: post_id, p_user_id: user.id, p_parent_id: parent_id || null, p_content: content });
    if (rpc && (rpc as any).id) {
      commentId = (rpc as any).id;
    }
  } catch {}
  
  if (!commentId) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id, user_id: user.id, parent_id: parent_id || null, content })
      .select('id')
      .single();
    if (error) return badRequest(error.message);
    commentId = data.id;
  }

  // 포스트 작성자에게 알림 보내기 (자신의 글에는 알림 안 보냄)
  if (postData && postData.user_id !== user.id) {
    try {
      // 비동기로 알림 전송 (실패해도 댓글 작성은 성공해야 함)
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new_comment',
          targetUserId: postData.user_id,
          postId: post_id,
          commentId,
          postTitle: postData.title || '새 글'
        }),
      }).catch(error => {
        console.error('알림 전송 실패:', error);
      });
    } catch (error) {
      console.error('알림 전송 중 오류:', error);
    }
  }

  return NextResponse.json({ id: commentId });
}
