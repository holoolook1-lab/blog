'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            인터넷 연결이 끊어졌습니다
          </h1>
          
          <p className="text-gray-600 mb-6">
            RakiRaki 블로그를 사용하려면 인터넷 연결이 필요합니다. 
            연결 상태를 확인하고 다시 시도해주세요.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              다시 시도
            </button>
            
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              뒤로 가기
            </button>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              오프라인에서 할 수 있는 것들
            </h2>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                이전에 열어본 글 읽기
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                저장된 콘텐츠 보기
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                글 작성 (연결되면 자동 저장)
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            RakiRaki 블로그는 PWA 기술을 사용하여 오프라인에서도 
            일부 기능을 사용할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}