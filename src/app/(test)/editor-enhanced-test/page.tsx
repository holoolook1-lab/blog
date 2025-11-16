'use client';

import React, { useState } from 'react';
import KoreanRichEditor from '@/components/editor/KoreanRichEditor';

export default function EditorTestPage() {
  const [content, setContent] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testCases = [
    {
      name: '제목 변환 테스트',
      content: '이것은 테스트 제목입니다.',
      test: (editor: any) => {
        // 제목 변환 테스트
        addTestResult('제목 변환 기능 테스트 중...');
      }
    },
    {
      name: '리스트 변환 테스트', 
      content: '첫 번째 항목\n두 번째 항목\n세 번째 항목',
      test: (editor: any) => {
        addTestResult('리스트 변환 기능 테스트 중...');
      }
    },
    {
      name: '인용구 변환 테스트',
      content: '이것은 인용구 테스트입니다.',
      test: (editor: any) => {
        addTestResult('인용구 변환 기능 테스트 중...');
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎯 한국어 리치 에디터 테스트</h1>
          <p className="text-lg text-gray-600 mb-8">
            개선된 텍스트 블록 선택 기능을 테스트해보세요
          </p>
        </div>

        {/* 테스트 케이스 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">📋 테스트 케이스</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {testCases.map((testCase, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-lg mb-2">{testCase.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{testCase.content}</p>
                <button
                  onClick={() => {
                    setContent(testCase.content);
                    addTestResult(`${testCase.name} 시작됨`);
                  }}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  테스트 시작
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 에디터 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">✍️ 에디터 테스트</h2>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="font-semibold text-blue-900 mb-2">💡 사용법</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 텍스트를 선택하고 툴바 버튼을 클릭하여 형식을 적용하세요</li>
              <li>• 제목1(대제목), 제목2(중제목), 제목3(소제목)으로 구분됩니다</li>
              <li>• 글머리목록과 번호목록으로 리스트를 만들 수 있습니다</li>
              <li>• 인용구 버튼으로 텍스트를 인용구로 변환할 수 있습니다</li>
              <li>• 현재 블록 타입이 상단에 실시간으로 표시됩니다</li>
            </ul>
          </div>
          
          <KoreanRichEditor
            value={content}
            onChange={setContent}
            placeholder="여기에 텍스트를 입력하고 선택하여 형식을 적용해보세요..."
            minHeight="400px"
            enableKoreanFeatures={true}
          />
        </div>

        {/* 결과 미리보기 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">📄 HTML 결과</h2>
            <div className="bg-gray-100 rounded-xl p-4 max-h-64 overflow-auto">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                {content || '아직 내용이 없습니다...'}
              </pre>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">🎨 렌더링 미리보기</h2>
            <div className="border border-gray-200 rounded-xl p-4 max-h-64 overflow-auto">
              <div 
                className="prose prose-lg content-renderer"
                dangerouslySetInnerHTML={{ 
                  __html: content || '<p class="text-gray-500">아직 내용이 없습니다...</p>' 
                }}
              />
            </div>
          </div>
        </div>

        {/* 테스트 결과 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">📊 테스트 로그</h2>
          <div className="bg-gray-100 rounded-xl p-4 max-h-48 overflow-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">아직 테스트 결과가 없습니다...</p>
            ) : (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    <span className="text-blue-600">{result}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setTestResults([])}
            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            로그 초기화
          </button>
        </div>

        {/* 기능 설명 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
          <h2 className="text-2xl font-bold mb-4">🚀 개선된 기능</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2">📝 텍스트 블록 선택</h3>
              <p className="text-sm text-gray-700">
                텍스트를 선택하고 원하는 형식(제목, 리스트, 인용구)으로 변환할 수 있습니다.
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-100">
              <h3 className="font-semibold text-green-900 mb-2">🎯 실시간 상태 표시</h3>
              <p className="text-sm text-gray-700">
                현재 커서가 위치한 블록의 타입이 상단에 실시간으로 표시됩니다.
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-purple-100">
              <h3 className="font-semibold text-purple-900 mb-2">✨ 개선된 UI</h3>
              <p className="text-sm text-gray-700">
                제목 버튼에 색상 구분을 추가하고, 툴바 버튼에 애니메이션 효과를 적용했습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}