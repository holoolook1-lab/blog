import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { containsProfanity } from '@/lib/profanity';
import { sanitizeHtml } from '@/lib/utils/sanitize';

const userCommentCount = new Map<string, { count: number; timestamp: number }>();

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  let { post_id, parent_id, content } = body as { post_id: string; parent_id?: string | null; content: string };
  if (!post_id || typeof content !== 'string') return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  content = content.trim();
  if (content.length < 3) {
    return new Response(JSON.stringify({ error: 'too_short' }), { status: 400 });
  }
  if (content.length > 2000) {
    return new Response(JSON.stringify({ error: 'too_long' }), { status: 400 });
  }
  if (containsProfanity(content)) {
    return new Response(JSON.stringify({ error: 'profanity' }), { status: 400 });
  }

  // XSS 방지: 저장 전에 콘텐츠 정화
  content = sanitizeHtml(content);

  const { data, error } = await supabase
    .from('comments')
    .insert({ post_id, user_id: user.id, parent_id: parent_id || null, content })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
