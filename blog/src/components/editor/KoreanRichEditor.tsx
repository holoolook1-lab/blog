"use client";
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { compressToWebp } from '@/lib/utils/imageClient';
import { 
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, Image as ImageIcon, 
  Video, List, ListOrdered, Heading, Quote, Code, Undo, Redo, X, Plus, 
  Table as TableIcon, AlignLeft, AlignCenter, AlignRight, Strikethrough, Highlighter
} from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  enableKoreanFeatures?: boolean;
};

type ToolbarButton = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  active?: boolean;
  disabled?: boolean;
  loading?: boolean;
  shortcut?: string;
} | {
  type: 'separator';
};

// 한국어 특화 기능
const KOREAN_FEATURES = {
  videoPlatforms: {
    'tv.naver.com': { name: '네이버TV', color: 'bg-green-500' },
    'youtube.com': { name: '유튜브', color: 'bg-red-500' },
    'youtu.be': { name: '유튜브', color: 'bg-red-500' },
    'vimeo.com': { name: '비메오', color: 'bg-blue-500' },
    'twitch.tv': { name: '트위치', color: 'bg-purple-500' }
  },
  fonts: [
    { name: '기본', value: 'sans-serif' },
    { name: '명조', value: 'serif' },
    { name: '고정폭', value: 'monospace' }
  ],
  fontSizes: [
    { name: '작게', value: '0.875rem' },
    { name: '보통', value: '1rem' },
    { name: '크게', value: '1.25rem' },
    { name: '아주크게', value: '1.5rem' }
  ]
};

