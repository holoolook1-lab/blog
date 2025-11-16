import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { commentId, reason, description } = await request.json()

    if (!commentId || !reason) {
      return NextResponse.json(
        { error: '댓글 ID와 신고 사유가 필요합니다.' },
        { status: 400 }
      )
    }

    const validReasons = ['spam', 'harassment', 'inappropriate', 'misinformation', 'other']
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: '올바른 신고 사유가 아닙니다.' },
        { status: 400 }
      )
    }

    // 댓글이 존재하는지 확인
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 자신의 댓글은 신고할 수 없음
    if (comment.user_id === user.id) {
      return NextResponse.json(
        { error: '자신의 댓글은 신고할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 이미 신고했는지 확인
    const { data: existingReport } = await supabase
      .from('comment_reports')
      .select('id')
      .eq('comment_id', commentId)
      .eq('reporter_id', user.id)
      .single()

    if (existingReport) {
      return NextResponse.json(
        { error: '이미 신고한 댓글입니다.' },
        { status: 400 }
      )
    }

    // 신고 생성
    const { error: insertError } = await supabase
      .from('comment_reports')
      .insert({
        comment_id: commentId,
        reporter_id: user.id,
        reason,
        description: description || null,
      })

    if (insertError) {
      console.error('댓글 신고 생성 오류:', insertError)
      return NextResponse.json(
        { error: '신고 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: '댓글이 신고되었습니다. 검토 후 조치하겠습니다.' 
    })

  } catch (error) {
    console.error('댓글 신고 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json(
        { error: '댓글 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 사용자가 해당 댓글을 신고했는지 확인
    const { data: report, error } = await supabase
      .from('comment_reports')
      .select('id, reason, status, created_at')
      .eq('comment_id', commentId)
      .eq('reporter_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116: 단일 행을 찾을 수 없음
      return NextResponse.json(
        { error: '신고 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      hasReported: !!report,
      report: report
    })

  } catch (error) {
    console.error('댓글 신고 조회 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}