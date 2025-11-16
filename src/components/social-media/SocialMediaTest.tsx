'use client';

import { useState } from 'react';
import { processSocialLink } from '@/lib/social-media/processor';
import SocialLinkCard from './SocialLinkCard';

const TEST_LINKS = {
  youtube: [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/shorts/6ZfuNTqbHE8',
    'https://www.youtube.com/live/1234567890',
    'https://youtube.com/channel/UC1234567890',
    'https://youtube.com/c/PewDiePie',
    'https://youtube.com/@pewdiepie',
    'https://youtube.com/playlist?list=PL1234567890'
  ],
  instagram: [
    'https://www.instagram.com/p/CU1K0wKJ8ZJ/',
    'https://instagr.am/p/CU1K0wKJ8ZJ/',
    'https://instagram.com/reel/CU1K0wKJ8ZJ/',
    'https://instagram.com/tv/CU1K0wKJ8ZJ/',
    'https://www.instagram.com/username',
    'https://instagram.com/stories/username/1234567890',
    'https://www.instagram.com/p/CU1K0wKJ8ZJ/?taken-by=username',
    'https://instagram.com/explore/tags/koreanfood/',
    'https://www.instagram.com/accounts/login/',
    'https://instagram.com/direct/inbox/'
  ],
  twitter: [
    'https://twitter.com/username/status/1234567890',
    'https://mobile.twitter.com/username/status/1234567890',
    'https://twitter.com/username/status/1234567890/photo/1',
    'https://twitter.com/username/status/1234567890/video/1',
    'https://twitter.com/username',
    'https://twitter.com/username/lists',
    'https://twitter.com/hashtag/koreanfood',
    'https://twitter.com/search?q=koreanfood',
    'https://twitter.com/messages',
    'https://twitter.com/settings'
  ],
  facebook: [
    'https://www.facebook.com/watch/?v=1234567890',
    'https://facebook.com/video.php?v=1234567890',
    'https://www.facebook.com/username/posts/1234567890',
    'https://facebook.com/photo.php?fbid=1234567890',
    'https://www.facebook.com/username',
    'https://facebook.com/pages/category/category-name/page-name/',
    'https://www.facebook.com/groups/groupname/permalink/1234567890/',
    'https://facebook.com/events/1234567890/',
    'https://www.facebook.com/marketplace/item/1234567890/',
    'https://facebook.com/watch/live/?v=1234567890'
  ],
  tiktok: [
    'https://www.tiktok.com/@username/video/1234567890',
    'https://m.tiktok.com/v/1234567890.html',
    'https://vm.tiktok.com/1234567890/',
    'https://vt.tiktok.com/1234567890/',
    'https://www.tiktok.com/@username',
    'https://tiktok.com/tag/koreanfood',
    'https://www.tiktok.com/music/original-sound-1234567890',
    'https://tiktok.com/discover/koreanfood',
    'https://www.tiktok.com/live/1234567890',
    'https://tiktok.com/@username/live'
  ],
  navertv: [
    'https://tv.naver.com/v/1234567890',
    'https://tv.naver.com/clip/CLIP123456',
    'https://tv.naver.com/cast/contents/contents_id',
    'https://tv.naver.com/channel/123456/clips',
    'https://tv.naver.com/channel/123456',
    'https://tv.naver.com/category/category_id',
    'https://tv.naver.com/ranking/daily',
    'https://tv.naver.com/ranking/weekly',
    'https://tv.naver.com/search?query=koreanfood',
    'https://tv.naver.com/my/index.nhn'
  ]
};

const SHORT_URLS = [
  'https://bit.ly/3example',
  'https://tinyurl.com/2example',
  'https://goo.gl/example',
  'https://t.co/example',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://instagr.am/p/example',
  'https://fb.me/example',
  'https://tiktok.com/@example',
  'https://vm.tiktok.com/example',
  'https://vt.tiktok.com/example'
];

export function SocialMediaTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState<'all' | 'youtube' | 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'navertv' | 'short'>('all');

  const runTests = async () => {
    setLoading(true);
    const newResults: Record<string, any> = {};
    
    const linksToTest = testType === 'all' 
      ? [...Object.values(TEST_LINKS).flat(), ...SHORT_URLS]
      : testType === 'short'
      ? SHORT_URLS
      : TEST_LINKS[testType as keyof typeof TEST_LINKS];

    for (const link of linksToTest) {
      try {
        const startTime = Date.now();
        const result = await processSocialLink(link);
        const endTime = Date.now();
        
        newResults[link] = {
          success: true,
          result,
          processingTime: endTime - startTime,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        newResults[link] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        };
      }
    }
    
    setResults(newResults);
    setLoading(false);
  };

  const getSuccessRate = () => {
    const values = Object.values(results);
    if (values.length === 0) return 0;
    const successful = values.filter(r => r.success).length;
    return (successful / values.length * 100).toFixed(1);
  };

  const getAverageProcessingTime = () => {
    const values = Object.values(results).filter(r => r.success && r.processingTime);
    if (values.length === 0) return 0;
    const total = values.reduce((sum, r) => sum + r.processingTime, 0);
    return (total / values.length).toFixed(0);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">소셜 미디어 통합 시스템 테스트</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <select 
            value={testType} 
            onChange={(e) => setTestType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">전체 테스트</option>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="navertv">NaverTV</option>
            <option value="short">짧은 URL</option>
          </select>
          
          <button
            onClick={runTests}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '테스트 중...' : '테스트 실행'}
          </button>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-semibold">총 테스트:</span> {Object.keys(results).length}
              </div>
              <div>
                <span className="font-semibold">성공률:</span> {getSuccessRate()}%
              </div>
              <div>
                <span className="font-semibold">평균 처리 시간:</span> {getAverageProcessingTime()}ms
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.entries(results).map(([url, result]) => (
          <div key={url} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                {url}
              </span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                result.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {result.success ? '성공' : '실패'}
              </span>
            </div>
            
            {result.success && result.result && (
              <div className="mt-2">
                <SocialLinkCard 
                  url={url} 
                  onEmbed={() => console.warn('Embed:', url)}
                  processingTime={result.processingTime}
                />
              </div>
            )}
            
            {result.success && result.processingTime && (
              <div className="mt-2 text-xs text-gray-500">
                처리 시간: {result.processingTime}ms
              </div>
            )}
            
            {!result.success && result.error && (
              <div className="mt-2 text-xs text-red-600">
                오류: {result.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}