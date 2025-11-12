import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { containsProfanity } from '@/lib/profanity';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { unauthorized, badRequest } from '@/lib/api';

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const body = await req.json();
  let { content } = body as { content: string };
  if (typeof content !== 'string') {
    return badRequest('invalid_payload');
  }
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

  const { error } = await supabase.from('comments').update({ content }).eq('id', id);
  if (error) return badRequest(error.message);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) return badRequest(error.message);
  return NextResponse.json({ ok: true });
}
