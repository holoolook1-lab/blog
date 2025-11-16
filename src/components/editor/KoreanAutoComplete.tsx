'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface KoreanAutoCompleteProps {
  text: string;
  onSelect: (suggestion: string) => void;
  className?: string;
}

// 한국어 자동 완성을 위한 단어 사전
const KOREAN_AUTOCOMPLETE_WORDS = [
  // 일반적인 인사말
  '안녕하세요', '감사합니다', '죄송합니다', '사랑합니다', '미안합니다',
  '고맙습니다', '반갑습니다', '축하합니다', '화이팅', '파이팅',
  
  // 블로그/콘텐츠 관련
  '블로그', '게시글', '댓글', '좋아요', '구독', '알림', '공유', '추천',
  '리뷰', '후기', '경험', '정보', '팁', '노하우', '강좌', '튜토리얼',
  
  // 기술 관련
  '프로그래밍', '코딩', '개발', '웹사이트', '앱', '소프트웨어', '하드웨어',
  '인터넷', '컴퓨터', '스마트폰', '데이터', '알고리즘', '프레임워크',
  
  // 한국 문화
  '한국', '대한민국', '서울', '부산', '대구', '인천', '광주', '대전', '울산',
  '한글', '한국어', '김치', '비빔밥', '불고기', '한복', '택견', '태권도',
  
  // 감정 표현
  '행복', '슬픔', '분노', '기쁨', '사랑', '미움', '두려움', '희망',
  '실망', '만족', '불만', '감동', '충격', '놀라움', '평온', '안심'
];

// 초성 검색을 위한 한글 초성 테이블
const CHO_SEONG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

// 한글 문자를 초성으로 변환하는 함수
function getChosung(text: string): string {
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    // 한글 음절인 경우
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const choIndex = Math.floor((code - 0xAC00) / 588);
      result += CHO_SEONG[choIndex];
    } else {
      // 한글이 아닌 경우 그대로 추가
      result += char;
    }
  }
  
  return result;
}

export default function KoreanAutoComplete({ text, onSelect, className = "" }: KoreanAutoCompleteProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 현재 커서 위치의 단어를 추출하는 함수
  const getCurrentWord = useCallback((fullText: string, position: number): string => {
    if (position === 0) return '';
    
    // 커서 앞의 텍스트만 고려
    const textBeforeCursor = fullText.substring(0, position);
    
    // 마지막 공백 이후의 텍스트 추출
    const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');
    const currentWord = textBeforeCursor.substring(lastSpaceIndex + 1);
    
    return currentWord;
  }, []);

  // 자동 완성 제안 생성
  const generateSuggestions = useCallback((inputWord: string): string[] => {
    if (!inputWord || inputWord.length < 2) return [];
    
    const suggestions: string[] = [];
    const lowerInput = inputWord.toLowerCase();
    const chosungInput = getChosung(inputWord);
    
    KOREAN_AUTOCOMPLETE_WORDS.forEach(word => {
      const lowerWord = word.toLowerCase();
      const chosungWord = getChosung(word);
      
      // 정확히 일치하는 경우 (이미 완성된 단어)
      if (lowerWord === lowerInput) {
        return;
      }
      
      // 접두사로 일치하는 경우
      if (lowerWord.startsWith(lowerInput)) {
        suggestions.push(word);
      }
      // 초성으로 검색하는 경우
      else if (chosungWord.startsWith(chosungInput) && chosungInput.length >= 2) {
        suggestions.push(word);
      }
    });
    
    // 중복 제거 및 정렬 (길이순, 알파벳순)
    return [...new Set(suggestions)].sort((a, b) => {
      if (a.length !== b.length) return a.length - b.length;
      return a.localeCompare(b);
    }).slice(0, 5); // 최대 5개 제안
  }, []);

  // 키보드 네비게이션 처리
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          onSelect(suggestions[selectedIndex]);
          setShowSuggestions(false);
        }
        break;
      
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, onSelect]);

  // 텍스트 변경 감지
  useEffect(() => {
    const currentWord = getCurrentWord(text, cursorPosition);
    
    if (currentWord && currentWord.length >= 2) {
      const newSuggestions = generateSuggestions(currentWord);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [text, cursorPosition, getCurrentWord, generateSuggestions]);

  // 키보드 이벤트 리스너 등록
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 컨테이너 외부 클릭 시 제안 숨기기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    onSelect(suggestion);
    setShowSuggestions(false);
  };

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1">
        <div className="py-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{suggestion}</span>
                {index === selectedIndex && (
                  <span className="text-xs text-blue-500">↵ 선택</span>
                )}
              </div>
            </button>
          ))}
        </div>
        
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>↑↓ 이동</span>
            <span>↵ 선택</span>
            <span>ESC 취소</span>
          </div>
        </div>
      </div>
    </div>
  );
}