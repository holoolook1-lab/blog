import { NextRequest, NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/env';

export const revalidate = 60;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  const { postId } = await context.params;
  
  // 페이지네이션 파라미터 추출
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(5, parseInt(searchParams.get('limit') || '20'))); // 기본 20개, 최대 50개
  const offset = (page - 1) * limit;
  
  try {
    const supabase = createPublicSupabaseClient();
    
    // 전체 댓글 수 조회 (숨겨진 댓글 제외)
    const { count, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('is_hidden', false);
    
    if (countError) {
      console.warn('댓글 수 조회 오류:', countError);
      return NextResponse.json({ error: countError.message }, { status: 400 });
    }
    
    // 페이지네이션된 댓글 조회 (반응 수 포함)
    const { data, error } = await supabase
      .from('comments')
      .select('id, user_id, post_id, parent_id, content, created_at, like_count, dislike_count, report_count, is_hidden')
      .eq('post_id', postId)
      .eq('is_hidden', false) // 숨겨진 댓글 제외
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.warn('댓글 조회 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    const comments = data || [];
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    // 사용자 프로필 정보 조회
    const ids = Array.from(new Set(comments.map((c: any) => c.user_id))).filter(Boolean);
    let profiles: Array<{ id: string; username: string | null; avatar_url: string | null }> = [];
    if (ids.length) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', ids as any);
      profiles = profs || [];
    }
    
    // 페이지네이션 메타데이터 포함 응답
    return NextResponse.json({
      comments,
      profiles,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (e: any) {
    console.warn('댓글 API 전체 오류:', e);
    return NextResponse.json({ error: e?.message || 'Server configuration error' }, { status: 500 });
  }
}
