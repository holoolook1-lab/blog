import { usePWAStatus } from '@/hooks/usePWA';
import { Wifi, WifiOff, RefreshCw, HardDrive } from 'lucide-react';
import { useState } from 'react';

export function PWAStatus() {
  const { isOnline, serviceWorkerStatus } = usePWAStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
      window.location.reload();
    } catch (error) {
      console.error('새로고침 실패:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getServiceWorkerStatus = () => {
    switch (serviceWorkerStatus) {
      case 'installed':
        return { color: 'text-green-600', text: '활성' };
      case 'installing':
        return { color: 'text-yellow-600', text: '설치 중' };
      case 'error':
        return { color: 'text-red-600', text: '오류' };
      default:
        return { color: 'text-gray-600', text: '미지원' };
    }
  };

  const swStatus = getServiceWorkerStatus();

  return (
    <div className="fixed top-20 right-4 z-40 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-900">앱 상태</h4>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          title="새로고침"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="space-y-2">
        {/* 네트워크 상태 */}
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? '온라인' : '오프라인'}
          </span>
        </div>

        {/* Service Worker 상태 */}
        <div className="flex items-center space-x-2">
          <HardDrive className={`w-4 h-4 ${swStatus.color}`} />
          <span className={`text-sm ${swStatus.color}`}>
            Service Worker: {swStatus.text}
          </span>
        </div>

        {/* 캐시 정보 */}
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
          <div>캐시 사용 가능</div>
          <div className="text-xs text-gray-400">오프라인 읽기 지원</div>
        </div>
      </div>
    </div>
  );
}

// 간단한 상태 표시기 (헤더에 표시)
export function PWAStatusIndicator() {
  const { isOnline } = usePWAStatus();

  return (
    <div className="flex items-center justify-center" title={isOnline ? '온라인' : '오프라인'}>
      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-gray-400' : 'bg-gray-600'}`}></div>
    </div>
  );
}