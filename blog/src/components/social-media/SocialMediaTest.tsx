import React, { useState } from 'react';
import { processSocialLink } from '@/lib/social-media/processor';
import SocialLinkCard from './SocialLinkCard';

const testUrls = [
  // YouTube
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://www.youtube.com/shorts/1234567890ab',
  
  // Instagram
  'https://www.instagram.com/p/C0ABC123DEF/',
  'https://instagr.am/p/C0ABC123DEF/',
  'https://www.instagram.com/reel/C0ABC123DEF/',
  
  // Twitter
  'https://twitter.com/username/status/1234567890123456789',
  'https://x.com/username/status/1234567890123456789',
  
  // TikTok
  'https://www.tiktok.com/@username/video/1234567890123456789',
  'https://vt.tiktok.com/1234567890/',
  
  // Facebook
  'https://www.facebook.com/username/posts/1234567890123456',
  'https://fb.watch/1234567890/',
  
  // NaverTV
  'https://tv.naver.com/v/1234567890',
  'https://m.tv.naver.com/v/1234567890',
  
  // Short URLs
  'https://bit.ly/3abc123',
  'https://tinyurl.com/abc123',
  'https://t.co/1234567890'
];

export default function SocialMediaTest() {
  const [results, setResults] = useState<Array<{url: string, result: any, error: any}>>([]);
  const [isTesting, setIsTesting] = useState(false);

  const runTests = async () => {
    setIsTesting(true);
    const testResults = [];

    for (const url of testUrls) {
      try {
        console.log(`Testing URL: ${url}`);
        const startTime = Date.now();
        const result = await processSocialLink(url);
        const endTime = Date.now();
        
        testResults.push({
          url,
          result: {
            ...result,
            processingTime: `${endTime - startTime}ms`
          },
          error: null
        });
        
        console.log(`✅ Success: ${url} (${endTime - startTime}ms)`);
        console.log('Result:', result);
      } catch (error) {
        console.error(`❌ Error: ${url}`, error);
        testResults.push({
          url,
          result: null,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    setResults(testResults);
    setIsTesting(false);
  };

  const testSingleUrl = async (url: string) => {
    try {
      console.log(`Testing single URL: ${url}`);
      const startTime = Date.now();
      const result = await processSocialLink(url);
      const endTime = Date.now();
      
      console.log(`✅ Success: ${url} (${endTime - startTime}ms)`);
      console.log('Result:', result);
      
      return result;
    } catch (error) {
      console.error(`❌ Error: ${url}`, error);
      throw error;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">소셜 미디어 통합 테스트</h1>
      
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isTesting}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isTesting ? '테스트 중...' : '전체 테스트 실행'}
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">테스트 결과</h2>
        {results.length === 0 ? (
          <p className="text-gray-500">테스트를 실행해주세요.</p>
        ) : (
          <div className="space-y-4">
            {results.map((test, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm break-all">{test.url}</p>
                    {test.result && (
                      <p className="text-green-600 text-sm">
                        ✅ 성공 ({test.result.processingTime})
                      </p>
                    )}
                    {test.error && (
                      <p className="text-red-600 text-sm">
                        ❌ 실패: {test.error}
                      </p>
                    )}
                  </div>
                </div>
                
                {test.result && (
                  <div className="mt-3">
                    <SocialLinkCard 
                      url={test.url} 
                      processedLink={test.result}
                      onEmbed={() => console.log('Embed requested:', test.url)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">단일 URL 테스트</h2>
        <SingleUrlTest onTest={testSingleUrl} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">지원 플랫폼</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['YouTube', 'Instagram', 'Twitter', 'TikTok', 'Facebook', 'NaverTV'].map(platform => (
            <div key={platform} className="bg-gray-100 p-3 rounded text-center">
              {platform}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SingleUrlTest({ onTest }: { onTest: (url: string) => Promise<any> }) {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    if (!url.trim()) return;
    
    setIsTesting(true);
    setError(null);
    setResult(null);

    try {
      const testResult = await onTest(url.trim());
      setResult(testResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="테스트할 URL을 입력하세요..."
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleTest}
          disabled={isTesting || !url.trim()}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {isTesting ? '테스트 중...' : '테스트'}
        </button>
      </div>

      {result && (
        <div className="border rounded-lg p-4 bg-green-50">
          <h3 className="font-semibold mb-2">결과</h3>
          <pre className="text-sm overflow-auto bg-white p-2 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
          <div className="mt-3">
            <SocialLinkCard 
              url={url} 
              processedLink={result}
              onEmbed={() => console.log('Embed requested:', url)}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="border rounded-lg p-4 bg-red-50">
          <h3 className="font-semibold text-red-600 mb-2">오류</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}