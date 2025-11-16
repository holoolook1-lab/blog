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

    const { commentId, reactionType } = await request.json()

    if (!commentId || !reactionType) {
      return NextResponse.json(
        { error: '댓글 ID와 반응 타입이 필요합니다.' },
        { status: 400 }
      )
    }

    if (!['like', 'dislike'].includes(reactionType)) {
      return NextResponse.json(
        { error: '올바른 반응 타입이 아닙니다.' },
        { status: 400 }
      )
    }

    // 댓글이 존재하는지 확인
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 기존 반응 확인
    const { data: existingReaction } = await supabase
      .from('comment_reactions')
      .select('id, reaction_type')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single()

    // 트랜잭션으로 처리
    if (existingReaction) {
      if (existingReaction.reaction_type === reactionType) {
        // 같은 반응이면 삭제 (토글)
        const { error: deleteError } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('id', existingReaction.id)

        if (deleteError) {
          return NextResponse.json(
            { error: '반응 삭제 중 오류가 발생했습니다.' },
            { status: 500 }
          )
        }

        return NextResponse.json({ 
          success: true, 
          action: 'removed',
          reactionType 
        })
      } else {
        // 다른 반응이면 업데이트
        const { error: updateError } = await supabase
          .from('comment_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existingReaction.id)

        if (updateError) {
          return NextResponse.json(
            { error: '반응 업데이트 중 오류가 발생했습니다.' },
            { status: 500 }
          )
        }

        return NextResponse.json({ 
          success: true, 
          action: 'updated',
          reactionType 
        })
      }
    } else {
      // 새 반응 생성
      const { error: insertError } = await supabase
        .from('comment_reactions')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          reaction_type: reactionType,
        })

      if (insertError) {
        return NextResponse.json(
          { error: '반응 생성 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({ 
        success: true, 
        action: 'added',
        reactionType 
      })
    }
  } catch (error) {
    console.error('댓글 반응 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const searchParams = request.nextUrl.searchParams
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json(
        { error: '댓글 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 현재 사용자의 반응 조회
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let userReaction = null
    if (user) {
      const { data } = await supabase
        .from('comment_reactions')
        .select('reaction_type')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single()
      
      userReaction = data?.reaction_type || null
    }

    // 전체 반응 수 조회
    const { data: reactions, error } = await supabase
      .from('comment_reactions')
      .select('reaction_type')
      .eq('comment_id', commentId)

    if (error) {
      return NextResponse.json(
        { error: '반응 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    const likes = reactions?.filter(r => r.reaction_type === 'like').length || 0
    const dislikes = reactions?.filter(r => r.reaction_type === 'dislike').length || 0

    return NextResponse.json({
      likes,
      dislikes,
      userReaction,
   })
  } catch (error) {
    console.error('댓글 반응 조회 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}