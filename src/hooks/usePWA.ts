import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  installApp: () => Promise<void>;
}

export function usePWAInstall(): PWAInstallState {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // 이미 설치되어 있는지 확인
    const checkInstalled = () => {
      if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
        // @ts-expect-error - getInstalledRelatedApps는 아직 표준화되지 않은 API입니다
        navigator.getInstalledRelatedApps().then((apps: any[]) => {
          const isAppInstalled = apps.some(app => app.id === 'rakiraki-blog');
          setIsInstalled(isAppInstalled);
        });
      } else if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    // 설치 프롬프트 이벤트 처리
    const handleBeforeInstallPrompt = (e: Event) => {
      console.warn('[PWA] 설치 프롬프트 감지');
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // 앱 설치 이벤트 처리
    const handleAppInstalled = () => {
      console.warn('[PWA] 앱 설치 완료');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      
      // 설치 완료 알림
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('락이락이 블로그', {
          body: '앱 설치가 완료되었습니다!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
        });
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 초기 상태 확인
    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 앱 설치 함수
  const installApp = async () => {
    if (!installPrompt) {
      console.warn('[PWA] 설치 프롬프트가 없습니다');
      return;
    }

    try {
      console.warn('[PWA] 설치 프롬프트 표시');
      await installPrompt.prompt();
      
      const { outcome } = await installPrompt.userChoice;
      console.warn('[PWA] 사용자 선택:', outcome);
      
      if (outcome === 'accepted') {
        console.warn('[PWA] 사용자가 설치를 수락했습니다');
      } else {
        console.warn('[PWA] 사용자가 설치를 거부했습니다');
        setIsInstallable(false);
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error('[PWA] 설치 중 오류:', error);
      setIsInstallable(false);
      setInstallPrompt(null);
    }
  };

  return {
    isInstallable,
    isInstalled,
    installPrompt,
    installApp,
  };
}

// PWA 상태를 추적하는 훅
export function usePWAStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<'unsupported' | 'installing' | 'installed' | 'error'>('unsupported');

  useEffect(() => {
    // 온라인 상태 추적
    const handleOnline = () => {
      console.warn('[PWA] 온라인 상태');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.warn('[PWA] 오프라인 상태');
      setIsOnline(false);
    };

    // Service Worker 상태 확인
    const checkServiceWorker = async () => {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          console.warn('[PWA] Service Worker 준비 완료:', registration);
          setServiceWorkerStatus('installed');
        } catch (error) {
          console.error('[PWA] Service Worker 등록 실패:', error);
          setServiceWorkerStatus('error');
        }
      }
    };

    // 이벤트 리스너 등록
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 초기 상태 설정
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    checkServiceWorker();

    // Service Worker 업데이트 확인
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.warn('[PWA] 새로운 Service Worker가 활성화되었습니다');
        // 새로운 버전이 있으면 페이지 새로고침
        if (confirm('새로운 버전이 있습니다. 업데이트하시겠습니까?')) {
          window.location.reload();
        }
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    serviceWorkerStatus,
  };
}

// Service Worker 등록 함수
export async function registerServiceWorker() {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.warn('[PWA] Service Worker 등록 성공:', registration);
      
      // 업데이트 확인
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && typeof navigator !== 'undefined' && navigator.serviceWorker.controller) {
            console.warn('[PWA] 새로운 Service Worker 버전이 있습니다');
          }
        });
      });
      
      return registration;
    } catch (error) {
      console.error('[PWA] Service Worker 등록 실패:', error);
      throw error;
    }
  } else {
    console.warn('[PWA] Service Worker를 지원하지 않는 브라우저입니다');
    throw new Error('Service Worker not supported');
  }
}

// 캐시 관리 함수
export async function clearAllCaches() {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
      await Promise.all(deletePromises);
      console.warn('[PWA] 모든 캐시가 삭제되었습니다');
    } catch (error) {
      console.error('[PWA] 캐시 삭제 실패:', error);
      throw error;
    }
  }
}

// 오프라인 콘텐츠 미리 캐싱
export async function precacheOfflineContent() {
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const cache = await caches.open('offline-cache');
      const urlsToCache = [
        '/',
        '/offline.html',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
      ];
      
      await cache.addAll(urlsToCache);
      console.warn('[PWA] 오프라인 콘텐츠가 캐싱되었습니다');
    } catch (error) {
      console.error('[PWA] 오프라인 콘텐츠 캐싱 실패:', error);
    }
  }
}