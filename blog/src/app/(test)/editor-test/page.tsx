"use client";
import { useState } from 'react';
import { Editor } from '@/components/editor';
import { Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components/ui/simple-components';
import { Code, Eye, Copy, Download, Settings, Sparkles } from 'lucide-react';

export default function EditorTestPage() {
  const [integratedValue, setIntegratedValue] = useState('<p>안녕하세요! <strong>통합 에디터</strong>입니다.</p>');
  const [basicValue, setBasicValue] = useState('<p>기본 에디터 테스트</p>');
  const [koreanValue, setKoreanValue] = useState('<h2>한국어 에디터</h2><p>이 에디터는 <strong>한국어 사용자</strong>를 위해 최적화되었습니다.</p>');
  const [markdownValue, setMarkdownValue] = useState('# 마크다운 에디터\n\n이 에디터는 **실시간 미리보기**를 제공합니다.');

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('클립보드에 복사되었습니다!');
    } catch (err) {
      console.error('복사 실패:', err);
    }
  };

  const downloadContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">🎯 에디터 테스트 페이지</h1>
        <p className="text-lg text-gray-600">Next.js 블로그를 위한 최신 통합 에디터를 테스트해보세요.</p>
      </div>

      <Tabs defaultValue="integrated" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrated">통합 에디터</TabsTrigger>
          <TabsTrigger value="basic">기본 에디터</TabsTrigger>
          <TabsTrigger value="korean">한국어 특화</TabsTrigger>
          <TabsTrigger value="markdown">마크다운</TabsTrigger>
        </TabsList>

        {/* 통합 에디터 */}
        <TabsContent value="integrated">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-500" />
                ✨ 통합 에디터
              </CardTitle>
              <CardDescription>모든 기능을 하나로 통합한 최신 에디터 - 맞춤법 검사, 자동 완성, 템플릿 등</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-2xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                <Editor 
                  value={integratedValue} 
                  onChange={setIntegratedValue}
                  placeholder="통합 에디터로 작성해보세요..."
                  enableKoreanFeatures={true}
                  enableSpellCheck={true}
                  enableAutoComplete={true}
                  defaultTab="advanced"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(integratedValue)}>
                  <Copy className="w-4 h-4 mr-2" />
                  HTML 복사
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadContent(integratedValue, 'integrated-content.html')}>
                  <Download className="w-4 h-4 mr-2" />
                  다운로드
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">생성된 HTML:</h4>
                <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-auto max-h-32">
                  {integratedValue}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 기본 에디터 */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle>📝 기본 에디터</CardTitle>
              <CardDescription>간단하고 가벼운 에디터</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-2xl p-4">
                <Editor 
                  value={basicValue} 
                  onChange={setBasicValue}
                  placeholder="기본 에디터로 작성해보세요..."
                  enableKoreanFeatures={false}
                  enableSpellCheck={false}
                  enableAutoComplete={false}
                  defaultTab="advanced"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(basicValue)}>
                  <Copy className="w-4 h-4 mr-2" />
                  HTML 복사
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadContent(basicValue, 'basic-content.html')}>
                  <Download className="w-4 h-4 mr-2" />
                  다운로드
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 한국어 특화 에디터 */}
        <TabsContent value="korean">
          <Card>
            <CardHeader>
              <CardTitle>🇰🇷 한국어 특화 에디터</CardTitle>
              <CardDescription>한국어 맞춤법 검사와 자동 완성을 지원하는 에디터</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-2xl p-4 bg-gradient-to-br from-red-50 to-pink-50">
                <Editor 
                  value={koreanValue} 
                  onChange={setKoreanValue}
                  placeholder="한국어로 내용을 작성해보세요..."
                  enableKoreanFeatures={true}
                  enableSpellCheck={true}
                  enableAutoComplete={true}
                  defaultTab="korean"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(koreanValue)}>
                  <Copy className="w-4 h-4 mr-2" />
                  HTML 복사
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadContent(koreanValue, 'korean-content.html')}>
                  <Download className="w-4 h-4 mr-2" />
                  다운로드
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 마크다운 에디터 */}
        <TabsContent value="markdown">
          <Card>
            <CardHeader>
              <CardTitle>📝 마크다운 에디터</CardTitle>
              <CardDescription>실시간 미리보기를 제공하는 마크다운 에디터</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border rounded-2xl p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                <Editor 
                  value={markdownValue} 
                  onChange={setMarkdownValue}
                  placeholder="마크다운 문법으로 작성하세요..."
                  enableKoreanFeatures={false}
                  enableSpellCheck={false}
                  enableAutoComplete={false}
                  defaultTab="markdown"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(markdownValue)}>
                  <Copy className="w-4 h-4 mr-2" />
                  마크다운 복사
                </Button>
                <Button variant="outline" size="sm" onClick={() => downloadContent(markdownValue, 'markdown-content.md')}>
                  <Download className="w-4 h-4 mr-2" />
                  다운로드
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 기능 테스트 섹션 */}
      <div className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">🧪 기능 테스트</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>한국어 기능 테스트</CardTitle>
              <CardDescription>맞춤법 검사와 자동 완성 기능을 테스트해보세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">테스트할 내용:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• "안녕하셔" → 맞춤법 검사 제안</li>
                    <li>• "감사" → 자동 완성 "감사합니다"</li>
                    <li>• "화이팅" 또는 "파이팅" → 자동 완성</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>고급 기능 테스트</CardTitle>
              <CardDescription>이미지 업로드, 비디오 임베드 등을 테스트해보세요</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">테스트할 기능:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• 드래그&드롭 이미지 업로드</li>
                    <li>• 클립보드에서 이미지 붙여넣기</li>
                    <li>• YouTube, 네이버TV 비디오 임베드</li>
                    <li>• 템플릿 자동 삽입</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}