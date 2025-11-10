import { NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json();
  const { title, slug, content, excerpt, cover_image, published } = body;
  // XSS 방지: 저장 전에 콘텐츠/요약 정화
  const safeContent = sanitizeHtml(content || '');
  const safeExcerpt = sanitizeHtml(excerpt || '');

  const { data, error } = await supabase
    .from('posts')
    .insert({ user_id: user.id, title, slug, content: safeContent, excerpt: safeExcerpt, cover_image, published })
    .select('id')
    .single();
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
  return NextResponse.json({ id: data.id });
}
