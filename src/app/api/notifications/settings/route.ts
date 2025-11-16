import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

// 알림 설정 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('알림 설정 조회 실패:', error);
      return NextResponse.json(
        { error: '알림 설정 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data
    });

  } catch (error) {
    console.error('알림 설정 조회 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 알림 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      new_followers,
      post_likes,
      post_comments,
      comment_replies,
      mentions,
      email_notifications,
      push_notifications
    } = body;

    const { data, error } = await supabase
      .from('user_notification_settings')
      .upsert({
        user_id: user.id,
        new_followers,
        post_likes,
        post_comments,
        comment_replies,
        mentions,
        email_notifications,
        push_notifications,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('알림 설정 업데이트 실패:', error);
      return NextResponse.json(
        { error: '알림 설정 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: '알림 설정이 업데이트되었습니다.',
      data
    });

  } catch (error) {
    console.error('알림 설정 업데이트 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}