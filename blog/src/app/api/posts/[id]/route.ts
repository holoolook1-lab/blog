import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { revalidatePath } from 'next/cache';
 
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: owned } = await supabase.from('posts').select('id, user_id').eq('id', id).single();
  if (!owned) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (owned.user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json();
  const { title, slug, content, cover_image, published, heading } = body;
  // XSS 방지: 저장 전에 콘텐츠/요약 정화
  const safeContent = sanitizeHtml(content || '');
  const safeExcerpt = sanitizeHtml(body.excerpt || '');

  // 머리말 컬럼이 없을 수 있어 우선 시도 후 실패 시 폴백
  let error: any = null;
  ({ error } = await supabase
    .from('posts')
    .update({ title, slug, content: safeContent, excerpt: safeExcerpt, cover_image, published, heading })
    .eq('id', id));
  if (error) {
    const msg = (error.message || '').toLowerCase();
    const isHeadingMissing = msg.includes('column') && msg.includes('heading') && (msg.includes('does not exist') || msg.includes('missing'));
    if (isHeadingMissing) {
      ({ error } = await supabase
        .from('posts')
        .update({ title, slug, content: safeContent, excerpt: safeExcerpt, cover_image, published })
        .eq('id', id));
    }
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  try {
    revalidatePath('/');
    revalidatePath('/posts');
    revalidatePath(`/posts/${slug}`);
    revalidatePath('/rss.xml');
    revalidatePath('/atom.xml');
    revalidatePath('/sitemap.xml');
    revalidatePath('/feed.xml');
  } catch {}
  return NextResponse.json({ ok: true });
}
 
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: owned } = await supabase.from('posts').select('id, user_id').eq('id', id).single();
  if (!owned) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (owned.user_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // 삭제 전에 slug를 조회해서 상세 경로도 재검증할 수 있도록 함
  const { data: toDelete } = await supabase.from('posts').select('slug').eq('id', id).single();
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  try {
    revalidatePath('/');
    revalidatePath('/posts');
    if (toDelete?.slug) revalidatePath(`/posts/${toDelete.slug}`);
    revalidatePath('/rss.xml');
    revalidatePath('/atom.xml');
    revalidatePath('/sitemap.xml');
    revalidatePath('/feed.xml');
  } catch {}
  return NextResponse.json({ ok: true });
}
