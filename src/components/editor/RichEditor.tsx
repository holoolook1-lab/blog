"use client";
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { compressToWebp } from '@/lib/utils/imageClient';
import { 
  Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, Image as ImageIcon, 
  Video, List, ListOrdered, Heading, Quote, Code, Undo, Redo, X, Plus 
} from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
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

// 한국어 비디오 플랫폼 지원
const KOREAN_VIDEO_PLATFORMS = {
  'tv.naver.com': '네이버TV',
  'youtube.com': '유튜브',
  'youtu.be': '유튜브',
  'vimeo.com': '비메오',
  'twitch.tv': '트위치'
};

export default function RichEditor({ 
  value, 
  onChange, 
  placeholder = "내용을 입력하세요...", 
  className = "",
  minHeight = "300px"
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [editorNotice, setEditorNotice] = useState<string | null>(null);

  const escapeHtml = useCallback((s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;'), []);

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
<div class="link-card border border-gray-200 rounded-lg overflow-hidden my-3 bg-white shadow-sm hover:shadow-md transition-all duration-200 group">
  <a href="${meta.url}" target="_blank" rel="noopener noreferrer" class="no-underline block">
    <div class="flex">
      ${img}
      <div class="p-4 flex-1 min-w-0">
        <div class="font-semibold text-gray-900 leading-snug group-hover:text-blue-600 transition-colors">${title}</div>
        ${desc ? `<div class="text-sm text-gray-600 mt-2 line-clamp-2">${desc}</div>` : ''}
        <div class="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <span>🔗</span>
          <span>${site}</span>
        </div>
      </div>
    </div>
  </a>
</div>`;
  }, [escapeHtml]);

  const insertLinkCardFromUrl = useCallback(async (url: string) => {
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
      const fallback = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${safeUrl}</a>`;
      editor?.chain().focus().insertContent(fallback).run();
    }
  }, [escapeHtml, buildLinkCardHtml]);

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
          <div class="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg my-4 group">
            <iframe 
              src="${src}" 
              title="유튜브 동영상" 
              loading="lazy" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowfullscreen 
              class="absolute inset-0 w-full h-full border-0">
            </iframe>
          </div>`;
      }
      
      // 네이버TV (한국 플랫폼)
      if (host === 'tv.naver.com') {
        const m = u.pathname.match(/\/v\/([0-9a-zA-Z]+)/);
        const id = m?.[1] || '';
        if (!id) return null;
        
        return `
          <div class="relative w-full aspect-[16/9] rounded-xl overflow-hidden shadow-lg my-4">
            <iframe 
              src="https://tv.naver.com/embed/${id}" 
              title="네이버TV 동영상" 
              loading="lazy" 
              allow="autoplay; fullscreen; picture-in-picture" 
              allowfullscreen 
              class="absolute inset-0 w-full h-full border-0">
            </iframe>
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
          levels: [1, 2, 3, 4],
        },
      }),
      Link.configure({ 
        openOnClick: true, 
        autolink: true,
        HTMLAttributes: {
          class: 'text-blue-600 hover:underline font-medium',
        },
      }),
      Image.configure({ 
        HTMLAttributes: { 
          class: 'max-w-full h-auto rounded-xl shadow-lg my-6 border border-gray-100' 
        } 
      }),
      Placeholder.configure({ 
        placeholder,
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
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-lg max-w-none focus:outline-none bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-200 hover:border-gray-300 focus-within:border-blue-500 focus-within:shadow-md`,
        style: `min-height: ${minHeight}`,
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        
        // 이미지 파일 붙여넣기
        for (const it of items) {
          if (it.kind === 'file') {
            const f = it.getAsFile();
            if (f && /image\/(jpeg|png|webp)/.test(f.type)) {
              event.preventDefault();
              void uploadSelectedImage(f);
              return true;
            }
          }
        }
        
        // YouTube 링크 포함 텍스트 처리 개선
        const text = event.clipboardData?.getData('text/plain') || '';
        if (text) {
          // YouTube 링크 패턴 찾기
          const youtubePattern = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/gi;
          const matches = [...text.matchAll(youtubePattern)];
          
          if (matches.length > 0) {
            event.preventDefault();
            
            // 텍스트를 분할하여 처리
            let processedText = text;
            const embeds: string[] = [];
            
            // 각 YouTube 링크를 임베드로 변환
            for (const match of matches) {
              const fullUrl = match[0];
              const embed = makeVideoEmbed(fullUrl);
              if (embed) {
                embeds.push(embed);
                // 텍스트에서 URL을 플레이스홀더로 교체
                processedText = processedText.replace(fullUrl, `{{EMBED_${embeds.length - 1}}}`);
              }
            }
            
            // 최종 HTML 조합
            let finalHtml = escapeHtml(processedText);
            
            // 플레이스홀더를 실제 임베드로 교체
            embeds.forEach((embed, index) => {
              finalHtml = finalHtml.replace(`{{EMBED_${index}}}`, embed);
            });
            
            // 줄바꿈을 <br> 태그로 변환
            finalHtml = finalHtml.replace(/\n/g, '<br>');
            
            editor?.chain().focus().insertContent(finalHtml).run();
            return true;
          }
          
          // 단일 URL인 경우 기존 로직 유지
          if (/^https?:\/\//i.test(text)) {
            const embed = makeVideoEmbed(text);
            if (embed) {
              event.preventDefault();
              editor?.chain().focus().insertContent(embed).run();
              return true;
            }
            
            // 일반 링크 → 링크 카드 삽입
            event.preventDefault();
            void insertLinkCardFromUrl(text);
            return true;
          }
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
        toUpload = await compressToWebp(file, { maxWidth: 1920, quality: 0.88 });
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
  }, [linkUrl]);

  const handleVideoInsert = useCallback(() => {
    const url = videoUrl.trim();
    if (!url) { 
      setShowVideoInput(false); 
      return; 
    }
    
    const embed = makeVideoEmbed(url);
    if (!embed) {
      const supportedPlatforms = Object.values(KOREAN_VIDEO_PLATFORMS).join(', ');
      setEditorNotice(`❌ 지원되지 않는 동영상 링크입니다. 지원 플랫폼: ${supportedPlatforms}`);
      setTimeout(() => setEditorNotice(null), 4000);
      return;
    }
    
    editor?.chain().focus().insertContent(embed).run();
    setVideoUrl('');
    setShowVideoInput(false);
  }, [videoUrl, makeVideoEmbed]);

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
  ], [editor, showLinkInput, showVideoInput, uploading]);

  if (!editor) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 현대적인 툴바 */}
      <div className="flex flex-wrap items-center gap-1 p-3 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl shadow-sm">
        {toolbarButtons.map((btn, index) => {
          if ('type' in btn && btn.type === 'separator') {
            return (
              <div key={index} className="w-px h-6 bg-gray-300 mx-1" />
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
                relative p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
                ${btn.active 
                  ? 'bg-blue-100 text-blue-600 shadow-inner' 
                  : 'hover:bg-white hover:shadow-md text-gray-700 hover:text-gray-900'
                }
                ${btn.disabled || btn.loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
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
                <Icon className="w-4 h-4" />
              )}
            </button>
          );
        })}
      </div>

      {/* 링크 입력 모달 */}
      {showLinkInput && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <input
              type="url"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="🔗 링크 주소를 입력하세요 (예: https://example.com)"
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
            <button
              type="button"
              className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              onClick={handleLinkInsert}
            >
              삽입
            </button>
            <button
              type="button"
              className="p-3 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 비디오 입력 모달 */}
      {showVideoInput && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <input
              type="url"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="🎥 동영상 링크를 입력하세요 (YouTube, 네이버TV, Vimeo, Twitch)"
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
            <button
              type="button"
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
              onClick={handleVideoInsert}
            >
              삽입
            </button>
            <button
              type="button"
              className="p-3 text-gray-500 hover:text-gray-700 transition-colors"
              onClick={() => { setShowVideoInput(false); setVideoUrl(''); }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {editorNotice && (
            <p className="text-sm text-red-600 mt-3 font-medium">{editorNotice}</p>
          )}
        </div>
      )}

      {/* 에디터 본문 */}
      <div className="relative group">
        <EditorContent 
          editor={editor} 
          className="transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 focus-within:shadow-lg"
        />
        
        {/* 업로드 오버레이 */}
        {uploading && (
          <div className="absolute inset-0 bg-white bg-opacity-95 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">이미지 업로드 중</p>
                    <p className="text-sm text-gray-500">{progress}% 완료</p>
                  </div>
                </div>
                {progress === 100 && (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-red-600 font-medium">{uploadError}</p>
        </div>
      )}

      {/* 한국어 사용자를 위한 도움말 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>에디터 사용 팁</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 font-bold">•</span>
            <span>이미지를 드래그&드롭하거나 클립보드에서 붙여넣을 수 있어요</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500 font-bold">•</span>
            <span>유튜브, 네이버TV 링크를 붙여넣으면 자동으로 임베드돼요</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500 font-bold">•</span>
            <span>Ctrl+Z로 실행 취소, Ctrl+Y로 다시 실행할 수 있어요</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">•</span>
            <span>웹사이트 링크를 붙여넣으면 예쁜 카드로 자동 변환돼요</span>
          </div>
        </div>
      </div>
    </div>
  );
}