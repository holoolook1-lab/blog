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

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id, user_id: user.id, parent_id: parent_id || null, content })
    .select('id')
    .single();
  if (error) return badRequest(error.message);
  return NextResponse.json({ id: data.id });
}
