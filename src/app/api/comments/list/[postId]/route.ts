import { NextRequest, NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/env';

export const revalidate = 60;

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  const { postId } = await context.params;
  try {
    const supabase = createPublicSupabaseClient();
    const { data, error } = await supabase
    .from('comments')
    .select('id, user_id, post_id, parent_id, content, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const comments = data || [];
    const ids = Array.from(new Set(comments.map((c: any) => c.user_id))).filter(Boolean);
    let profiles: Array<{ id: string; username: string | null; avatar_url: string | null }> = [];
    if (ids.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', ids as any);
      profiles = profs || [];
    }
    return NextResponse.json({ comments, profiles });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server configuration error' }, { status: 500 });
  }
}
