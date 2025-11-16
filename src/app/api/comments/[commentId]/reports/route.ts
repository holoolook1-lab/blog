import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import { unauthorized, badRequest, notFound } from '@/lib/api';

// 댓글 신고 사유 타입
const VALID_REASONS = ['spam', 'harassment', 'hate_speech', 'misinformation', 'other'] as const;
type ReportReason = typeof VALID_REASONS[number];

// 댓글 신고 API
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
  const { reason, description } = body;
  
  // 신고 사유 검증
  if (!reason || !VALID_REASONS.includes(reason as ReportReason)) {
    return badRequest('Invalid report reason');
  }
  
  if (description && typeof description !== 'string') {
    return badRequest('Invalid description');
  }
  
  // 댓글 존재 여부 확인
  const { data: comment, error: commentError } = await supabase
    .from('comments')
    .select('id, user_id')
    .eq('id', commentId)
    .single();
  
  if (commentError || !comment) {
    return notFound();
  }
  
  // 자신의 댓글은 신고할 수 없음
  if (comment.user_id === user.id) {
    return badRequest('Cannot report your own comment');
  }
  
  // 이미 신고했는지 확인
  const { data: existingReport } = await supabase
    .from('comment_reports')
    .select('id')
    .eq('comment_id', commentId)
    .eq('reporter_id', user.id)
    .single();
  
  if (existingReport) {
    return badRequest('Already reported this comment');
  }
  
  // 신고 생성
  const { error } = await supabase
    .from('comment_reports')
    .insert({
      comment_id: commentId,
      reporter_id: user.id,
      reason: reason as ReportReason,
      description: description || null
    });
  
  if (error) {
    return badRequest(error.message);
  }
  
  return NextResponse.json({ 
    success: true, 
    message: 'Comment reported successfully' 
  });
}

// 댓글 신고 조회 (관리자용)
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ commentId: string }> }
) {
  const { commentId } = await context.params;
  const supabase = await getServerSupabase();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) return unauthorized();
  
  // 관리자 권한 확인 (이메일 기반)
  const { data: userData } = await supabase
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single();
  
  if (!userData || userData.email !== 'admin@rakiraki.com') {
    return unauthorized();
  }
  
  // 해당 댓글의 신고 목록 조회
  const { data: reports, error } = await supabase
    .from('comment_reports')
    .select(`
      id,
      reason,
      description,
      status,
      created_at,
      reporter:reporter_id(id, email)
    `)
    .eq('comment_id', commentId)
    .order('created_at', { ascending: false });
  
  if (error) {
    return badRequest(error.message);
  }
  
  return NextResponse.json({ reports: reports || [] });
}