import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { containsProfanity } from '@/lib/profanity';
import { sanitizeHtml } from '@/lib/utils/sanitize';

type Params = { params: { id: string } };

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  let { content } = body as { content: string };
  if (typeof content !== 'string') {
    return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400 });
  }
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

  const { error } = await supabase.from('comments').update({ content }).eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: Params) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { error } = await supabase.from('comments').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}