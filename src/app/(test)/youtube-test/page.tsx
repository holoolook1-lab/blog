'use client';

import { useState } from 'react';
import PostDetail from '@/components/blog/PostDetail';

export default function YouTubeTestPage() {
  const [testContent, setTestContent] = useState(`
    이것은 테스트 게시글입니다.
    
    여기에 YouTube 링크가 있습니다: https://www.youtube.com/watch?v=dQw4w9WgXcQ
    
    그리고 여기에도 있습니다: https://youtu.be/dQw4w9WgXcQ
    
    그리고 shorts도 테스트해봅시다: https://www.youtube.com/shorts/dQw4w9WgXcQ
    
    일반 텍스트와 함께 섞여있는 경우도 테스트합니다.
    
    또 다른 링크: https://www.youtube.com/watch?v=9bZkp7q19f0
    
    이제 이 모든 링크가 제대로 임베드되어야 합니다.
  `);

  const [title] = useState('YouTube 링크 테스트 게시글');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">YouTube 링크 테스트</h1>
        <p className="text-secondary-600 mb-4">
          이 페이지는 YouTube 링크가 제대로 임베드되는지 테스트합니다.
        </p>
        
        <div className="bg-secondary-50 p-4 rounded-lg mb-4">
          <h3 className="font-semibold mb-2">테스트 내용:</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
            {testContent}
          </pre>
        </div>
      </div>

      <div className="border-t pt-6">
        <h2 className="text-xl font-semibold mb-4">렌더링 결과:</h2>
        <PostDetail title={title} content={testContent} />
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">예상 결과:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 모든 YouTube 링크가 iframe으로 변환되어야 함</li>
          <li>• 임베드된 비디오는 반응형으로 표시되어야 함</li>
          <li>• 일반 텍스트는 그대로 표시되어야 함</li>
          <li>• 처리된 링크 수가 하단에 표시되어야 함</li>
        </ul>
      </div>
    </div>
  );
}