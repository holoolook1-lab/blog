import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { unauthorized, badRequest, notFound } from '@/lib/api';

// 댓글 반응(좋아요/싫어요) API

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await context.params;
  const supabase = await getServerSupabase();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) return unauthorized();
  
  const body = await req.json();
  const { reaction_type } = body;
  
  if (!['like', 'dislike'].includes(reaction_type)) {
    return badRequest('Invalid reaction type');
  }
  
  // 댓글 존재 여부 확인
  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .select('id')
    .eq('id', commentId)
    .single();
  
  if (commentError || !comment) {
    return notFound();
  }
  
  // 기존 반응 확인
  const { data: existing } = await supabase
    .from('comment_reactions')
    .select('id, reaction_type')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .single();
  
  if (existing) {
    if (existing.reaction_type === reaction_type) {
      // 같은 반응이면 삭제 (토글)
      const { error } = await supabase
        .from('comment_reactions')
        .delete()
        .eq('id', existing.id);
      
      if (error) {
        return badRequest(error.message);
      }
      
      return NextResponse.json({ action: 'removed', reaction_type });
    } else {
      // 다른 반응이면 업데이트
      const { error } = await supabase
        .from('comment_reactions')
        .update({ reaction_type })
        .eq('id', existing.id);
      
      if (error) {
        return badRequest(error.message);
      }
      
      return NextResponse.json({ action: 'updated', reaction_type });
    }
  } else {
    // 새 반응 생성
    const { error } = await supabase
      .from('comment_reactions')
      .insert({
        comment_id: commentId,
        user_id: user.id,
        reaction_type
      });
    
    if (error) {
      return badRequest(error.message);
    }
    
    return NextResponse.json({ action: 'created', reaction_type });
  }
}

// 댓글 반응 조회
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await context.params;
  const supabase = await getServerSupabase();
  
  // 댓글 존재 여부 확인
  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .select('id, like_count, dislike_count')
    .eq('id', commentId)
    .single();
  
  if (commentError || !comment) {
    return notFound();
  }
  
  // 현재 사용자의 반응 조회 (로그인한 경우)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  let userReaction = null;
  if (user) {
    const { data: reaction } = await supabase
      .from('comment_reactions')
      .select('reaction_type')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();
    
    if (reaction) {
      userReaction = reaction.reaction_type;
    }
  }
  
  return NextResponse.json({
    comment_id: commentId,
    like_count: comment.like_count || 0,
    dislike_count: comment.dislike_count || 0,
    user_reaction: userReaction
  });
}