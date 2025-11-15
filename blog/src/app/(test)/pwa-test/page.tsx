'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall, usePWAStatus, registerServiceWorker, clearAllCaches, precacheOfflineContent } from '@/hooks/usePWA';
import { PWAStatus } from '@/components/pwa/PWAStatus';
import { Download, RefreshCw, HardDrive, Wifi, WifiOff, Smartphone, Monitor } from 'lucide-react';

export default function PWATestPage() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const { isOnline, serviceWorkerStatus } = usePWAStatus();
  const [isLoading, setIsLoading] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<string>('');

  // Service Worker 상태 확인
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        console.warn('Service Worker is ready:', registration);
      });
    }
  }, []);

  // 캐시 정보 가져오기
  useEffect(() => {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        setCacheInfo(`캐시 저장소: ${cacheNames.join(', ')}`);
      });
    }
  }, []);

  const handleInstallPWA = async () => {
    try {
      await installApp();
    } catch (error) {
      console.error('PWA 설치 실패:', error);
      alert('PWA 설치에 실패했습니다.');
    }
  };

  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      await clearAllCaches();
      alert('모든 캐시가 삭제되었습니다.');
      setCacheInfo('캐시가 비워졌습니다.');
    } catch (error) {
      console.error('캐시 삭제 실패:', error);
      alert('캐시 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrecache = async () => {
    setIsLoading(true);
    try {
      await precacheOfflineContent();
      alert('오프라인 콘텐츠가 캐싱되었습니다.');
    } catch (error) {
      console.error('캐싱 실패:', error);
      alert('캐싱에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const testOfflineMode = () => {
    // 네트워크 요청 차단하여 오프라인 모드 시뮬레이션
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'TEST_OFFLINE' });
      alert('오프라인 모드로 전환되었습니다. 네트워크 연결을 끊고 테스트해보세요.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PWA (Progressive Web App) 테스트</h1>
        <p className="text-gray-600">락이락이 블로그의 PWA 기능을 테스트합니다.</p>
      </div>

      {/* 상태 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="flex justify-center mb-3">
            {isOnline ? (
              <Wifi className="w-8 h-8 text-green-600" />
            ) : (
              <WifiOff className="w-8 h-8 text-red-600" />
            )}
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">네트워크 상태</h3>
          <p className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? '온라인' : '오프라인'}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="flex justify-center mb-3">
            <HardDrive className={`w-8 h-8 ${
              serviceWorkerStatus === 'installed' ? 'text-green-600' :
              serviceWorkerStatus === 'installing' ? 'text-yellow-600' :
              serviceWorkerStatus === 'error' ? 'text-red-600' :
              'text-gray-600'
            }`} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Service Worker</h3>
          <p className={`text-sm ${
            serviceWorkerStatus === 'installed' ? 'text-green-600' :
            serviceWorkerStatus === 'installing' ? 'text-yellow-600' :
            serviceWorkerStatus === 'error' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {serviceWorkerStatus === 'installed' ? '활성' :
             serviceWorkerStatus === 'installing' ? '설치 중' :
             serviceWorkerStatus === 'error' ? '오류' :
             '미지원'}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6 text-center">
          <div className="flex justify-center mb-3">
            <Smartphone className={`w-8 h-8 ${
              isInstalled ? 'text-green-600' :
              isInstallable ? 'text-blue-600' :
              'text-gray-600'
            }`} />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">앱 설치</h3>
          <p className={`text-sm ${
            isInstalled ? 'text-green-600' :
            isInstallable ? 'text-blue-600' :
            'text-gray-600'
          }`}>
            {isInstalled ? '설치됨' :
             isInstallable ? '설치 가능' :
             '설치 불가'}
          </p>
        </div>
      </div>

      {/* 설치 버튼 */}
      {isInstallable && !isInstalled && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">앱 설치하기</h3>
              <p className="text-sm text-gray-600">홈화면에 바로가기를 추가하여 빠르게 접속하세요.</p>
            </div>
            <button
              onClick={handleInstallPWA}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>설치하기</span>
            </button>
          </div>
        </div>
      )}

      {/* 기능 테스트 */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">기능 테스트</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">캐시 관리</h3>
            <p className="text-sm text-gray-600 mb-4">브라우저 캐시를 관리합니다.</p>
            <div className="space-y-2">
              <button
                onClick={handleClearCache}
                disabled={isLoading}
                className="w-full bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {isLoading ? '처리 중...' : '캐시 비우기'}
              </button>
              <button
                onClick={handlePrecache}
                disabled={isLoading}
                className="w-full bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {isLoading ? '처리 중...' : '오프라인 콘텐츠 캐싱'}
              </button>
            </div>
            {cacheInfo && (
              <p className="text-xs text-gray-500 mt-2">{cacheInfo}</p>
            )}
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">오프라인 테스트</h3>
            <p className="text-sm text-gray-600 mb-4">오프라인 모드를 시뮬레이션합니다.</p>
            <button
              onClick={testOfflineMode}
              className="w-full bg-yellow-50 text-yellow-600 border border-yellow-200 px-4 py-2 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              오프라인 모드 테스트
            </button>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">상태 표시기</h3>
            <p className="text-sm text-gray-600 mb-4">상세한 PWA 상태 정보를 확인합니다.</p>
            <PWAStatus />
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-2">브라우저 정보</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 50) + '...' : '브라우저 정보 없음'}</div>
              <div>Service Worker: {typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? '지원' : '미지원'}</div>
              <div>Cache API: {typeof window !== 'undefined' && 'caches' in window ? '지원' : '미지원'}</div>
              <div>Notification: {typeof window !== 'undefined' && 'Notification' in window ? '지원' : '미지원'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 설치 가이드 */}
      <div className="bg-gray-50 rounded-lg border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">PWA 설치 가이드</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Monitor className="w-4 h-4 mr-2" />
              데스크톱 (Chrome, Edge)
            </h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>주소창 오른쪽의 다운로드 아이콘 클릭</li>
              <li>"설치" 버튼 클릭</li>
              <li>앱이 설치되면 바로가기 생성</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <Smartphone className="w-4 h-4 mr-2" />
              모바일 (Android)
            </h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>브라우저 메뉴 열기</li>
              <li>"홈화면에 추가" 선택</li>
              <li>추가 버튼 클릭</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}