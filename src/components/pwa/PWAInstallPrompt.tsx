'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWA';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 설치 가능하고 아직 설치되지 않았으며, 이전에 거부하지 않은 경우
    if (isInstallable && !isInstalled && !dismissed) {
      // 5초 후에 설치 프롬프트 표시
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isInstallable, isInstalled, dismissed]);

  const handleInstall = async () => {
    try {
      await installApp();
      setShowPrompt(false);
    } catch (error) {
      console.error('설치 실패:', error);
      alert('앱 설치에 실패했습니다. 브라우저 설정을 확인해주세요.');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    // 24시간 동안 다시 표시하지 않음
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  // 이전에 거부한 적이 있는지 확인
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-dismissed');
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setDismissed(true);
      } else {
        // 24시간이 지났으면 다시 표시 가능
        localStorage.removeItem('pwa-dismissed');
      }
    }
  }, []);

  if (!showPrompt || isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md mx-auto md:mx-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg p-2">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">앱으로 설치하기</h3>
              <p className="text-sm text-gray-600">홈화면에 바로가기를 추가하세요</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>빠른 실행 속도</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>오프라인 읽기 지원</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>푸시 알림 기능</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleInstall}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>설치하기</span>
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            나중에
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            <Monitor className="w-3 h-3 inline mr-1" />
            데스크톱과 모바일 모두에서 사용 가능
          </p>
        </div>
      </div>
    </div>
  );
}

// iOS Safari용 설치 안내 컴포넌트
export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // iOS Safari 감지
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    setIsIOS(isIOSDevice && isSafari);

    if (isIOSDevice && isSafari) {
      // iOS Safari에서는 beforeinstallprompt 이벤트가 없음
      // 10초 후에 설치 안내 표시
      const timer = setTimeout(() => {
        const dismissed = localStorage.getItem('ios-install-dismissed');
        if (!dismissed || (Date.now() - parseInt(dismissed)) > 24 * 60 * 60 * 1000) {
          setShowPrompt(true);
        }
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-dismissed', Date.now().toString());
  };

  if (!showPrompt || !isIOS) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-md mx-auto md:mx-0">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg p-2">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">iOS 앱 설치하기</h3>
              <p className="text-sm text-gray-600">Safari에서 홈화면에 추가하세요</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 mb-2">설치 방법:</p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>하단의 공유 버튼 클릭</li>
              <li>"홈 화면에 추가" 선택</li>
              <li>추가 버튼 클릭</li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

// 설치 가능 상태를 표시하는 배지
export function PWAInstallBadge() {
  const { isInstallable, isInstalled, installApp } = usePWAInstall();
  const [showBadge, setShowBadge] = useState(true);

  if (!isInstallable || isInstalled || !showBadge) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <button
        onClick={() => {
          setShowBadge(false);
          installApp();
        }}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
        title="앱 설치하기"
      >
        <Download className="w-6 h-6" />
      </button>
    </div>
  );
}