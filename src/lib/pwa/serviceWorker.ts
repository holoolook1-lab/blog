/**
 * PWA 서비스 워커 등록 및 관리
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.warn('SW registered: ', registration);
          
          // 업데이트 확인
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 새로운 콘텐츠가 있음
                  console.warn('새로운 콘텐츠가 있습니다.');
                  
                  // 사용자에게 알림 표시 (선택적)
                  if (window.confirm('새로운 버전이 있습니다. 업데이트하시겠습니까?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((registrationError) => {
          console.error('SW registration failed: ', registrationError);
        });
    });
  }
}

/**
 * 서비스 워커 제거 (디버깅용)
 */
export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}

/**
 * 오프라인 상태 감지
 */
export function detectOfflineStatus(callback: (isOffline: boolean) => void) {
  const updateOnlineStatus = () => {
    callback(!navigator.onLine);
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // 초기 상태
  updateOnlineStatus();

  return () => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  };
}

/**
 * 백그라운드 동기화 등록
 */
export function registerBackgroundSync(tag = 'background-sync') {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    return navigator.serviceWorker.ready.then((registration) => {
      return (registration as any).sync.register(tag);
    });
  }
  return Promise.reject('Background sync not supported');
}

/**
 * 푸시 알림 구독
 */
export function subscribeToPushNotifications() {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    return navigator.serviceWorker.ready.then((registration) => {
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });
    });
  }
  return Promise.reject('Push notifications not supported');
}

/**
 * 앱 설치 프롬프트 관리
 */
export function manageAppInstallPrompt() {
  let deferredPrompt: any;

  window.addEventListener('beforeinstallprompt', (e) => {
    // 기본 브라우저 프롬프트 방지
    e.preventDefault();
    deferredPrompt = e;
    
    // 설치 버튼 표시 (선택적)
    console.warn('앱 설치 가능');
    
    // 사용자 정의 설치 프롬프트 표시 로직
    // showInstallPrompt();
  });

  return {
    showInstallPrompt: async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.warn(`User response: ${outcome}`);
        deferredPrompt = null;
        return outcome;
      }
      return null;
    }
  };
}

/**
 * PWA 기능 지원 여부 확인
 */
export function checkPWASupport() {
  return {
    serviceWorker: 'serviceWorker' in navigator,
    backgroundSync: 'serviceWorker' in navigator && 'SyncManager' in window,
    pushNotifications: 'serviceWorker' in navigator && 'PushManager' in window,
    appInstall: 'beforeinstallprompt' in window
  };
}