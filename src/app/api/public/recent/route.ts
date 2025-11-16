import { NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase/admin';
import { createPublicSupabaseClient } from '@/lib/supabase/env';

export const revalidate = 30; // 캐시 시간 단축 (60초 -> 30초)

// 공개 최신 글 API: 로그인 없이도 최신 공개 글을 반환
// profiles(username, avatar_url) 조인으로 작성자 표시 정보를 포함
export async function GET() {
  try {
    const supa = adminSupabase || createPublicSupabaseClient();
    const { data: posts, error } = await supa
      .from('posts')
      .select('id, user_id, title, slug, excerpt, cover_image, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(6);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const list = posts || [];
    const userIds = Array.from(new Set(list.map((p: any) => p.user_id).filter(Boolean)));
    let profiles: Record<string, { name: string; avatar: string }> = {};
    if (userIds.length) {
      const { data: profs } = await supa
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds as any);
      (profs || []).forEach((pr: any) => {
        profiles[pr.id] = { name: pr.username || '', avatar: pr.avatar_url || '' };
      });
    }

    const enriched = list.map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      cover_image: p.cover_image,
      created_at: p.created_at,
      authorName: profiles[p.user_id]?.name || p.user_id || '',
      authorAvatarUrl: profiles[p.user_id]?.avatar || '',
    }));

    return NextResponse.json({ posts: enriched });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'unknown_error' }, { status: 500 });
  }
}

