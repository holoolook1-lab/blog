import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { post_id, value } = body as { post_id: string; value: -1 | 1 };
  if (!post_id || ![1, -1].includes(Number(value))) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  // 기존 투표 조회
  const { data: existing } = await supabase
    .from('votes')
    .select('id, value')
    .eq('post_id', post_id)
    .eq('user_id', user.id)
    .maybeSingle();

  let changed = false;
  if (!existing) {
    const { error: insErr } = await supabase.from('votes').insert({ post_id, user_id: user.id, value });
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
    changed = true;
  } else if (existing.value === value) {
    // 동일 값이면 토글로 삭제
    const { error: delErr } = await supabase.from('votes').delete().eq('id', existing.id);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });
    changed = true;
  } else {
    // 값 변경
    const { error: updErr } = await supabase.from('votes').update({ value }).eq('id', existing.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });
    changed = true;
  }

  // 집계 재계산
  if (changed) {
    const { count: likesCount } = await supabase
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', post_id)
      .eq('value', 1);
    const { count: dislikesCount } = await supabase
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', post_id)
      .eq('value', -1);
    await supabase.from('posts').update({ like_count: likesCount || 0, dislike_count: dislikesCount || 0 }).eq('id', post_id);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const post_id = url.searchParams.get('post_id');
  if (!post_id) return NextResponse.json({ error: 'post_id_required' }, { status: 400 });
  const supabase = await getServerSupabase();
  const { count: likesCount } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', post_id)
    .eq('value', 1);
  const { count: dislikesCount } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', post_id)
    .eq('value', -1);
  return NextResponse.json({ likes: likesCount || 0, dislikes: dislikesCount || 0 });
}
