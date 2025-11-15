'use client';

import { useState } from 'react';
import { processContentUrls } from '@/lib/utils/contentProcessor';

export default function TestYouTubePage() {
  const [testContent, setTestContent] = useState(`
    <p>이것은 테스트 게시물입니다.</p>
    <p>YouTube 링크: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
    <p>다른 YouTube 링크: https://youtu.be/3JZ_D3ELwOQ</p>
    <p>일반 텍스트와 함께 있습니다.</p>
  `);
  
  const processedContent = processContentUrls(testContent);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">YouTube 링크 변환 테스트</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">원본 콘텐츠</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <div dangerouslySetInnerHTML={{ __html: testContent }} />
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">변환된 콘텐츠</h2>
          <div className="bg-white p-4 rounded-lg border">
            <div dangerouslySetInnerHTML={{ __html: processedContent.html }} />
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">처리 결과</h3>
        <p>미디어 포함: {processedContent.hasMedia ? '예' : '아니오'}</p>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">직접 테스트</h3>
        <textarea
          value={testContent}
          onChange={(e) => setTestContent(e.target.value)}
          className="w-full h-32 p-3 border rounded-lg"
          placeholder="테스트할 HTML 콘텐츠를 입력하세요..."
        />
      </div>
    </div>
  );
}