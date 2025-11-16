'use client';

import { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface SpellCheckResult {
  word: string;
  suggestions: string[];
  isCorrect: boolean;
}

interface KoreanSpellCheckerProps {
  text: string;
  onCorrection: (correctedText: string) => void;
  className?: string;
}

// 한국어 맞춤법 검사를 위한 기본 사전
const KOREAN_DICTIONARY = [
  '안녕하세요', '감사합니다', '죄송합니다', '사랑합니다', '미안합니다',
  '고맙습니다', '반갑습니다', '축하합니다', '화이팅', '파이팅',
  '대한민국', '서울', '부산', '대구', '인천', '광주', '대전', '울산',
  '한글', '한국어', '컴퓨터', '인터넷', '웹사이트', '블로그', '게시글'
];

// 자주 틀리는 맞춤법 패턴
const COMMON_SPELLING_ERRORS = {
  '안녕하세요': ['안녕하셔', '안녕하십니까', '안녕'],
  '감사합니다': ['감사합니다', '감사해요', '고마워요'],
  '죄송합니다': ['죄송합니다', '미안합니다', '죄송해요'],
  '화이팅': ['파이팅', '홧팅', '화이팅'],
  '대한민국': ['대한민국', '한국', 'Korea'],
};

export default function KoreanSpellChecker({ text, onCorrection, className = "" }: KoreanSpellCheckerProps) {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<SpellCheckResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<{[key: number]: boolean}>({});

  // 간단한 한국어 맞춤법 검사 로직
  const checkKoreanSpelling = useCallback(async (inputText: string): Promise<SpellCheckResult[]> => {
    const words = inputText.split(/\s+/);
    const checkResults: SpellCheckResult[] = [];

    for (const word of words) {
      // 한글만 포함된 단어인지 확인
      if (!/[가-힣]/.test(word)) {
        continue;
      }

      // 기본 사전에 있는 단어는 정확한 것으로 간주
      if (KOREAN_DICTIONARY.includes(word)) {
        checkResults.push({
          word,
          suggestions: [],
          isCorrect: true
        });
        continue;
      }

      // 자주 틀리는 맞춤법 확인
      let foundCorrection = false;
      for (const [correct, suggestions] of Object.entries(COMMON_SPELLING_ERRORS)) {
        if (suggestions.includes(word) && word !== correct) {
          checkResults.push({
            word,
            suggestions: [correct],
            isCorrect: false
          });
          foundCorrection = true;
          break;
        }
      }

      if (!foundCorrection) {
        // 기본적으로는 정확한 것으로 간주 (실제로는 더 복잡한 로직 필요)
        checkResults.push({
          word,
          suggestions: [],
          isCorrect: true
        });
      }
    }

    return checkResults;
  }, []);

  const handleSpellCheck = useCallback(async () => {
    if (!text.trim()) return;

    setChecking(true);
    try {
      // 실제 API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const checkResults = await checkKoreanSpelling(text);
      setResults(checkResults);
    } catch (error) {
      console.error('맞춤법 검사 중 오류:', error);
    } finally {
      setChecking(false);
    }
  }, [text, checkKoreanSpelling]);

  const applyCorrection = useCallback((incorrectWord: string, suggestion: string) => {
    const correctedText = text.replace(new RegExp(`\\b${incorrectWord}\\b`, 'g'), suggestion);
    onCorrection(correctedText);
    
    // 해당 제안 숨기기
    setShowSuggestions(prev => ({ ...prev, [incorrectWord]: false }));
  }, [text, onCorrection]);

  const toggleSuggestions = useCallback((index: number) => {
    setShowSuggestions(prev => ({ ...prev, [index]: !prev[index] }));
  }, []);

  useEffect(() => {
    // 텍스트가 변경되면 결과 초기화
    setResults([]);
    setShowSuggestions({});
  }, [text]);

  const incorrectCount = results.filter(r => !r.isCorrect).length;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">한국어 맞춤법 검사</h3>
        <button
          onClick={handleSpellCheck}
          disabled={checking || !text.trim()}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {checking ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              검사 중...
            </>
          ) : (
            '검사하기'
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {incorrectCount === 0 ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-600">맞춤법 오류가 없습니다!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600">{incorrectCount}개의 맞춤법 오류를 찾았습니다</span>
              </>
            )}
          </div>

          {incorrectCount > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {results.map((result, index) => {
                if (result.isCorrect) return null;
                
                return (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-red-700 font-medium">"{result.word}"</span>
                      <button
                        onClick={() => toggleSuggestions(index)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {showSuggestions[index] ? '숨기기' : '제안 보기'}
                      </button>
                    </div>
                    
                    {showSuggestions[index] && result.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-600">제안:</p>
                        {result.suggestions.map((suggestion, sIndex) => (
                          <button
                            key={sIndex}
                            onClick={() => applyCorrection(result.word, suggestion)}
                            className="block w-full text-left px-2 py-1 text-sm bg-white border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-200 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {results.length === 0 && text.trim() && (
        <p className="text-sm text-gray-500">맞춤법 검사를 시작하려면 '검사하기' 버튼을 클릭하세요.</p>
      )}

      {!text.trim() && (
        <p className="text-sm text-gray-500">텍스트를 입력한 후 맞춤법 검사를 실행할 수 있습니다.</p>
      )}
    </div>
  );
}