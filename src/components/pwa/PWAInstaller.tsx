'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/index';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/index';
import { Smartphone, Download, X, Settings, Bell, Wifi } from 'lucide-react';
import { manageAppInstallPrompt, checkPWASupport } from '@/lib/pwa/serviceWorker';

export default function PWAInstaller() {
  const [showInstaller, setShowInstaller] = useState(false);
  const [pwaSupport, setPwaSupport] = useState<any>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // PWA 지원 여부 확인
    const support = checkPWASupport();
    setPwaSupport(support);

    // 앱 설치 프롬프트 관리
    const { showInstallPrompt } = manageAppInstallPrompt();
    setInstallPrompt(() => showInstallPrompt);

    // 이미 설치되었는지 확인 (display-mode 미디어 쿼리)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isFullScreen = window.matchMedia('(display-mode: fullscreen)').matches;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    setIsInstalled(isStandalone || isFullScreen || isMinimalUI);

    // 설치 프롬프트 표시 타이밍 (3초 후)
    const timer = setTimeout(() => {
      if (!isStandalone && support.appInstall) {
        setShowInstaller(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      const result = await installPrompt();
      if (result === 'accepted') {
        setShowInstaller(false);
        setIsInstalled(true);
      }
    }
  };

  const handleClose = () => {
    setShowInstaller(false);
  };

  if (isInstalled) {
    return null;
  }

  if (!showInstaller || !pwaSupport?.appInstall) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Smartphone className="h-6 w-6 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-lg">앱 설치하기</CardTitle>
                <CardDescription>
                  RakiRaki 블로그를 홈화면에 추가하세요
                </CardDescription>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">앱 설치의 장점</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Wifi className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">오프라인 지원</p>
                  <p className="text-xs text-gray-600">인터넷 없이도 읽고 쓸 수 있어요</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">푸시 알림</p>
                  <p className="text-xs text-gray-600">새 글과 댓글 알림을 받아요</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">네이티브 경험</p>
                  <p className="text-xs text-gray-600">앱처럼 빠르고 편리해요</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              설치하기
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
            >
              나중에
            </Button>
          </div>
          
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              무료 • 용량: ~2MB
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}