export default function KoreanRichEditor({ 
  value, 
  onChange, 
  placeholder = "내용을 입력하세요...", 
  className = "",
  minHeight = "400px",
  enableKoreanFeatures = true
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [editorNotice, setEditorNotice] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const escapeHtml = useCallback((s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;'), []);

  // 한국어 텍스트 분석
  const analyzeKoreanText = useCallback((text: string) => {
    if (!enableKoreanFeatures) return;
    
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    const totalChars = text.length;
    
    setCharCount(totalChars);
    setWordCount(koreanChars + englishWords);
  }, [enableKoreanFeatures]);

  const buildLinkCardHtml = useCallback((meta: { 
    url: string; 
    title?: string; 
    description?: string; 
    image?: string; 
    site_name?: string 
  }) => {
    const title = meta.title ? escapeHtml(meta.title) : escapeHtml(new URL(meta.url).hostname);
    const desc = meta.description ? escapeHtml(meta.description) : '';
    const site = meta.site_name ? escapeHtml(meta.site_name) : escapeHtml(new URL(meta.url).hostname);
    const img = meta.image ? 
      `<img src="${meta.image}" alt="${title}" loading="lazy" class="w-24 h-24 object-cover flex-shrink-0 rounded-l"/>` : '';
    
    return `
<div class="link-card border border-gray-200 rounded-xl overflow-hidden my-4 bg-white shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer">
  <a href="${meta.url}" target="_blank" rel="noopener noreferrer" class="no-underline block">
    <div class="flex">
      ${img}
      <div class="p-4 flex-1 min-w-0">
        <div class="font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">${title}</div>
        ${desc ? `<div class="text-sm text-gray-600 mt-2 line-clamp-2">${desc}</div>` : ''}
        <div class="text-xs text-gray-500 mt-3 flex items-center gap-2">
          <span class="inline-flex items-center gap-1">
            🔗
            <span>${site}</span>
          </span>
          <span class="text-gray-300">•</span>
          <span class="text-blue-500 font-medium">새 탭에서 열기</span>
        </div>
      </div>
    </div>
  </a>
</div>`;
  }, [escapeHtml]);

  const makeVideoEmbed = useCallback((url: string): string | null => {
    try {
      const u = new URL(url.trim());
      const host = u.hostname.replace(/^www\./, '');
      
      // YouTube (한국어 최적화)
      if (host === 'youtube.com' || host === 'youtu.be') {
        let id = '';
        if (host === 'youtu.be') {
          id = u.pathname.split('/').filter(Boolean)[0] || '';
        } else {
          if (u.pathname.startsWith('/watch')) id = u.searchParams.get('v') || '';
          else if (u.pathname.startsWith('/shorts/')) id = u.pathname.split('/')[2] || '';
          else if (u.pathname.startsWith('/embed/')) id = u.pathname.split('/')[2] || '';
        }
        if (!id) return null;
        
        const startParam = u.searchParams.get('t') || u.searchParams.get('start') || '';
        const start = startParam && /^(\d+)(s)?$/.test(startParam) ? parseInt(startParam) : 0;
        const qs = new URLSearchParams();
        qs.set('rel', '0');
        if (start > 0) qs.set('start', String(start));
        
        const src = `https://www.youtube.com/embed/${id}?${qs.toString()}`;
        return `
          <div class="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-xl my-6 group">
            <div class="absolute inset-0 bg-gradient-to-br from-red-500/20 to-blue-500/20"></div>
            <iframe 
              src="${src}" 
              title="🎬 유튜브 동영상" 
              loading="lazy" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowfullscreen 
              class="absolute inset-0 w-full h-full border-0">
            </iframe>
            <div class="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <span>▶️</span>
              <span>유튜브</span>
            </div>
          </div>`;
      }
      
      // 네이버TV (한국 플랫폼)
      if (host === 'tv.naver.com') {
        const m = u.pathname.match(/\/v\/([0-9a-zA-Z]+)/);
        const id = m?.[1] || '';
        if (!id) return null;
        
        return `
          <div class="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-xl my-6">
            <div class="absolute inset-0 bg-gradient-to-br from-green-500/20 to-blue-500/20"></div>
            <iframe 
              src="https://tv.naver.com/embed/${id}" 
              title="📺 네이버TV 동영상" 
              loading="lazy" 
              allow="autoplay; fullscreen; picture-in-picture" 
              allowfullscreen 
              class="absolute inset-0 w-full h-full border-0">
            </iframe>
            <div class="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
              <span>📺</span>
              <span>네이버TV</span>
            </div>
          </div>`;
      }
      
      return null;
    } catch {
      return null;
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        paragraph: {
          HTMLAttributes: {
            class: 'my-4 leading-relaxed',
          },
        },
      }),
      Link.configure({ 
        openOnClick: true, 
        autolink: true,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline font-medium transition-colors',
        },
      }),
      Image.configure({ 
        HTMLAttributes: { 
          class: 'max-w-full h-auto rounded-2xl shadow-xl my-8 border border-gray-100 transition-transform hover:scale-105' 
        } 
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'min-w-full divide-y divide-gray-200',
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: 'bg-white hover:bg-gray-50 transition-colors',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: 'px-6 py-4 text-left text-sm font-semibold text-gray-900 bg-gray-50',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
        },
      }),
      Placeholder.configure({ 
        placeholder: enableKoreanFeatures ? `✍️ ${placeholder}` : placeholder,
        emptyNodeClass: 'text-gray-400 text-lg',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'underline decoration-wavy decoration-blue-400',
        },
      }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      
      if (enableKoreanFeatures) {
        const textContent = editor.getText();
        analyzeKoreanText(textContent);
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-xl max-w-none focus:outline-none bg-white border border-gray-200 rounded-2xl shadow-sm transition-all duration-300 hover:border-gray-300 focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-300 focus-within:ring-opacity-50`,
        style: `min-height: ${minHeight}`,
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        const text = event.clipboardData?.getData('text/plain') || '';
        const html = event.clipboardData?.getData('text/html') || '';
        
        // 1. 이미지 파일 붙여넣기 (파일)
        if (items) {
          for (const it of items) {
            if (it.kind === 'file') {
              const f = it.getAsFile();
              if (f && /image\/(jpeg|png|webp|gif)/.test(f.type)) {
                event.preventDefault();
                void uploadSelectedImage(f);
                return true;
              }
            }
          }
        }
        
        // 2. Blob URL 이미지 처리 (HTML에서 img 태그 추출)
        if (html) {
          const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
          if (imgMatch && imgMatch[1]) {
            const imgSrc = imgMatch[1];
            if (imgSrc.startsWith('blob:')) {
              event.preventDefault();
              try {
                // Blob URL을 fetch하여 File 객체로 변환
                fetch(imgSrc)
                  .then(res => res.blob())
                  .then(blob => {
                    const file = new File([blob], 'pasted-image.png', { type: blob.type });
                    void uploadSelectedImage(file);
                  })
                  .catch(() => {
                    // 실패 시 직접 이미지 삽입
                    editor?.chain().focus().insertContent(`<img src="${imgSrc}" alt="붙여넣기 이미지" />`).run();
                  });
              } catch {
                // fetch 실패 시 직접 이미지 삽입
                editor?.chain().focus().insertContent(`<img src="${imgSrc}" alt="붙여넣기 이미지" />`).run();
              }
              return true;
            }
          }
        }
        
        // 3. 텍스트가 이미지 URL인 경우
        if (text && (text.startsWith('blob:') || text.match(/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i))) {
          event.preventDefault();
          editor?.chain().focus().insertContent(`<img src="${text}" alt="이미지" />`).run();
          return true;
        }
        
        // 4. 비디오 링크 자동 임베드
        if (text && /^https?:\/\//i.test(text)) {
          const embed = makeVideoEmbed(text);
          if (embed) {
            event.preventDefault();
            // 일반 텍스트 링크로 삽입 (PostDetailPage에서 변환됨)
            editor?.chain().focus().insertContent(text).run();
            return true;
          }
          
          // 일반 링크 → 링크 카드 삽입
          event.preventDefault();
          void insertLinkCardFromUrl(text);
          return true;
        }
        return false;
      },
      handleDrop(view, event) {
        const files = (event as DragEvent).dataTransfer?.files;
        if (!files || !files.length) return false;
        for (const f of Array.from(files)) {
          if (/image\/(jpeg|png|webp)/.test(f.type)) {
            event.preventDefault();
            void uploadSelectedImage(f);
            return true;
          }
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      try {
        (editor.commands as any).setContent(value || '<p></p>', { emitUpdate: false });
      } catch {
        editor.commands.setContent(value || '<p></p>');
      }
    }
  }, [value, editor]);

  // editor 정의 이후에 editor를 사용하는 함수들 재정의
  const insertLinkCardFromUrl = useCallback(async (url: string) => {
    if (!editor) return;
    
    try {
      const u = new URL(url);
      if (!(u.protocol === 'http:' || u.protocol === 'https:')) {
        editor?.chain().focus().insertContent(escapeHtml(url)).run();
        return;
      }
      
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error('미리보기 로드 실패');
      
      const data = await res.json();
      const html = buildLinkCardHtml({
        url,
        title: data.title || data.ogTitle,
        description: data.description || data.ogDescription,
        image: data.image || data.ogImage,
        site_name: data.site_name || data.ogSiteName,
      });
      
      editor?.chain().focus().insertContent(html).run();
    } catch {
      const safeUrl = escapeHtml(url);
      const fallback = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline font-medium">${safeUrl}</a>`;
      editor?.chain().focus().insertContent(fallback).run();
    }
  }, [editor, escapeHtml, buildLinkCardHtml]);

  const uploadSelectedImage = useCallback(async (file: File) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!ALLOWED.includes(file.type)) {
      setUploadError('❌ 이미지는 JPEG/PNG/WEBP 형식만 업로드할 수 있습니다.');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }
    
    if (file.size > MAX_SIZE) {
      setUploadError('❌ 이미지 파일 크기가 5MB를 초과합니다.');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    setProgress(0);
    
    let toUpload: File = file;
    try {
      if (file.type !== 'image/webp') {
        toUpload = await compressToWebp(file, { maxWidth: 1920, quality: 0.9 });
      }
    } catch (err: any) {
      console.warn('WebP 변환 실패, 원본 업로드로 진행:', err?.message);
    }
    
    const form = new FormData();
    form.append('file', toUpload);
    
    try {
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            try {
              const json = JSON.parse(xhr.responseText || '{}');
              if (xhr.status >= 200 && xhr.status < 300 && json.publicUrl) {
                setProgress(100);
                editor?.chain().focus().setImage({ src: json.publicUrl, alt: toUpload.name }).run();
                resolve();
              } else {
                reject(new Error(json.error || '업로드 실패'));
              }
            } catch (err) {
              reject(err as any);
            }
          }
        };
        xhr.onerror = () => reject(new Error('네트워크 오류'));
        xhr.send(form);
      });
    } catch (err: any) {
      setUploadError(`❌ ${err?.message || '업로드 실패'}`);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [editor]);

  const uploadImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await uploadSelectedImage(file);
    };
    input.click();
  }, [uploadSelectedImage]);

  const handleLinkInsert = useCallback(() => {
    const url = linkUrl.trim();
    if (!url) { 
      setShowLinkInput(false); 
      return; 
    }
    editor?.chain().focus().setLink({ href: url }).run();
    setLinkUrl('');
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const handleVideoInsert = useCallback(() => {
    const url = videoUrl.trim();
    if (!url) { 
      setShowVideoInput(false); 
      return; 
    }
    
    // URL 검증만 하고 실제로는 텍스트 링크로 삽입
    const isValidVideo = makeVideoEmbed(url);
    if (!isValidVideo) {
      const supportedPlatforms = Object.values(KOREAN_FEATURES.videoPlatforms).map(p => p.name).join(', ');
      setEditorNotice(`❌ 지원되지 않는 동영상 링크입니다. 지원 플랫폼: ${supportedPlatforms}`);
      setTimeout(() => setEditorNotice(null), 4000);
      return;
    }
    
    // 일반 텍스트 링크로 삽입 (PostDetailPage에서 변환됨)
    editor?.chain().focus().insertContent(url).run();
    setVideoUrl('');
    setShowVideoInput(false);
  }, [editor, videoUrl, makeVideoEmbed]);

  const toolbarButtons = useMemo((): ToolbarButton[] => [
    {
      name: '굵게',
      icon: Bold,
      action: () => editor?.chain().focus().toggleBold().run(),
      active: editor?.isActive('bold'),
      shortcut: 'Ctrl+B'
    },
    {
      name: '기울임',
      icon: Italic,
      action: () => editor?.chain().focus().toggleItalic().run(),
      active: editor?.isActive('italic'),
      shortcut: 'Ctrl+I'
    },
    {
      name: '밑줄',
      icon: UnderlineIcon,
      action: () => editor?.chain().focus().toggleUnderline().run(),
      active: editor?.isActive('underline'),
      shortcut: 'Ctrl+U'
    },
    { type: 'separator' },
    {
      name: '제목',
      icon: Heading,
      action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor?.isActive('heading', { level: 2 })
    },
    {
      name: '글머리목록',
      icon: List,
      action: () => editor?.chain().focus().toggleBulletList().run(),
      active: editor?.isActive('bulletList')
    },
    {
      name: '번호목록',
      icon: ListOrdered,
      action: () => editor?.chain().focus().toggleOrderedList().run(),
      active: editor?.isActive('orderedList')
    },
    { type: 'separator' },
    {
      name: '링크',
      icon: LinkIcon,
      action: () => setShowLinkInput(!showLinkInput),
      active: showLinkInput
    },
    {
      name: '이미지',
      icon: ImageIcon,
      action: uploadImage,
      disabled: uploading,
      loading: uploading
    },
    {
      name: '동영상',
      icon: Video,
      action: () => setShowVideoInput(!showVideoInput),
      active: showVideoInput
    },
    ...(enableKoreanFeatures ? [{
      name: '표',
      icon: TableIcon,
      action: () => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
      active: editor?.isActive('table')
    }] : []),
    { type: 'separator' },
    {
      name: '코드블록',
      icon: Code,
      action: () => editor?.chain().focus().toggleCodeBlock().run(),
      active: editor?.isActive('codeBlock')
    },
    {
      name: '인용',
      icon: Quote,
      action: () => editor?.chain().focus().toggleBlockquote().run(),
      active: editor?.isActive('blockquote')
    },
    { type: 'separator' },
    {
      name: '실행취소',
      icon: Undo,
      action: () => editor?.chain().focus().undo().run(),
      disabled: !editor?.can().undo(),
      shortcut: 'Ctrl+Z'
    },
    {
      name: '다시실행',
      icon: Redo,
      action: () => editor?.chain().focus().redo().run(),
      disabled: !editor?.can().redo(),
      shortcut: 'Ctrl+Y'
    }
  ], [editor, showLinkInput, showVideoInput, uploading, enableKoreanFeatures]);

  if (!editor) return null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 현대적인 툴바 */}
      <div className="flex flex-wrap items-center gap-1 p-4 bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 border border-gray-200 rounded-2xl shadow-lg backdrop-blur-sm">
        {toolbarButtons.map((btn, index) => {
          if ('type' in btn && btn.type === 'separator') {
            return (
              <div key={index} className="w-px h-7 bg-gray-300 mx-2" />
            );
          }
          
          // Type guard to ensure btn is a regular button with icon
          if (!('icon' in btn)) {
            return null;
          }
          
          const Icon = btn.icon;
          return (
            <button
              key={index}
              type="button"
              className={`
                relative p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${btn.active 
                  ? 'bg-blue-100 text-blue-600 shadow-inner transform scale-95' 
                  : 'hover:bg-white hover:shadow-xl text-gray-700 hover:text-gray-900 hover:scale-105'
                }
                ${btn.disabled || btn.loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                group
              `}
              onClick={btn.action}
              disabled={btn.disabled || btn.loading}
              aria-label={btn.name}
              aria-pressed={btn.active}
              title={`${btn.name}${btn.shortcut ? ` (${btn.shortcut})` : ''}`}
            >
              {btn.loading ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                Icon && <Icon className="w-4 h-4" />
              )}
              {btn.shortcut && (
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {btn.shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 한국어 텍스트 통계 */}
      {enableKoreanFeatures && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">글자 수:</span>
                <span className="text-lg font-bold text-blue-600">{charCount.toLocaleString()}</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">단어 수:</span>
                <span className="text-lg font-bold text-purple-600">{wordCount.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              한글+영어 단어 기준
            </div>
          </div>
        </div>
      )}

      {/* 링크 입력 모달 */}
      {showLinkInput && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔗 링크 주소 입력
              </label>
              <input
                type="url"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                placeholder="예: https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLinkInsert();
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
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium shadow-lg"
                onClick={handleLinkInsert}
              >
                링크 삽입
              </button>
              <button
                type="button"
                className="p-3 text-gray-500 hover:text-gray-700 transition-colors rounded-xl hover:bg-gray-100"
                onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비디오 입력 모달 */}
      {showVideoInput && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🎥 동영상 링크 입력
              </label>
              <input
                type="url"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-lg"
                placeholder="지원 플랫폼: YouTube, 네이버TV, Vimeo, Twitch"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleVideoInsert();
                  } else if (e.key === 'Escape') {
                    setShowVideoInput(false);
                    setVideoUrl('');
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 font-medium shadow-lg"
                onClick={handleVideoInsert}
              >
                동영상 삽입
              </button>
              <button
                type="button"
                className="p-3 text-gray-500 hover:text-gray-700 transition-colors rounded-xl hover:bg-gray-100"
                onClick={() => { setShowVideoInput(false); setVideoUrl(''); }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {editorNotice && (
            <p className="text-sm text-red-600 mt-4 font-medium">{editorNotice}</p>
          )}
        </div>
      )}

      {/* 에디터 본문 */}
      <div className="relative group">
        <EditorContent 
          editor={editor} 
          className="transition-all duration-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 focus-within:shadow-2xl"
        />
        
        {/* 업로드 오버레이 */}
        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-98 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">이미지 업로드 중</p>
                    <p className="text-sm text-gray-500">{progress}% 완료</p>
                  </div>
                </div>
                {progress === 100 && (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4 shadow-lg">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-base text-red-600 font-semibold">{uploadError}</p>
        </div>
      )}

      {/* 한국어 사용자를 위한 종합 도움말 */}
      {enableKoreanFeatures && (
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border border-blue-200 rounded-2xl p-6 shadow-xl">
          <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-3 text-lg">
            <span className="text-2xl">🎯</span>
            <span>한국어 에디터 완벽 가이드</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <h5 className="font-semibold text-blue-600 mb-2 flex items-center gap-2">
                <span>📝</span>
                <span>텍스트 작성</span>
              </h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ctrl+B: <strong>굵게</strong></li>
                <li>• Ctrl+I: <em>기울임</em></li>
                <li>• Ctrl+U: <u>밑줄</u></li>
                <li>• 한글 자소 단위 입력 지원</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-100">
              <h5 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                <span>🖼️</span>
                <span>미디어 삽입</span>
              </h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 이미지 드래그&드롭</li>
                <li>• 클립보드 붙여넣기</li>
                <li>• 자동 WebP 변환</li>
                <li>• 5MB 이하 최적화</li>
              </ul>
            </div>
            <div className="bg-white rounded-xl p-4 border border-purple-100">
              <h5 className="font-semibold text-purple-600 mb-2 flex items-center gap-2">
                <span>🎬</span>
                <span>동영상 임베드</span>
              </h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 유튜브 자동 임베드</li>
                <li>• 네이버TV 완벽 지원</li>
                <li>• 링크만 붙여넣으면 OK</li>
                <li>• 자동 시작 시간 인식</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <span className="text-yellow-500">💡</span>
              <span><strong>프로 팁:</strong> 웹사이트 링크를 붙여넣으면 자동으로 예쁜 카드로 변환되며, 읽기 쉬운 형태로 표시됩니다. 한국어 콘텐츠에 최적화된 에디터를 즐겨보세요!</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}