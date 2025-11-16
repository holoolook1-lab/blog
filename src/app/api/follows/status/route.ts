import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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
    const targetUserId = searchParams.get('targetUserId')

    if (!targetUserId) {
      return NextResponse.json(
        { error: '대상 사용자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 팔로우 상태 확인
    const { data: follow } = await supabase
      .from('follows')
      .select('id, created_at')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single()

    // 대상 사용자의 팔로우 수 정보 조회
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('followers_count, following_count')
      .eq('id', targetUserId)
      .single()

    return NextResponse.json({
      isFollowing: !!follow,
      followId: follow?.id || null,
      followedAt: follow?.created_at || null,
      followersCount: targetProfile?.followers_count || 0,
      followingCount: targetProfile?.following_count || 0
    })

  } catch (error) {
    console.error('팔로우 상태 확인 API 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}