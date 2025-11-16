import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  new_follower: boolean;
  new_comment: boolean;
  comment_reply: boolean;
  post_reaction: boolean;
}

interface Notification {
  id: string;
  type: 'follow' | 'comment' | 'reply' | 'reaction' | 'system';
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

interface UseNotificationsReturn {
  settings: NotificationSettings | null;
  notifications: Notification[];
  loading: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // 브라우저 알림 권한 확인
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // 알림 설정 및 구독 상태 로드
  useEffect(() => {
    loadNotificationData();
  }, []);

  const loadNotificationData = async () => {
    try {
      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 알림 설정 로드
      const { data: settingsData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsData) {
        setSettings(settingsData);
      }

      // 최근 알림 로드
      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (notificationsData) {
        setNotifications(notificationsData);
      }

      // 푸시 구독 상태 확인
      const { data: subscriptionData } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      setIsSubscribed(!!subscriptionData && subscriptionData.length > 0);

    } catch (error) {
      console.error('알림 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 푸시 알림 구독
  const subscribeToPush = async (): Promise<boolean> => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
        return false;
      }

      // 권한 요청
      if (Notification.permission === 'denied') {
        alert('알림 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
        return false;
      }

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        setPermission(permission);
        if (permission !== 'granted') {
          return false;
        }
      }

      // 서비스 워커 등록
      const registration = await navigator.serviceWorker.register('/sw.js');
      await registration.update();

      // 푸시 구독 생성
      const vapidPublicKey = process.env.NEXT_PUBLIC_PUSH_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID 공개키가 설정되지 않았습니다.');
        return false;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      const subscriptionData = subscription.toJSON();
      if (!subscriptionData.endpoint || !subscriptionData.keys) {
        throw new Error('Invalid subscription data');
      }

      // 서버에 구독 정보 전송
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth,
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        
        // 알림 설정 업데이트
        if (settings) {
          const { error } = await supabase
            .from('notification_settings')
            .update({ push_enabled: true })
            .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

          if (!error) {
            setSettings({ ...settings, push_enabled: true });
          }
        }

        return true;
      } else {
        const data = await response.json();
        alert(data.error || '푸시 알림 구독에 실패했습니다.');
        return false;
      }

    } catch (error) {
      console.error('푸시 구독 오류:', error);
      alert('푸시 알림 구독 중 오류가 발생했습니다.');
      return false;
    }
  };

  // 푸시 알림 구독 취소
  const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const subscriptionData = subscription.toJSON();
        
        // 서버에서 구독 정보 삭제
        const response = await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            endpoint: subscriptionData.endpoint,
          }),
        });

        if (response.ok) {
          await subscription.unsubscribe();
          setIsSubscribed(false);

          // 알림 설정 업데이트
          if (settings) {
            const { error } = await supabase
              .from('notification_settings')
              .update({ push_enabled: false })
              .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

            if (!error) {
              setSettings({ ...settings, push_enabled: false });
            }
          }

          return true;
        }
      }

      return false;

    } catch (error) {
      console.error('푸시 구독 취소 오류:', error);
      return false;
    }
  };

  // 알림 설정 업데이트
  const updateSettings = async (newSettings: Partial<NotificationSettings>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !settings) return false;

      const updatedSettings = { ...settings, ...newSettings };
      
      const { error } = await supabase
        .from('notification_settings')
        .update(updatedSettings)
        .eq('user_id', user.id);

      if (error) {
        console.error('알림 설정 업데이트 오류:', error);
        return false;
      }

      setSettings(updatedSettings);
      return true;

    } catch (error) {
      console.error('알림 설정 업데이트 오류:', error);
      return false;
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('알림 읽음 처리 오류:', error);
        return false;
      }

      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );

      return true;

    } catch (error) {
      console.error('알림 읽음 처리 오류:', error);
      return false;
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async (): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('전체 알림 읽음 처리 오류:', error);
        return false;
      }

      // 로컬 상태 업데이트
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );

      return true;

    } catch (error) {
      console.error('전체 알림 읽음 처리 오류:', error);
      return false;
    }
  };

  return {
    settings,
    notifications,
    loading,
    permission,
    isSubscribed,
    subscribeToPush,
    unsubscribeFromPush,
    updateSettings,
    markAsRead,
    markAllAsRead,
  };
}