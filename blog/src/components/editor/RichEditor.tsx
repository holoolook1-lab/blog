"use client";
import { useEffect, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { compressToWebp } from '@/lib/utils/imageClient';

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function RichEditor({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // 훅 순서 불일치 방지: 모든 훅은 조건부 반환 전에 선언
  const [progress, setProgress] = useState<number>(0);
  // 일반 URL → 링크 카드 삽입 도우미
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
    const html = `
<div class="link-card border rounded-lg overflow-hidden my-2">
  <a href="${meta.url}" target="_blank" rel="noopener noreferrer" class="no-underline">
    <div class="flex">
      ${img}
      <div class="p-2">
        <div class="font-semibold leading-snug">${title}</div>
        ${desc ? `<div class="text-sm text-gray-600 mt-0.5 line-clamp-2">${desc}</div>` : ''}
        <div class="text-xs text-gray-500 mt-1">${site}</div>
      </div>
    </div>
  </a>
</div>`;
    return sanitizeHtml(html);
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
      // 실패 시 일반 링크로 삽입
      const safeUrl = escapeHtml(url);
      const fallback = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
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
        return `<div class="relative w-full aspect-[16/9]"><iframe src="${src}" title="YouTube video" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
      }
      // Vimeo
      if (host === 'vimeo.com') {
        const id = (u.pathname.split('/').filter(Boolean)[0] || '').replace(/[^0-9]/g, '');
        if (!id) return null;
        const src = `https://player.vimeo.com/video/${id}`;
        return `<div class="relative w-full aspect-[16/9]"><iframe src="${src}" title="Vimeo video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
      }
      // Dailymotion
      if (host === 'dailymotion.com') {
        const parts = u.pathname.split('/').filter(Boolean);
        const id = parts[0] === 'video' ? parts[1] : '';
        if (!id) return null;
        const src = `https://www.dailymotion.com/embed/video/${id}`;
        return `<div class="relative w-full aspect-[16/9]"><iframe src="${src}" title="Dailymotion video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
      }
      // Naver TV (KR 최적화)
      if (host === 'tv.naver.com') {
        const m = u.pathname.match(/\/v\/([0-9a-zA-Z]+)/);
        const id = m?.[1] || '';
        if (!id) return null;
        const src = `https://tv.naver.com/embed/${id}`;
        return `<div class="relative w-full aspect-[16/9]"><iframe src="${src}" title="Naver TV video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
      }
      // Twitch (VOD/클립)
      if (host === 'twitch.tv') {
        const siteUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
        let parentHost = 'localhost';
        try { parentHost = new URL(siteUrl).hostname; } catch {}
        // VOD: /videos/123456789
        const vod = u.pathname.match(/\/videos\/(\d+)/);
        if (vod?.[1]) {
          const src = `https://player.twitch.tv/?video=${vod[1]}&parent=${parentHost}`;
          return `<div class="relative w-full aspect-[16/9]"><iframe src="${src}" title="Twitch video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
        }
        // Clip: /{clipSlug}
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length === 1 && parts[0] && parts[0] !== 'videos') {
          const src = `https://clips.twitch.tv/embed?clip=${parts[0]}&parent=${parentHost}`;
          return `<div class="relative w-full aspect-[16/9]"><iframe src="${src}" title="Twitch clip" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
        }
      }
      // TikTok (embed v2)
      if (host === 'tiktok.com') {
        // URL 예시: https://www.tiktok.com/@user/video/1234567890
        const m = u.pathname.match(/\/video\/(\d+)/);
        const id = m?.[1] || '';
        if (!id) return null;
        const src = `https://www.tiktok.com/embed/v2/${id}`;
        return `<div class="relative w-full aspect-[9/16]"><iframe src="${src}" title="TikTok video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
      }
      // Instagram (Post/Reel)
      if (host === 'instagram.com') {
        // /p/{id}/, /reel/{id}/, /tv/{id}/ 지원
        const m = u.pathname.match(/\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/);
        const id = m?.[2] || '';
        if (!id) return null;
        const type = m?.[1] || 'p';
        const src = `https://www.instagram.com/${type}/${id}/embed`;
        return `<div class="relative w-full aspect-[9/16]"><iframe src="${src}" title="Instagram ${type}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
      }
      // Facebook Video
      if (host === 'facebook.com' || host === 'fb.watch') {
        const href = u.toString();
        const src = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(href)}&show_text=false&autoplay=1`;
        return `<div class="relative w-full aspect-[16/9]"><iframe src="${src}" title="Facebook video" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen class="absolute inset-0 w-full h-full"></iframe></div>`;
      }
      // 직접 파일 (mp4/webm/ogg)
      if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(u.pathname)) {
        const src = u.toString();
        return `<div class="relative w-full aspect-[16/9]"><video src="${src}" controls preload="metadata" playsinline class="absolute inset-0 w-full h-full"></video></div>`;
      }
      return null;
    } catch {
      return null;
    }
  };
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true, autolink: true }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full rounded' } }),
      Placeholder.configure({ placeholder: '내용을 입력하세요…' }),
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none min-h-[180px] border rounded p-3 focus:outline-none',
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        // 1) 이미지 파일 붙여넣기 처리
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
        // 2) 텍스트 내 비디오 공유 링크 자동 임베드
        const text = event.clipboardData?.getData('text/plain') || '';
        if (text && /^https?:\/\//i.test(text)) {
          const embed = makeVideoEmbed(text);
          if (embed) {
            event.preventDefault();
            editor?.chain().focus().insertContent(embed).run();
            return true;
          }
          // 3) 일반 웹 링크 → Open Graph 카드 삽입
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
    // 외부 값이 바뀌면 에디터에 반영(초기 로드/복원 시)
    if (value !== editor.getHTML()) {
      try {
        // TipTap 버전에 따라 시그니처 차이가 있어 any 캐스팅으로 호환 처리
        (editor.commands as any).setContent(value || '<p></p>', { emitUpdate: false });
      } catch {
        editor.commands.setContent(value || '<p></p>');
      }
    }
  }, [value, editor]);

  if (!editor) return null;

  const toggleLink = () => {
    const url = prompt('링크 URL을 입력하세요');
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  const insertVideo = () => {
    const url = prompt('동영상 공유 링크(URL)를 입력하세요');
    if (!url) return;
    const embed = makeVideoEmbed(url);
    if (!embed) {
      alert('지원하는 동영상 링크 형식이 아닙니다. (YouTube/Vimeo/mp4/webm/ogg)');
      return;
    }
    editor.chain().focus().insertContent(embed).run();
  };


  const uploadSelectedImage = async (file: File) => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED.includes(file.type)) {
      alert('이미지는 JPEG/PNG/WEBP 형식만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_SIZE) {
      alert('이미지 파일 크기가 5MB를 초과합니다.');
      return;
    }
    setUploading(true);
    setUploadError(null);
    setProgress(0);
    let toUpload: File = file;
    try {
      if (file.type !== 'image/webp') {
        toUpload = await compressToWebp(file, { maxWidth: 1920, quality: 0.82 });
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
  };

  const uploadImage = async () => {
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

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="border rounded px-2 py-1" onClick={() => editor.chain().focus().toggleBold().run()}>
          굵게
        </button>
        <button type="button" className="border rounded px-2 py-1" onClick={() => editor.chain().focus().toggleItalic().run()}>
          기울임
        </button>
        <button type="button" className="border rounded px-2 py-1" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          H2
        </button>
        <button type="button" className="border rounded px-2 py-1" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          목록
        </button>
        <button type="button" className="border rounded px-2 py-1" onClick={toggleLink}>
          링크
        </button>
        <button type="button" className="border rounded px-2 py-1 disabled:opacity-50" onClick={uploadImage} disabled={uploading} aria-busy={uploading}>
          {uploading ? '이미지 업로드 중…' : '이미지'}
        </button>
        <button type="button" className="border rounded px-2 py-1" onClick={insertVideo}>
          비디오
        </button>
        <button type="button" className="border rounded px-2 py-1" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          코드블록
        </button>
        <button type="button" className="border rounded px-2 py-1" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          인용
        </button>
      </div>
      <EditorContent editor={editor} />
      {uploading && (
        <div className="space-y-1">
          <p className="text-sm text-gray-600">업로드 중... {progress}%</p>
          <div className="h-2 w-full bg-gray-200 rounded">
            <div className="h-2 bg-primary rounded" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {uploadError && <p className="text-sm text-red-600">업로드 오류: {uploadError}</p>}
      {/* 별도 미리보기 없이 에디터 자체를 WYSIWYG으로 사용합니다. */}
    </div>
  );
}
