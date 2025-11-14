import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { revalidatePath, revalidateTag } from 'next/cache';
import { normalizeSlug, isValidSlug } from '@/lib/slug';
import { unauthorized, forbidden, notFound, badRequest } from '@/lib/api';
 
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const { data: owned } = await supabase.from('posts').select('id, user_id').eq('id', id).single();
  if (!owned) return notFound();
  if (owned.user_id !== user.id) return forbidden();

  const body = await req.json();
  const { title, slug, content, cover_image, published, heading } = body;
  // XSS 방지: 저장 전에 콘텐츠/요약 정화
  const safeContent = sanitizeHtml(content || '');
  const safeExcerpt = sanitizeHtml(body.excerpt || '');

  // 슬러그 정규화(서버 강제)
  let s = normalizeSlug(slug || '');
  if (!isValidSlug(s)) {
    return badRequest('invalid_slug');
  }

  // 커버 이미지 자동 추출 (본문 첫 이미지), 명시적 cover_image가 없을 때만
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
  let error: any = null;
  ({ error } = await supabase
    .from('posts')
    .update({ title, slug: s, content: safeContent, excerpt: safeExcerpt, cover_image: autoCover, published, heading })
    .eq('id', id));
  if (error) {
    const msg = (error.message || '').toLowerCase();
    const isHeadingMissing = msg.includes('column') && msg.includes('heading') && (msg.includes('does not exist') || msg.includes('missing'));
    if (isHeadingMissing) {
      ({ error } = await supabase
        .from('posts')
        .update({ title, slug: s, content: safeContent, excerpt: safeExcerpt, cover_image: autoCover, published })
        .eq('id', id));
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
    revalidateTag('posts:list');
    revalidateTag(`post:${s}`);
    revalidateTag('feed:rss');
    revalidateTag('feed:atom');
    revalidateTag('feed:sitemap');
  } catch {}
  return NextResponse.json({ ok: true });
}
 
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const { data: owned } = await supabase.from('posts').select('id, user_id').eq('id', id).single();
  if (!owned) return notFound();
  if (owned.user_id !== user.id) return forbidden();

  // 삭제 전에 slug를 조회해서 상세 경로도 재검증할 수 있도록 함
  const { data: toDelete } = await supabase.from('posts').select('slug').eq('id', id).single();
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) return badRequest(error.message);
  try {
    revalidatePath('/');
    revalidatePath('/posts');
    if (toDelete?.slug) revalidatePath(`/posts/${toDelete.slug}`);
    revalidatePath('/rss.xml');
    revalidatePath('/atom.xml');
    revalidatePath('/sitemap.xml');
    revalidatePath('/feed.xml');
    revalidateTag('posts:list');
    if (toDelete?.slug) revalidateTag(`post:${toDelete.slug}`);
    revalidateTag('feed:rss');
    revalidateTag('feed:atom');
    revalidateTag('feed:sitemap');
  } catch {}
  return NextResponse.json({ ok: true });
}
 
