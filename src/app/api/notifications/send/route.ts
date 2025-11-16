import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';
import webpush from 'web-push';

// Web Push 설정
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url: string;
    postId?: string;
    commentId?: string;
  };
}

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

    const { type, targetUserId, postId, commentId, postTitle } = await request.json();
    
    if (!targetUserId || !type) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 알림 종류별 메시지 설정
    let notification: NotificationPayload;
    let url = '/';

    switch (type) {
      case 'new_comment':
        notification = {
          title: '새로운 댓글',
          body: `당신의 글 "${postTitle}"에 새로운 댓글이 달렸습니다.`,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: `comment-${postId}`,
          data: {
            url: `/posts/${postId}#comments`,
            postId,
            commentId
          }
        };
        url = `/posts/${postId}#comments`;
        break;

      case 'new_follower':
        notification = {
          title: '새로운 팔로워',
          body: '당신을 팔로우하기 시작했습니다.',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'new-follower',
          data: {
            url: '/profile'
          }
        };
        url = '/profile';
        break;

      case 'followed_user_post':
        notification = {
          title: '새로운 포스트',
          body: `팔로우한 사용자가 "${postTitle}" 글을 작성했습니다.`,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: `post-${postId}`,
          data: {
            url: `/posts/${postId}`,
            postId
          }
        };
        url = `/posts/${postId}`;
        break;

      default:
        return NextResponse.json(
          { error: '알 수 없는 알림 타입입니다.' },
          { status: 400 }
        );
    }

    // 대상 사용자의 구독 정보 조회
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', targetUserId);

    if (subError || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: '대상 사용자의 구독 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 알림 전송 결과
    const results = [];
    
    // 각 구독에 대해 알림 전송
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh_key,
            auth: subscription.auth_key
          }
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notification)
        );

        results.push({
          endpoint: subscription.endpoint,
          success: true
        });

      } catch (error) {
        console.error('푸시 알림 전송 실패:', error);
        results.push({
          endpoint: subscription.endpoint,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // 알림 기록 저장 (성공한 알림만)
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: targetUserId,
          type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (notifError) {
        console.error('알림 기록 저장 실패:', notifError);
      }
    }

    return NextResponse.json({
      success: true,
      message: '알림이 전송되었습니다.',
      results: {
        total: results.length,
        successful: successfulResults.length,
        failed: results.length - successfulResults.length,
        details: results
      }
    });

  } catch (error) {
    console.error('알림 전송 중 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}