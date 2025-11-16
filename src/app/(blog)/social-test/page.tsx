'use client';

import { useState } from 'react';
import { processSocialLink } from '@/lib/social-media/processor';
import SocialLinkCard from '@/components/social-media/SocialLinkCard';
import { Button } from '@/components/ui/index';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/index';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TestResult {
  url: string;
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
}

// 각 플랫폼별 테스트 링크 (50+개)
const TEST_LINKS = {
  youtube: [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=jNQXAC9IVRw&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
    'https://www.youtube.com/watch?v=tgbNymZ7vqY',
    'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
    'https://www.youtube.com/watch?v=9bZkp7q19f0',
    'https://www.youtube.com/watch?v=kXYiU_JCYtU',
    'https://www.youtube.com/watch?v=60ItHLz5WEA',
    'https://www.youtube.com/watch?v=YQHsXMglC9A',
    'https://www.youtube.com/watch?v=ASO_zypdnsQ',
    'https://youtu.be/3JZ_D3ELwOQ',
    'https://youtu.be/9bZkp7q19f0',
    'https://youtu.be/kXYiU_JCYtU',
    'https://youtu.be/60ItHLz5WEA',
    'https://youtu.be/YQHsXMglC9A'
  ],
  instagram: [
    'https://www.instagram.com/p/CU0pXHnB2gA/',
    'https://www.instagram.com/reel/CU0pXHnB2gA/',
    'https://www.instagram.com/tv/CU0pXHnB2gA/',
    'https://instagr.am/p/CU0pXHnB2gA/',
    'https://www.instagram.com/p/B8FQ5mBAviw/',
    'https://www.instagram.com/p/B8FQ5mBAviw/?utm_source=ig_web_copy_link',
    'https://www.instagram.com/reel/CU0pXHnB2gA/?igshid=YmMyMTA2M2Y=',
    'https://www.instagram.com/tv/CU0pXHnB2gA/?igshid=MDJmNzVkMjY=',
    'https://www.instagram.com/p/CU0pXHnB2gA/embed',
    'https://www.instagram.com/reel/CU0pXHnB2gA/embed',
    'https://www.instagram.com/tv/CU0pXHnB2gA/embed'
  ],
  twitter: [
    'https://twitter.com/elonmusk/status/1519480761749016577',
    'https://x.com/elonmusk/status/1519480761749016577',
    'https://twitter.com/BTS_twt/status/1234567890123456789',
    'https://x.com/BTS_twt/status/1234567890123456789',
    'https://twitter.com/BTS_twt/status/1234567890123456789?s=20',
    'https://x.com/BTS_twt/status/1234567890123456789?s=20',
    'https://twitter.com/BTS_twt/status/1234567890123456789/photo/1',
    'https://x.com/BTS_twt/status/1234567890123456789/photo/1',
    'https://twitter.com/BTS_twt/status/1234567890123456789/video/1',
    'https://x.com/BTS_twt/status/1234567890123456789/video/1'
  ],
  facebook: [
    'https://www.facebook.com/watch/?v=10150189620712345',
    'https://www.facebook.com/zuck/videos/10150189620712345/',
    'https://fb.watch/abc123def/',
    'https://www.facebook.com/permalink.php?story_fbid=10150189620712345&id=123456789',
    'https://www.facebook.com/photo.php?fbid=10150189620712345&set=a.123456789&type=3',
    'https://www.facebook.com/123456789/posts/10150189620712345/',
    'https://www.facebook.com/photo/?fbid=10150189620712345&set=a.123456789',
    'https://fb.watch/abc123def/?ref=sharing'
  ],
  tiktok: [
    'https://www.tiktok.com/@username/video/1234567890123456789',
    'https://vm.tiktok.com/ZMNhJvHq/',
    'https://vt.tiktok.com/ZMNhJvHq/',
    'https://www.tiktok.com/@bts_official_bighit/video/1234567890123456789',
    'https://www.tiktok.com/@blackpinkofficial/video/1234567890123456789',
    'https://vm.tiktok.com/ZMNhJvHq/?k=1',
    'https://vt.tiktok.com/ZMNhJvHq/?k=1',
    'https://www.tiktok.com/@username/video/1234567890123456789?is_from_webapp=1&sender_device=pc',
    'https://www.tiktok.com/@username/video/1234567890123456789?lang=ko-KR',
    'https://m.tiktok.com/v/1234567890123456789.html'
  ],
  navertv: [
    'https://tv.naver.com/v/1234567890123',
    'https://tv.naver.com/v/9876543210987',
    'https://tv.naver.com/v/1234567890123?playlist=987654',
    'https://tv.naver.com/v/1234567890123#comment',
    'https://tv.naver.com/v/9876543210987?query=%ED%95%9C%EA%B8%80',
    'https://tv.naver.com/v/1234567890123&plClips=false',
    'https://tv.naver.com/v/9876543210987&plClips=false&plAlbum=false',
    'https://tv.naver.com/v/1234567890123?plClips=false&plAlbum=false&plComment=false',
    'https://tv.naver.com/v/9876543210987&plClips=false&plAlbum=false&plComment=false&plRelated=false'
  ],
  shortUrls: [
    'https://bit.ly/3JZ_D3ELwOQ',
    'https://tinyurl.com/youtube-test',
    'https://goo.gl/maps/abc123',
    'https://ow.ly/abc123',
    'https://buff.ly/abc123',
    'https://short.link/abc123',
    'https://rebrand.ly/abc123',
    'https://tiny.cc/abc123',
    'https://is.gd/abc123',
    'https://cli.gs/abc123'
  ]
};

