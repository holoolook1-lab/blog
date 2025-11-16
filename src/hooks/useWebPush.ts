import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function useWebPush() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Web Push 지원 확인
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkExistingSubscription();
    }
  }, []);

  // 기존 구독 확인
  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        const subscriptionData = {
          endpoint: existingSubscription.endpoint,
          keys: {
            p256dh: existingSubscription.toJSON().keys?.p256dh || '',
            auth: existingSubscription.toJSON().keys?.auth || ''
          }
        };
        setSubscription(subscriptionData);
      }
    } catch (error) {
      console.error('기존 구독 확인 실패:', error);
    }
  };

  // 알림 권한 요청 및 구독
  const subscribeToPush = async () => {
    if (!isSupported) {
      console.warn('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return;
    }

    setIsLoading(true);

    try {
      // 권한 확인 및 요청
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('알림 권한이 거부되었습니다.');
        setIsLoading(false);
        return;
      }

      // Service Worker 등록
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID 공개키 가져오기
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID 공개키가 설정되지 않았습니다.');
      }

      // 기존 구독 확인 및 해지
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }

      // 새 구독 생성
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      const subscriptionData = {
        endpoint: newSubscription.endpoint,
        keys: {
          p256dh: newSubscription.toJSON().keys?.p256dh || '',
          auth: newSubscription.toJSON().keys?.auth || ''
        }
      };

      // 서버에 구독 정보 전송
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription: subscriptionData }),
      });

      if (!response.ok) {
        throw new Error('구독 정보 저장 실패');
      }

      setSubscription(subscriptionData);
      console.log('푸시 알림이 활성화되었습니다.');

    } catch (error) {
      console.error('푸시 구독 실패:', error);
      console.error('푸시 알림 구독에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 구독 취소
  const unsubscribeFromPush = async () => {
    setIsLoading(true);

    try {
      // 서버에서 구독 정보 삭제
      const response = await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('구독 정보 삭제 실패');
      }

      // 브라우저에서 구독 해지
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      }

      setSubscription(null);
      console.log('푸시 알림이 비활성화되었습니다.');

    } catch (error) {
      console.error('푸시 구독 취소 실패:', error);
      console.error('푸시 알림 취소에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 알림 보내기 (테스트용)
  const sendTestNotification = async () => {
    if (!subscription) {
      console.warn('먼저 푸시 알림을 구독해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'test',
          targetUserId: 'current-user',
          title: '테스트 알림',
          body: '이것은 테스트 알림입니다.'
        }),
      });

      if (!response.ok) {
        throw new Error('테스트 알림 전송 실패');
      }

      toast.success('테스트 알림이 전송되었습니다.');

    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
      toast.error('테스트 알림 전송에 실패했습니다.');
    }
  };

  return {
    isSupported,
    subscription,
    isLoading,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
    isSubscribed: !!subscription
  };
}