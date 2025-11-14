import { useState } from 'react';
import { getOptimizedImageUrl } from '@/lib/utils/image';
import { compressToWebp } from '@/lib/utils/imageClient';

export default function ImageUpload() {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    let toUpload: File = file;
    try {
      if (file.type !== 'image/webp') {
        toUpload = await compressToWebp(file, { maxWidth: 1920, quality: 0.82 });
      }
    } catch {
      // 변환 실패 시 원본 업로드로 폴백
    }
    const form = new FormData();
    form.append('file', toUpload);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const json = await res.json();
    setLoading(false);
    if (json.publicUrl) setUrl(json.publicUrl);
  };

  return (
    <div className="space-y-2">
      <input type="file" accept="image/*" onChange={onChange} />
      {loading && <p className="text-sm text-gray-600">업로드 중...</p>}
      {url && (
        (() => {
          let preview = url;
          try {
            // Supabase 공개 URL이면 작은 사이즈로 변환해 트래픽을 줄입니다.
            preview = getOptimizedImageUrl(url, { width: 768, quality: 80, format: 'webp' });
          } catch {}
          return <img src={preview} alt="업로드된 이미지" className="max-w-full" loading="lazy" decoding="async" />;
        })()
      )}
    </div>
  );
}
