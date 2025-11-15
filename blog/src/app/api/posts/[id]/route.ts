import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { revalidatePath, revalidateTag } from 'next/cache';
import { normalizeSlug, isValidSlug } from '@/lib/slug';
import { unauthorized, forbidden, notFound, badRequest, serverError } from '@/lib/api';
 
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
    revalidateTag('posts:list', 'auto');
    revalidateTag(`post:${s}`, 'auto');
    revalidateTag('feed:rss', 'auto');
    revalidateTag('feed:atom', 'auto');
    revalidateTag('feed:sitemap', 'auto');
  } catch {}
  return NextResponse.json({ ok: true });
}
 
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log('DELETE API 호출 시작');
  const { id } = await context.params;
  console.log('삭제할 포스트 ID:', id);
  
  try {
    const supabase = await getServerSupabase();
    if (!supabase) {
      console.log('Supabase 클라이언트 생성 실패');
      return serverError('supabase_client_failed');
    }
    
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log('인증된 사용자:', user?.id);
    
    if (!user) {
      console.log('인증되지 않은 사용자');
      return unauthorized();
    }
    
    // 포스트 소유권 확인
    const { data: owned, error: ownershipError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', id)
      .single();
      
    console.log('포스트 소유권 확인:', owned, '에러:', ownershipError);
    
    if (ownershipError || !owned) {
      console.log('포스트를 찾을 수 없음');
      return notFound();
    }
    
    if (owned.user_id !== user.id) {
      console.log('권한 없음 - 사용자:', user.id, '포스트 소유자:', owned.user_id);
      return forbidden();
    }

    // 삭제 전에 slug를 조회해서 상세 경로도 재검증할 수 있도록 함
    const { data: toDelete } = await supabase.from('posts').select('slug').eq('id', id).single();
    console.log('삭제할 포스트 slug:', toDelete?.slug);
    
    const { error } = await supabase.from('posts').delete().eq('id', id);
    console.log('삭제 결과:', error);
    
    if (error) {
      console.log('삭제 중 오류 발생:', error);
      return badRequest(error.message);
    }
    
    console.log('포스트 삭제 성공, 캐시 재검증 시작');
    
    try {
      revalidatePath('/');
      revalidatePath('/posts');
      if (toDelete?.slug) revalidatePath(`/posts/${toDelete.slug}`);
      revalidatePath('/rss.xml');
      revalidatePath('/atom.xml');
      revalidatePath('/sitemap.xml');
      revalidatePath('/feed.xml');
      revalidateTag('posts:list', 'auto');
      if (toDelete?.slug) revalidateTag(`post:${toDelete.slug}`, 'auto');
      revalidateTag('feed:rss', 'auto');
      revalidateTag('feed:atom', 'auto');
      revalidateTag('feed:sitemap', 'auto');
      console.log('캐시 재검증 완료');
    } catch (revalidateError) {
      console.log('캐시 재검증 중 오류:', revalidateError);
    }
    
    console.log('DELETE API 완료');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.log('DELETE API 전체 오류:', error);
    return serverError('internal_error');
  }
}
 
