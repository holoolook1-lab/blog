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
    return NextResponse.json({ comments: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server configuration error' }, { status: 500 });
  }
}
