import { unstable_cache } from 'next/cache';
import { createPublicSupabaseClient } from '@/lib/supabase/env';

type ListParams = { page: number; pageSize: number; q?: string; heading?: string; qTitleOnly?: boolean };

export const getPublicPostsCached = unstable_cache(
  async ({ page, pageSize, q = '', heading = '', qTitleOnly = false }: ListParams) => {
    const supabase = createPublicSupabaseClient();
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const from = (safePage - 1) * pageSize;
    const to = from + pageSize - 1;
    let query = supabase
      .from('posts')
      .select('id, user_id, title, slug, excerpt, cover_image, created_at, like_count, dislike_count, heading')
      .eq('published', true);
    if (q) {
      const like = `%${q}%`;
      query = qTitleOnly ? query.ilike('title', like) : query.or(`title.ilike.${like},content.ilike.${like}`);
    }
    let data: any[] | null = null;
    let err: any = null;
    if (heading) {
      const { data: filtered, error } = await query.eq('heading', heading)
        .order('created_at', { ascending: false })
        .range(from, to);
      data = filtered || null;
      err = error;
      if (err) {
        const { data: noFilter } = await supabase
          .from('posts')
          .select('id, title, slug, excerpt, cover_image, created_at, content, like_count, dislike_count')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .range(from, to);
        data = noFilter || null;
      }
    } else {
      const { data: all } = await query
        .order('created_at', { ascending: false })
        .range(from, to);
      data = all || null;
    }

    const seen = new Set<string>();
    const deduped = (data || []).filter((p: any) => {
      const key = p.id || p.slug;
      if (!key) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const posts = deduped || [];
    const userIds = Array.from(new Set((posts || []).map((p: any) => p.user_id).filter(Boolean)));
    let profiles: Record<string, { name: string; avatar: string }> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds as any);
      (profs || []).forEach((pr: any) => {
        profiles[pr.id] = { name: pr.username || '', avatar: pr.avatar_url || '' };
      });
    }
    const mapped = (posts || []).map((p: any) => ({
      ...p,
      __authorName: (profiles[p.user_id]?.name || p.user_id || ''),
      __authorAvatar: (profiles[p.user_id]?.avatar || ''),
    }));

    // 목록에서는 총 카운트 계산을 생략해 DB 호출을 줄입니다(상단 표시는 페이지 크기/현재 길이로 대체).
    const totalCount = (mapped || []).length;
    return { posts: mapped, totalCount };
  },
  ['posts:list'],
  { revalidate: 60, tags: ['posts:list'] }
);

export async function getPostBySlugCached(slug: string) {
  const supabase = createPublicSupabaseClient();
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  return data || null;
}
