import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { targetUserId } = await request.json();
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: '대상 사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: '자신을 팔로우할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 팔로우하고 있는지 확인
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (existingFollow) {
      return NextResponse.json(
        { error: '이미 팔로우하고 있습니다.' },
        { status: 400 }
      );
    }

    // 팔로우 관계 생성
    const { error: followError } = await supabase
      .from('follows')
      .insert({
        follower_id: user.id,
        following_id: targetUserId,
        created_at: new Date().toISOString()
      });

    if (followError) {
      console.error('팔로우 생성 실패:', followError);
      return NextResponse.json(
        { error: '팔로우 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 팔로우 알림 보내기 (비동기)
    try {
      fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new_follower',
          targetUserId: targetUserId
        }),
      }).catch(error => {
        console.error('팔로우 알림 전송 실패:', error);
      });
    } catch (error) {
      console.error('팔로우 알림 전송 중 오류:', error);
    }

    return NextResponse.json({ 
      success: true,
      message: '팔로우가 완료되었습니다.'
    });

  } catch (error) {
    console.error('팔로우 처리 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { targetUserId } = await request.json();
    
    if (!targetUserId) {
      return NextResponse.json(
        { error: '대상 사용자 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 팔로우 관계 삭제
    const { error: unfollowError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);

    if (unfollowError) {
      console.error('언팔로우 실패:', unfollowError);
      return NextResponse.json(
        { error: '언팔로우에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: '언팔로우가 완료되었습니다.'
    });

  } catch (error) {
    console.error('언팔로우 처리 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}