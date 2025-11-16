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

    const { targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json(
        { error: '대상 사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: '자기 자신은 팔로우할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 대상 사용자가 존재하는지 확인
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: '대상 사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 팔로우하고 있는지 확인
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single()

    if (existingFollow) {
      return NextResponse.json(
        { error: '이미 팔로우하고 있는 사용자입니다.' },
        { status: 400 }
      )
    }

    // 팔로우 생성
    const { error: insertError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: targetUserId,
      })

    if (insertError) {
      console.error('팔로우 생성 오류:', insertError)
      return NextResponse.json(
        { error: '팔로우 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: '팔로우했습니다.' 
    })

  } catch (error) {
    console.error('팔로우 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const targetUserId = searchParams.get('targetUserId')

    if (!targetUserId) {
      return NextResponse.json(
        { error: '대상 사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 팔로우 관계 삭제
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)

    if (deleteError) {
      console.error('팔로우 삭제 오류:', deleteError)
      return NextResponse.json(
        { error: '팔로우 취소 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: '팔로우를 취소했습니다.' 
    })

  } catch (error) {
    console.error('팔로우 취소 API 오류:', error)
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
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'followers' or 'following'

    if (!userId || !type) {
      return NextResponse.json(
        { error: '사용자 ID와 타입이 필요합니다.' },
        { status: 400 }
      )
    }

    if (!['followers', 'following'].includes(type)) {
      return NextResponse.json(
        { error: '올바른 타입이 아닙니다.' },
        { status: 400 }
      )
    }

    let query
    if (type === 'followers') {
      // 나를 팔로우하는 사람들
      query = supabase
        .from('follows')
        .select('follower_id, created_at, profiles!follows_follower_id_fkey(id, username, avatar_url)')
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
    } else {
      // 내가 팔로우하는 사람들
      query = supabase
        .from('follows')
        .select('following_id, created_at, profiles!follows_following_id_fkey(id, username, avatar_url)')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      console.error('팔로우 목록 조회 오류:', error)
      return NextResponse.json(
        { error: '팔로우 목록 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      users: data || [],
      count: data?.length || 0
    })

  } catch (error) {
    console.error('팔로우 목록 조회 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}