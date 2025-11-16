"use client";
import { useEffect, useState, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { compressToWebp } from '@/lib/utils/imageClient';
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon, Image as ImageIcon, Video, List, ListOrdered, Heading, Quote, Code, AlignLeft, AlignCenter, AlignRight, Undo, Redo } from 'lucide-react';

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

export default function AdvancedEditor({ value, onChange, placeholder = "내용을 입력하세요...", className = "" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [editorNotice, setEditorNotice] = useState<string | null>(null);

  const escapeHtml = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const buildLinkCardHtml = (meta: { url: string; title?: string; description?: string; image?: string; site_name?: string }) => {
    const title = meta.title ? escapeHtml(meta.title) : escapeHtml(new URL(meta.url).hostname);
    const desc = meta.description ? escapeHtml(meta.description) : '';
    const site = meta.site_name ? escapeHtml(meta.site_name) : escapeHtml(new URL(meta.url).hostname);
    const img = meta.image ? `<img src="${meta.image}" alt="${title}" loading="lazy" class="w-24 h-24 object-cover flex-shrink-0 rounded-l"/>` : '';
    return `
<div class="link-card border rounded-lg overflow-hidden my-2 bg-white shadow-sm hover:shadow-md transition-shadow">
  <a href="${meta.url}" target="_blank" rel="noopener noreferrer" class="no-underline block">
    <div class="flex">
      ${img}
      <div class="p-3 flex-1 min-w-0">
        <div class="font-semibold text-gray-900 leading-snug truncate">${title}</div>
        ${desc ? `<div class="text-sm text-gray-600 mt-1 line-clamp-2">${desc}</div>` : ''}
        <div class="text-xs text-gray-500 mt-2">${site}</div>
      </div>
    </div>
  </a>
</div>`;
  };

  const insertLinkCardFromUrl = async (url: string) => {
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
  };

  const makeVideoEmbed = (url: string): string | null => {
    try {
      const u = new URL(url.trim());
      const host = u.hostname.replace(/^www\./, '');
      
      // YouTube
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
        return `<div class="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-lg"><iframe src="${src}" title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
      }
      
      // Vimeo
      if (host === 'vimeo.com') {
        const id = (u.pathname.split('/').filter(Boolean)[0] || '').replace(/[^0-9]/g, '');
        if (!id) return null;
        const src = `https://player.vimeo.com/video/${id}`;
        return `<div class="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-lg"><iframe src="${src}" title="Vimeo video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
      }
      
      // Naver TV (한국 최적화)
      if (host === 'tv.naver.com') {
        const m = u.pathname.match(/\/v\/([0-9a-zA-Z]+)/);
        const id = m?.[1] || '';
        if (!id) return null;
        const src = `https://tv.naver.com/embed/${id}`;
        return `<div class="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-lg"><iframe src="${src}" title="Naver TV video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
      }
      
      // Twitch
      if (host === 'twitch.tv') {
        const siteUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
        let parentHost = 'localhost';
        try { parentHost = new URL(siteUrl).hostname; } catch {}
        
        const vod = u.pathname.match(/\/videos\/(\d+)/);
        if (vod?.[1]) {
          const src = `https://player.twitch.tv/?video=${vod[1]}&parent=${parentHost}`;
          return `<div class="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-lg"><iframe src="${src}" title="Twitch video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
        }
        
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length === 1 && parts[0] && parts[0] !== 'videos') {
          const src = `https://clips.twitch.tv/embed?clip=${parts[0]}&parent=${parentHost}`;
          return `<div class="relative w-full aspect-[16/9] rounded-lg overflow-hidden shadow-lg"><iframe src="${src}" title="Twitch clip" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  };

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
          class: 'text-blue-600 hover:underline',
        },
      }),
      Image.configure({ 
        HTMLAttributes: { 
          class: 'max-w-full h-auto rounded-lg shadow-md my-4' 
        } 
      }),
      Placeholder.configure({ 
        placeholder,
        emptyNodeClass: 'text-gray-400',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[300px] p-4 bg-white border border-gray-200 rounded-lg shadow-sm',
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
        
        // 비디오 링크 자동 임베드
        const text = event.clipboardData?.getData('text/plain') || '';
        if (text && /^https?:\/\//i.test(text)) {
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
      setUploadError('이미지는 JPEG/PNG/WEBP 형식만 업로드할 수 있습니다.');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }
    
    if (file.size > MAX_SIZE) {
      setUploadError('이미지 파일 크기가 5MB를 초과합니다.');
      setTimeout(() => setUploadError(null), 3000);
      return;
    }
    
    setUploading(true);
    setUploadError(null);
    setProgress(0);
    
    let toUpload: File = file;
    try {
      if (file.type !== 'image/webp') {
        toUpload = await compressToWebp(file, { maxWidth: 1920, quality: 0.85 });
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
      setUploadError(err?.message || '업로드 실패');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  }, [editor]);

  const uploadImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      await uploadSelectedImage(file);
    };
    input.click();
  };

  const handleLinkInsert = () => {
    const url = linkUrl.trim();
    if (!url) { 
      setShowLinkInput(false); 
      return; 
    }
    editor?.chain().focus().setLink({ href: url }).run();
    setLinkUrl('');
    setShowLinkInput(false);
  };

  const handleVideoInsert = () => {
    const url = videoUrl.trim();
    if (!url) { 
      setShowVideoInput(false); 
      return; 
    }
    const embed = makeVideoEmbed(url);
    if (!embed) {
      setEditorNotice('지원되지 않는 동영상 링크입니다. (YouTube/Vimeo/NaverTV/Twitch)');
      setTimeout(() => setEditorNotice(null), 3000);
      return;
    }
    editor?.chain().focus().insertContent(embed).run();
    setVideoUrl('');
    setShowVideoInput(false);
  };

  if (!editor) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border border-gray-200 rounded-lg" role="toolbar" aria-label="에디터 도구">
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="굵게"
            aria-pressed={editor.isActive('bold')}
            title="굵게 (Ctrl+B)"
          >
            <Bold className={`w-4 h-4 ${editor.isActive('bold') ? 'text-blue-600' : 'text-gray-700'}`} />
          </button>
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="기울임"
            aria-pressed={editor.isActive('italic')}
            title="기울임 (Ctrl+I)"
          >
            <Italic className={`w-4 h-4 ${editor.isActive('italic') ? 'text-blue-600' : 'text-gray-700'}`} />
          </button>
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="밑줄"
            aria-pressed={editor.isActive('underline')}
            title="밑줄 (Ctrl+U)"
          >
            <UnderlineIcon className={`w-4 h-4 ${editor.isActive('underline') ? 'text-blue-600' : 'text-gray-700'}`} />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="제목 2"
            aria-pressed={editor.isActive('heading', { level: 2 })}
            title="제목 2"
          >
            <Heading className={`w-4 h-4 ${editor.isActive('heading', { level: 2 }) ? 'text-blue-600' : 'text-gray-700'}`} />
          </button>
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            aria-label="글머리 기호 목록"
            aria-pressed={editor.isActive('bulletList')}
            title="글머리 기호 목록"
          >
            <List className={`w-4 h-4 ${editor.isActive('bulletList') ? 'text-blue-600' : 'text-gray-700'}`} />
          </button>
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            aria-label="번호 매기기 목록"
            aria-pressed={editor.isActive('orderedList')}
            title="번호 매기기 목록"
          >
            <ListOrdered className={`w-4 h-4 ${editor.isActive('orderedList') ? 'text-blue-600' : 'text-gray-700'}`} />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setShowLinkInput(!showLinkInput)}
            aria-label="링크 삽입"
            aria-expanded={showLinkInput}
            title="링크 삽입"
          >
            <LinkIcon className="w-4 h-4 text-gray-700" />
          </button>
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={uploadImage}
            disabled={uploading}
            aria-busy={uploading}
            aria-label={uploading ? '이미지 업로드 중' : '이미지 삽입'}
            title="이미지 삽입"
          >
            <ImageIcon className={`w-4 h-4 ${uploading ? 'text-gray-400' : 'text-gray-700'}`} />
          </button>
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setShowVideoInput(!showVideoInput)}
            aria-label="동영상 삽입"
            aria-expanded={showVideoInput}
            title="동영상 삽입"
          >
            <Video className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            aria-label="코드 블록"
            aria-pressed={editor.isActive('codeBlock')}
            title="코드 블록"
          >
            <Code className={`w-4 h-4 ${editor.isActive('codeBlock') ? 'text-blue-600' : 'text-gray-700'}`} />
          </button>
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            aria-label="인용"
            aria-pressed={editor.isActive('blockquote')}
            title="인용"
          >
            <Quote className={`w-4 h-4 ${editor.isActive('blockquote') ? 'text-blue-600' : 'text-gray-700'}`} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            aria-label="실행 취소"
            title="실행 취소 (Ctrl+Z)"
          >
            <Undo className={`w-4 h-4 ${editor.can().undo() ? 'text-gray-700' : 'text-gray-400'}`} />
          </button>
          <button
            type="button"
            className="p-2 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            aria-label="다시 실행"
            title="다시 실행 (Ctrl+Y)"
          >
            <Redo className={`w-4 h-4 ${editor.can().redo() ? 'text-gray-700' : 'text-gray-400'}`} />
          </button>
        </div>
      </div>

      {/* 링크 입력 */}
      {showLinkInput && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <input
              type="url"
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="링크 주소를 입력하세요 (예: https://example.com)"
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
            />
            <button
              type="button"
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleLinkInsert}
            >
              삽입
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 비디오 입력 */}
      {showVideoInput && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <input
              type="url"
              className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="동영상 링크를 입력하세요 (YouTube/Vimeo/NaverTV/Twitch)"
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
            />
            <button
              type="button"
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
              onClick={handleVideoInsert}
            >
              삽입
            </button>
            <button
              type="button"
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              onClick={() => { setShowVideoInput(false); setVideoUrl(''); }}
            >
              취소
            </button>
          </div>
          {editorNotice && (
            <p className="text-sm text-red-600 mt-2">{editorNotice}</p>
          )}
        </div>
      )}

      {/* 에디터 본문 */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className="transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
        />
        
        {/* 업로드 진행 표시 */}
        {uploading && (
          <div className="absolute bottom-4 left-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">이미지 업로드 중...</span>
              <span className="text-sm text-gray-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {uploadError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{uploadError}</p>
        </div>
      )}

      {/* 도움말 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>팁:</strong> 이미지를 드래그&드롭하거나 클립보드에서 붙여넣을 수 있습니다.</p>
        <p>🔗 유튜브, 네이버TV, 비메오 링크를 붙여넣으면 자동으로 임베드됩니다.</p>
      </div>
    </div>
  );
}