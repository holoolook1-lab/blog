'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
// UI 컴포넌트들을 간단한 버전으로 대체
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm text-gray-500 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  ...props 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  [key: string]: any;
}) => {
  const baseClasses = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variantClasses = {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500',
    ghost: 'hover:bg-gray-100 focus-visible:ring-gray-500'
  };
  
  const sizeClasses = {
    default: 'h-10 px-4 py-2',
    sm: 'h-9 rounded-md px-3',
    lg: 'h-11 rounded-md px-8'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Tabs = ({ children, value, onValueChange, className = '' }: { 
  children: React.ReactNode; 
  value: string; 
  onValueChange: (value: string) => void;
  className?: string;
}) => (
  <div className={className}>
    {children}
  </div>
);

const TabsList = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 ${className}`}>
    {children}
  </div>
);

const TabsTrigger = ({ children, value, className = '' }: { children: React.ReactNode; value: string; className?: string }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm ${className}`}
    data-state="inactive"
  >
    {children}
  </button>
);

const TabsContent = ({ children, value, className = '' }: { children: React.ReactNode; value: string; className?: string }) => (
  <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 ${className}`}>
    {children}
  </div>
);
import { Settings, SpellCheck, FileText, Wand2, Download, Upload } from 'lucide-react';
import KoreanSpellChecker from './KoreanSpellChecker';
import KoreanAutoComplete from './KoreanAutoComplete';

// 동적 임포트로 SSR 문제 방지
const AdvancedEditor = dynamic(() => import('./AdvancedEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
      <div className="text-gray-500">에디터 로딩 중...</div>
    </div>
  ),
});

const RichEditor = dynamic(() => import('./RichEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
      <div className="text-gray-500">에디터 로딩 중...</div>
    </div>
  ),
});

const KoreanRichEditor = dynamic(() => import('./KoreanRichEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
      <div className="text-gray-500">에디터 로딩 중...</div>
    </div>
  ),
});

const EnhancedContentEditor = dynamic(() => import('./EnhancedContentEditor'), {
  ssr: false,
  loading: () => (
    <div className="border border-gray-200 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
      <div className="text-gray-500">에디터 로딩 중...</div>
    </div>
  ),
});

interface IntegratedEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  enableKoreanFeatures?: boolean;
  enableSpellCheck?: boolean;
  enableAutoComplete?: boolean;
  defaultTab?: string;
}

export default function IntegratedEditor({
  value = '',
  onChange,
  placeholder = '내용을 입력하세요...',
  className = '',
  enableKoreanFeatures = true,
  enableSpellCheck = true,
  enableAutoComplete = true,
  defaultTab = 'advanced'
}: IntegratedEditorProps) {
  const [content, setContent] = useState(value);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showSpellChecker, setShowSpellChecker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // 외부 value prop 변경 감지
  useEffect(() => {
    setContent(value);
  }, [value]);

  // 콘텐츠 변경 처리
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onChange?.(newContent);
  }, [onChange]);

  // 맞춤법 검사 결과 적용
  const handleSpellCorrection = useCallback((correctedText: string) => {
    handleContentChange(correctedText);
  }, [handleContentChange]);

  // 자동 완성 선택 처리
  const handleAutoCompleteSelect = useCallback((suggestion: string) => {
    // 현재 커서 위치의 단어를 자동 완성 제안으로 교체
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    
    // 마지막 공백 이후의 텍스트 찾기
    const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
    const currentWordStart = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
    
    // 새로운 텍스트 조합
    const newText = content.substring(0, currentWordStart) + suggestion + textAfterCursor;
    handleContentChange(newText);
  }, [content, cursorPosition, handleContentChange]);

  // 커서 위치 추적
  const handleSelectionChange = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      setCursorPosition(range.startOffset);
    }
  }, []);

  // 템플릿 삽입 기능
  const insertTemplate = useCallback((template: string) => {
    const newContent = content + template;
    handleContentChange(newContent);
  }, [content, handleContentChange]);

  // 템플릿 옵션
  const templates = [
    {
      name: '인사말',
      content: '\n\n안녕하세요! 오늘도 좋은 하루 보내세요. 😊\n'
    },
    {
      name: '감사 표현',
      content: '\n\n읽어주셔서 감사합니다. 유용한 정보였길 바랍니다.\n'
    },
    {
      name: '질문 유도',
      content: '\n\n여러분의 생각은 어떠신가요? 댓글로 의견을 나눠주세요!\n'
    },
    {
      name: '추천 글',
      content: '\n\n📌 관련 글 추천:\n- [관련 글 제목 1]\n- [관련 글 제목 2]\n'
    }
  ];

  // 텍스트 분석
  const getTextAnalysis = useCallback(() => {
    const koreanChars = (content.match(/[가-힣]/g) || []).length;
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    const numbers = (content.match(/\d+/g) || []).length;
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim()).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim()).length;
    
    return {
      totalChars: content.length,
      koreanChars,
      englishWords,
      numbers,
      paragraphs,
      sentences,
      readingTime: Math.ceil(content.length / 500) // 분 단위
    };
  }, [content]);

  const analysis = getTextAnalysis();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 상단 도구 모음 */}
      <Card className="p-6">
        {/* 라키라키 모토 - 에디터 상단 (미니멀 버전) */}
        <div className="mb-6 text-center">
          <p className="text-xs text-gray-500 font-light tracking-wider uppercase">
            당신의 생각이 반짝이는 곳, 라키라키
          </p>
          <div className="mt-3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-24 mx-auto"></div>
        </div>
        
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {enableKoreanFeatures && (
              <Button
                variant={showSpellChecker ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSpellChecker(!showSpellChecker)}
                className="flex items-center gap-2"
              >
                <SpellCheck className="w-4 h-4" />
                맞춤법 검사
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleContentChange('')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              지우기
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* 템플릿 드롭다운 */}
            <div className="relative group">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Wand2 className="w-4 h-4" />
                템플릿
              </Button>
              <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                {templates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => insertTemplate(template.content)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {template.name}
                  </button>
                ))}
              </div>
            </div>

n            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'content.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              다운로드
            </Button>
          </div>
        </div>

        {/* 텍스트 분석 정보 */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>총 글자: {analysis.totalChars}</span>
            <span>한글: {analysis.koreanChars}</span>
            <span>단락: {analysis.paragraphs}</span>
            <span>문장: {analysis.sentences}</span>
            <span>예상 독서 시간: {analysis.readingTime}분</span>
          </div>
        </div>
      </Card>

      {/* 한국어 자동 완성 */}
      {enableKoreanFeatures && enableAutoComplete && (
        <KoreanAutoComplete
          text={content}
          onSelect={handleAutoCompleteSelect}
          className="mb-2"
        />
      )}

      {/* 탭 에디터 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="advanced" className="text-sm">고급 에디터</TabsTrigger>
          <TabsTrigger value="rich" className="text-sm">리치 에디터</TabsTrigger>
          <TabsTrigger value="korean" className="text-sm">한국어 에디터</TabsTrigger>
          <TabsTrigger value="markdown" className="text-sm">마크다운</TabsTrigger>
        </TabsList>

        <TabsContent value="advanced" className="mt-2">
          <AdvancedEditor
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
          />
        </TabsContent>

        <TabsContent value="rich" className="mt-2">
          <RichEditor
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
          />
        </TabsContent>

        <TabsContent value="korean" className="mt-2">
          <KoreanRichEditor
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
            enableKoreanFeatures={enableKoreanFeatures}
          />
        </TabsContent>

        <TabsContent value="markdown" className="mt-2">
          <EnhancedContentEditor
            value={content}
            onChange={handleContentChange}
            placeholder={placeholder}
          />
        </TabsContent>
      </Tabs>

      {/* 한국어 맞춤법 검사기 */}
      {enableKoreanFeatures && enableSpellCheck && showSpellChecker && (
        <KoreanSpellChecker
          text={content}
          onCorrection={handleSpellCorrection}
        />
      )}
    </div>
  );
}