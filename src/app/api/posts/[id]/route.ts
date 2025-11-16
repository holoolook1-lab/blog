import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { revalidatePath, revalidateTag } from 'next/cache';
import { normalizeSlug, isValidSlug } from '@/lib/slug';
import { unauthorized, forbidden, notFound, badRequest, serverError } from '@/lib/api';

// Supabase storage URL에서 파일 경로 추출
function extractStoragePath(imageUrl: string): string | null {
  try {
    if (imageUrl.includes('/storage/v1/object/public/')) {
      // Supabase storage URL 형식
      const parts = imageUrl.split('/storage/v1/object/public/');
      if (parts.length > 1) {
        return parts[1];
      }
    } else if (imageUrl.includes('supabase.co')) {
      // 오래된 Supabase URL 형식
      const match = imageUrl.match(/\/storage\/v1\/object\/public\/(.+)/);
      if (match) {
        return match[1];
      }
    }
  } catch (error) {
    console.warn('이미지 경로 추출 중 오류:', error);
  }
  return null;
}

// HTML 콘텐츠에서 이미지 URL 추출
function extractImagesFromContent(content: string): string[] {
  const images: string[] = [];
  try {
    // img 태그에서 src 추출
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      if (match[1] && match[1].includes('supabase')) {
        images.push(match[1]);
      }
    }
    
    // 배경 이미지 추출 (style 속성)
    const bgRegex = /background-image\s*:\s*url\(["']?([^"')]+)["']?\)/gi;
    while ((match = bgRegex.exec(content)) !== null) {
      if (match[1] && match[1].includes('supabase')) {
        images.push(match[1]);
      }
    }
  } catch (error) {
    console.warn('콘텐츠에서 이미지 추출 중 오류:', error);
  }
  return images;
}
 
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
  console.warn('DELETE API 호출 시작');
  const { id } = await context.params;
  console.warn('삭제할 포스트 ID:', id);
  
  try {
    const supabase = await getServerSupabase();
    if (!supabase) {
      console.warn('Supabase 클라이언트 생성 실패');
      return serverError('supabase_client_failed');
    }
    
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.warn('인증된 사용자:', user?.id);
    
    if (!user) {
      console.warn('인증되지 않은 사용자');
      return unauthorized();
    }
    
    // 포스트 소유권 확인
    const { data: owned, error: ownershipError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', id)
      .single();
      
    console.warn('포스트 소유권 확인:', owned, '에러:', ownershipError);
    
    if (ownershipError || !owned) {
      console.warn('포스트를 찾을 수 없음');
      return notFound();
    }
    
    if (owned.user_id !== user.id) {
      console.warn('권한 없음 - 사용자:', user.id, '포스트 소유자:', owned.user_id);
      return forbidden();
    }

    // 삭제 전에 slug, 커버 이미지, 본문 내용을 조회해서 스토리지 이미지도 삭제
    const { data: toDelete } = await supabase.from('posts').select('slug, cover_image, content').eq('id', id).single();
    console.warn('삭제할 포스트 slug:', toDelete?.slug, '커버 이미지:', toDelete?.cover_image);
    
    // 삭제할 이미지 경로들 수집
    const imagePathsToDelete: string[] = [];
    
    // 1. 커버 이미지 추가
    if (toDelete?.cover_image) {
      const coverPath = extractStoragePath(toDelete.cover_image);
      if (coverPath) {
        imagePathsToDelete.push(coverPath);
      }
    }
    
    // 2. 본문에서 이미지 추출
    if (toDelete?.content) {
      const contentImages = extractImagesFromContent(toDelete.content);
      contentImages.forEach(url => {
        const path = extractStoragePath(url);
        if (path) {
          imagePathsToDelete.push(path);
        }
      });
    }
    
    console.warn('삭제할 이미지 경로들:', imagePathsToDelete);
    
    // 중복 제거 후 스토리지 이미지 삭제
    const uniquePaths = Array.from(new Set(imagePathsToDelete));
    if (uniquePaths.length > 0) {
      try {
        console.warn('스토리지 이미지 일괄 삭제 시도:', uniquePaths);
        const { error: storageError } = await supabase.storage
          .from('posts')
          .remove(uniquePaths);
        
        if (storageError) {
          console.warn('스토리지 이미지 삭제 실패:', storageError);
        } else {
          console.warn('스토리지 이미지 삭제 성공:', uniquePaths.length, '개 파일');
        }
      } catch (storageError) {
        console.warn('스토리지 이미지 삭제 중 오류:', storageError);
        // 스토리지 삭제 실패해도 포스트 삭제는 계속 진행
      }
    }
    
    const { error } = await supabase.from('posts').delete().eq('id', id);
    console.warn('삭제 결과:', error);
    
    if (error) {
      console.warn('삭제 중 오류 발생:', error);
      return badRequest(error.message);
    }
    
    console.warn('포스트 삭제 성공, 캐시 재검증 시작');
    
    try {
      // 전체 경로 재검증
      revalidatePath('/', 'layout');
      revalidatePath('/posts', 'page');
      revalidatePath('/posts', 'layout');
      if (toDelete?.slug) {
        revalidatePath(`/posts/${toDelete.slug}`, 'page');
        revalidatePath(`/posts/${toDelete.slug}`, 'layout');
      }
      
      // 피드 재검증
      revalidatePath('/rss.xml', 'page');
      revalidatePath('/atom.xml', 'page');
      revalidatePath('/sitemap.xml', 'page');
      revalidatePath('/feed.xml', 'page');
      
      // 캐시 태그 재검증
      revalidateTag('posts:list', 'auto');
      if (toDelete?.slug) revalidateTag(`post:${toDelete.slug}`, 'auto');
      revalidateTag('feed:rss', 'auto');
      revalidateTag('feed:atom', 'auto');
      revalidateTag('feed:sitemap', 'auto');
      
      // 추가 태그 재검증
      revalidateTag('posts', 'auto');
      revalidateTag('home', 'auto');
      revalidateTag('recent', 'auto');
      
      console.warn('캐시 재검증 완료');
    } catch (revalidateError) {
      console.warn('캐시 재검증 중 오류:', revalidateError);
    }
    
    console.warn('DELETE API 완료');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn('DELETE API 전체 오류:', error);
    return serverError('internal_error');
  }
}
 
