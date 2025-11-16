/// <reference lib="webworker" />

// Workbox 로딩 시도
let workboxLoaded = false;
try {
  // Workbox를 CDN으로 로드
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
  workboxLoaded = true;
  console.warn('[Service Worker] Workbox is loaded');
} catch (error) {
  console.warn('[Service Worker] Workbox failed to load from CDN:', error);
  // CDN 실패 시 로컬 폴백 시도
  try {
    importScripts('/workbox/workbox-sw.js');
    workboxLoaded = true;
    console.warn('[Service Worker] Workbox loaded from local');
  } catch (localError) {
    console.warn('[Service Worker] Workbox failed to load from local:', localError);
  }
}

if (workboxLoaded && workbox) {
  
  // Precache 설정
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
  
  // 오래된 캐시 정리
  workbox.precaching.cleanupOutdatedCaches();
  
  // 네비게이션 요청 캐싱 - 오프라인 대응
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );
  
  // 정적 리소스 캐싱 (JS, CSS)
  workbox.routing.registerRoute(
    ({ request }) =>
      request.destination === 'script' || request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'assets-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        }),
      ],
    })
  );
  
  // 이미지 캐싱
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  );
  
  // API 요청 캐싱 (게시글, 사용자 데이터 등)
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200, 404],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        }),
      ],
    })
  );
  
  // Supabase 요청 캐싱
  workbox.routing.registerRoute(
    ({ url }) => url.hostname.includes('supabase'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'supabase-cache',
      networkTimeoutSeconds: 5,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 2 * 60, // 2 minutes
        }),
      ],
    })
  );
  
  // 소셜 미디어 캐싱
  workbox.routing.registerRoute(
    ({ url }) => 
      url.hostname.includes('instagram') || 
      url.hostname.includes('facebook') || 
      url.hostname.includes('twitter') || 
      url.hostname.includes('tiktok') || 
      url.hostname.includes('youtube') ||
      url.hostname.includes('naver'),
    new workbox.strategies.CacheFirst({
      cacheName: 'social-media-cache',
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        }),
      ],
    })
  );
  
} else {
  console.error('[Service Worker] Workbox failed to load from both CDN and local');
  // Workbox 없이 기본 서비스 워커 기능만 제공
  console.warn('[Service Worker] Running in basic mode without Workbox');
}

// 설치 이벤트 처리
self.addEventListener('install', (event) => {
  console.warn('[Service Worker] Installing...');
  self.skipWaiting();
});

// 활성화 이벤트 처리
self.addEventListener('activate', (event) => {
  console.warn('[Service Worker] Activating...');
  event.waitUntil(self.clients.claim());
});

// 백그라운드 동기화 (향후 사용)
self.addEventListener('sync', (event) => {
  console.warn('[Service Worker] Background sync:', event.tag);
});

// 푸시 알림 (향후 사용)
self.addEventListener('push', (event) => {
  console.warn('[Service Worker] Push received:', event);
});

// 메시지 처리 (앱과의 통신)
self.addEventListener('message', (event) => {
  console.warn('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 오프라인 페이지 처리
const OFFLINE_PAGE = '/offline.html';

// 네트워크 실패 시 오프라인 페이지 표시
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_PAGE))
        .then((response) => response || caches.match(OFFLINE_PAGE))
    );
  }
});