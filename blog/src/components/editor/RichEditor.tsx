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
      <div>
        <p className="text-sm text-gray-600">미리보기</p>
        <div className="prose max-w-none border rounded p-3" dangerouslySetInnerHTML={{ __html: sanitizeHtml(editor.getHTML()) }} />
      </div>
    </div>
  );
}
