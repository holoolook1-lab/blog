"use client";
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { useRef, useState, useCallback, useMemo } from 'react';
import { Bold, Italic, Link, Eye, EyeOff, Copy, Check, Download } from 'lucide-react';

export default function ContentEditor({ 
  value, 
  onChange,
  placeholder = "내용(HTML 또는 Markdown)",
  className = ""
}: { 
  value: string; 
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  // 텍스트 분석
  const analyzeText = useCallback((text: string) => {
    const chars = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    setCharCount(chars);
    setWordCount(words);
  }, []);

  // 텍스트 포맷팅 함수들
  const wrap = useCallback((left: string, right: string = left) => {
    const el = ref.current;
    if (!el) return;
    
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);
    const next = `${before}${left}${selected}${right}${after}`;
    
    onChange(next);
    analyzeText(next);
    
    // 커서 위치 복원
    setTimeout(() => {
      const pos = start + left.length + selected.length + right.length;
      el.selectionStart = el.selectionEnd = pos;
      el.focus();
    }, 0);
  }, [value, onChange, analyzeText]);

  const insertLink = useCallback(() => {
    const url = linkUrl.trim();
    const el = ref.current;
    if (!url || !el) { 
      setShowLinkInput(false); 
      return; 
    }
    
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end) || '링크텍스트';
    const before = value.slice(0, start);
    const after = value.slice(end);
    
    const md = `[${selected}](${url})`;
    const next = `${before}${md}${after}`;
    
    onChange(next);
    analyzeText(next);
    
    setLinkUrl('');
    setShowLinkInput(false);
    
    setTimeout(() => { 
      el.focus(); 
    }, 0);
  }, [value, linkUrl, onChange, analyzeText]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    analyzeText(newValue);
  }, [onChange, analyzeText]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  }, [value]);

  const downloadContent = useCallback(() => {
    const blob = new Blob([value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [value]);

  // 초기 텍스트 분석
  useMemo(() => {
    analyzeText(value);
  }, [value, analyzeText]);

  const toolbarButtons = useMemo(() => [
    {
      name: '굵게',
      icon: Bold,
      action: () => wrap('**'),
      shortcut: 'Ctrl+B',
      color: 'text-red-600'
    },
    {
      name: '기울임',
      icon: Italic,
      action: () => wrap('*'),
      shortcut: 'Ctrl+I',
      color: 'text-blue-600'
    },
    {
      name: '링크',
      icon: Link,
      action: () => setShowLinkInput(!showLinkInput),
      shortcut: 'Ctrl+K',
      color: 'text-green-600'
    }
  ], [wrap, showLinkInput]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 향상된 툴바 */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          {toolbarButtons.map((btn, index) => {
            const Icon = btn.icon;
            return (
              <button
                key={index}
                type="button"
                className="p-3 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
                onClick={btn.action}
                title={`${btn.name} (${btn.shortcut})`}
              >
                <Icon className={`w-5 h-5 ${btn.color}`} />
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="p-3 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? '미리보기 숨기기' : '미리보기 보기'}
          >
            {showPreview ? <EyeOff className="w-5 h-5 text-gray-600" /> : <Eye className="w-5 h-5 text-gray-600" />}
          </button>
          
          <button
            type="button"
            className="p-3 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
            onClick={copyToClipboard}
            title="클립보드에 복사"
          >
            {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-gray-600" />}
          </button>
          
          <button
            type="button"
            className="p-3 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
            onClick={downloadContent}
            title="마크다운 파일로 다운로드"
          >
            <Download className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* 링크 입력 */}
      {showLinkInput && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔗 링크 주소
              </label>
              <input
                type="url"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    insertLink();
                  } else if (e.key === 'Escape') {
                    setShowLinkInput(false);
                    setLinkUrl('');
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                onClick={insertLink}
              >
                링크 삽입
              </button>
              <button
                type="button"
                className="px-4 py-3 bg-gray-300 text-gray-700 rounded-xl hover:bg-gray-400 transition-colors"
                onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 텍스트 에디터와 미리보기 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 텍스트 에디터 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">마크다운 편집기</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>글자: <span className="font-medium text-gray-700">{charCount.toLocaleString()}</span></span>
              <span>단어: <span className="font-medium text-gray-700">{wordCount.toLocaleString()}</span></span>
            </div>
          </div>
          
          <textarea
            ref={ref}
            className="w-full h-96 px-4 py-4 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm leading-relaxed resize-none"
            placeholder={placeholder}
            value={value}
            onChange={handleTextChange}
          />
        </div>

        {/* 미리보기 */}
        {showPreview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">미리보기</h3>
              <span className="text-sm text-gray-500">실시간 렌더링</span>
            </div>
            
            <div className="h-96 overflow-y-auto border border-gray-200 rounded-2xl p-6 bg-white shadow-inner">
              <div 
                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-pink-600 prose-pre:bg-gray-100"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} 
              />
            </div>
          </div>
        )}
      </div>

      {/* 도움말 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>💡</span>
          <span>마크다운 작성 가이드</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">기본 문법</h5>
            <ul className="space-y-1">
              <li><code className="bg-gray-100 px-2 py-1 rounded">**굵게**</code> → <strong>굵게</strong></li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">*기울임*</code> → <em>기울임</em></li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">[링크](URL)</code> → <a href="#" className="text-blue-600">링크</a></li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-800 mb-2">고급 기능</h5>
            <ul className="space-y-1">
              <li>• 툴바 버튼으로 빠른 포맷팅</li>
              <li>• 실시간 미리보기로 확인</li>
              <li>• 단축키 지원 (Ctrl+B, Ctrl+I)</li>
              <li>• 클립보드 복사 및 파일 다운로드</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}