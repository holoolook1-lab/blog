"use client";
import { useRef, useState } from 'react';
import { outlineButtonSmall } from '@/lib/styles/ui';
import { compressToWebp } from '@/lib/utils/imageClient';
import { getOptimizedImageUrl } from '@/lib/utils/image';

export default function CoverUpload({ value, onChange }: { value?: string | null; onChange: (url: string | null) => void }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

  const onSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError('JPEG/PNG/WEBP 형식만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('파일 크기가 5MB를 초과합니다.');
      return;
    }
    setLoading(true);
    setProgress(0);
    setError(null);
    // md 요구사항: 업로드 전 WebP 변환(최대 1920px, 품질 80~85)
    let toUpload: File = file;
    try {
      if (file.type !== 'image/webp') {
        toUpload = await compressToWebp(file, { maxWidth: 1920, quality: 0.82 });
      }
    } catch (err: any) {
      // 변환 실패 시 원본 업로드로 폴백
      console.warn('WebP 변환 실패, 원본 업로드로 진행:', err?.message);
    }
    const form = new FormData();
    form.append('file', toUpload);
    try {
      // 진행률 추적을 위해 XMLHttpRequest 사용
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/upload');
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
          }
        };
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            try {
              const json = JSON.parse(xhr.responseText || '{}');
              if (xhr.status >= 200 && xhr.status < 300 && json.publicUrl) {
                setProgress(100);
                onChange(json.publicUrl);
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
      setError(err.message || '업로드 실패');
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input ref={inputRef} type="file" accept="image/*" onChange={onSelect} className="hidden" />
        <button
          type="button"
          className={outlineButtonSmall}
          onClick={() => inputRef.current?.click()}
          aria-label="커버 이미지 선택"
        >
          이미지 선택
        </button>
        {value && (
          <button type="button" className={outlineButtonSmall} onClick={() => onChange(null)}>
            제거
          </button>
        )}
      </div>
      {loading && (
        <div className="space-y-1">
          <p className="text-sm text-gray-600">업로드 중... {progress}%</p>
          <div className="h-2 w-full bg-gray-200 rounded">
            <div className="h-2 bg-primary rounded" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {value && (
        (() => {
          let preview = value;
          try {
            // Supabase 공개 URL이면 작은 사이즈로 변환해 트래픽을 줄입니다.
            preview = getOptimizedImageUrl(value, { width: 1024, quality: 80, format: 'webp' });
          } catch {}
          return <img src={preview} alt="cover" className="w-full rounded" loading="lazy" decoding="async" />;
        })()
      )}
    </div>
  );
}
