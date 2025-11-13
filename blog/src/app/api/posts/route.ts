import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { revalidatePath } from 'next/cache';
import { normalizeSlug, slugifyKorean, isValidSlug } from '@/lib/slug';
import { badRequest, unauthorized } from '@/lib/api';

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();
  const body = await req.json();
  const { title, slug, content, excerpt, cover_image, published, heading } = body;
  // XSS 방지: 저장 전에 콘텐츠/요약 정화
  const safeContent = sanitizeHtml(content || '');
  const safeExcerpt = sanitizeHtml(excerpt || '');

  // 슬러그 정규화(서버 강제): 누락 시 제목에서 생성
  let s = normalizeSlug(slug || '');
  if (!s) s = slugifyKorean(title || '');
  if (!s) {
    s = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }
  if (!isValidSlug(s)) {
    return badRequest('invalid_slug');
  }

  // 커버 이미지가 비어있으면 본문 첫 이미지로 자동 설정
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
  let data: { id: string } | null = null;
  let error: any = null;
  ({ data, error } = await supabase
    .from('posts')
    .insert({ user_id: user.id, title, slug: s, content: safeContent, excerpt: safeExcerpt, cover_image: autoCover, published, heading })
    .select('id')
    .single());
  if (error) {
    const msg = (error.message || '').toLowerCase();
    const isHeadingMissing = msg.includes('column') && msg.includes('heading') && (msg.includes('does not exist') || msg.includes('missing'));
    if (isHeadingMissing) {
      ({ data, error } = await supabase
        .from('posts')
        .insert({ user_id: user.id, title, slug: s, content: safeContent, excerpt: safeExcerpt, cover_image: autoCover, published })
        .select('id')
        .single());
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
  } catch {}
  if (!data) return badRequest('insert_failed');
  return NextResponse.json({ id: data.id, slug: s });
}
  
