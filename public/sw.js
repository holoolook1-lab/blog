// Web Push 알림을 위한 서비스 워커
const PUSH_PUBLIC_KEY = process.env.NEXT_PUBLIC_PUSH_PUBLIC_KEY || '';

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const { title, body, icon, badge, tag, data: payload } = data;

    const options = {
      body: body || '새로운 알림이 있습니다.',
      icon: icon || '/icon-192x192.png',
      badge: badge || '/icon-72x72.png',
      tag: tag || 'notification',
      data: payload || {},
      actions: payload?.actions || [],
      requireInteraction: false,
      vibrate: [200, 100, 200],
      silent: false
    };

    event.waitUntil(
      self.registration.showNotification(title || '라키라키 알림', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
    // 텍스트 알림으로 대체
    event.waitUntil(
      self.registration.showNotification('라키라키 알림', {
        body: '새로운 알림이 있습니다.',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: 'notification',
        vibrate: [200, 100, 200]
      })
    );
  }
});

// 알림 클릭 이벤트
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});

// 백그라운드 동기화 (향후 확장용)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
});

// 메시지 수신 (클라이언트와 통신)
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});