export default function SocialMediaTestPage() {
  const [customUrl, setCustomUrl] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const testSingleUrl = async (url: string): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      const result = await processSocialLink(url);
      const processingTime = Date.now() - startTime;
      
      return {
        url,
        success: true,
        data: result,
        processingTime
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        url,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime
      };
    }
  };

  const runBatchTest = async (urls: string[]) => {
    setIsTesting(true);
    const results: TestResult[] = [];
    
    // 동시 요청 제한 (10개씩 처리)
    const batchSize = 10;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => testSingleUrl(url))
      );
      results.push(...batchResults);
    }
    
    setTestResults(results);
    setIsTesting(false);
  };

  const testAllPlatforms = async () => {
    const allUrls = Object.values(TEST_LINKS).flat();
    await runBatchTest(allUrls);
  };

  const testPlatform = async (platform: keyof typeof TEST_LINKS) => {
    await runBatchTest(TEST_LINKS[platform]);
  };

  const testCustomUrl = async () => {
    if (!customUrl.trim()) return;
    const result = await testSingleUrl(customUrl.trim());
    setTestResults([result]);
  };

  const getSuccessRate = (results: TestResult[]) => {
    if (results.length === 0) return 0;
    return (results.filter(r => r.success).length / results.length) * 100;
  };

  const getAverageProcessingTime = (results: TestResult[]) => {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">소셜 미디어 통합 시스템 테스트</CardTitle>
          <CardDescription>
            주요 SNS 플랫폼 (YouTube, Instagram, Twitter, Facebook, TikTok, NaverTV) 링크 분석 테스트
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="테스트할 소셜 미디어 링크를 입력하세요..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1"
                rows={2}
              />
              <Button 
                onClick={testCustomUrl}
                disabled={isTesting || !customUrl.trim()}
                className="self-end"
              >
                단일 테스트
              </Button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button onClick={testAllPlatforms} disabled={isTesting} variant="outline">
                전체 플랫폼 테스트
              </Button>
              {Object.keys(TEST_LINKS).map(platform => (
                <Button 
                  key={platform}
                  onClick={() => testPlatform(platform as keyof typeof TEST_LINKS)}
                  disabled={isTesting}
                  variant="outline"
                  size="sm"
                >
                  {platform.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>테스트 결과 요약</CardTitle>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {getSuccessRate(testResults).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">성공률</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getAverageProcessingTime(testResults).toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-600">평균 처리 시간</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {testResults.length}
                  </div>
                  <div className="text-sm text-gray-600">총 테스트 수</div>
                </div>
              </div>
            </CardContent>
          </CardHeader>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="tiktok">TikTok</TabsTrigger>
          <TabsTrigger value="navertv">NaverTV</TabsTrigger>
          <TabsTrigger value="shortUrls">단축URL</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {testResults.map((result, index) => (
            <TestResultCard key={index} result={result} />
          ))}
        </TabsContent>

        {Object.keys(TEST_LINKS).map(platform => (
          <TabsContent key={platform} value={platform} className="space-y-4">
            {testResults
              .filter(result => result.url.includes(platform.toLowerCase().replace('shorturls', '')))
              .map((result, index) => (
                <TestResultCard key={index} result={result} />
              ))}
          </TabsContent>
        ))}
      </Tabs>

      {isTesting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6">
            <CardContent className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-lg font-semibold">테스트 진행 중...</p>
              <p className="text-sm text-gray-600 mt-2">
                {testResults.length} / {Object.values(TEST_LINKS).flat().length} 개 테스트 완료
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function TestResultCard({ result }: { result: TestResult }) {
  const platform = getPlatformFromUrl(result.url);
  
  return (
    <Card className={`${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={result.success ? 'success' : 'error'}>
              {result.success ? '성공' : '실패'}
            </Badge>
            <Badge variant="outline">{platform.toUpperCase()}</Badge>
            <Badge variant="secondary">{result.processingTime}ms</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-900 break-all">
            URL: {result.url}
          </div>
          {result.success ? (
            <div className="space-y-2">
              {result.data?.title && (
                <div className="text-sm">
                  <span className="font-medium">제목:</span> {result.data.title}
                </div>
              )}
              {result.data?.type && (
                <div className="text-sm">
                  <span className="font-medium">타입:</span> {result.data.type}
                </div>
              )}
              {result.data?.platform && (
                <div className="text-sm">
                  <span className="font-medium">플랫폼:</span> {result.data.platform}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-red-600">
              <span className="font-medium">오류:</span> {result.error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getPlatformFromUrl(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com') || url.includes('instagr.am')) return 'instagram';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('facebook.com') || url.includes('fb.watch')) return 'facebook';
  if (url.includes('tiktok.com') || url.includes('vm.tiktok.com') || url.includes('vt.tiktok.com')) return 'tiktok';
  if (url.includes('tv.naver.com')) return 'navertv';
  return 'unknown';
}