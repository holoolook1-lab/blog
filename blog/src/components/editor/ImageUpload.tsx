import { useState } from 'react';
import { getOptimizedImageUrl } from '@/lib/utils/image';

export default function ImageUpload() {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const form = new FormData();
    form.append('file', file);
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
          return <img src={preview} alt="uploaded" className="max-w-full" loading="lazy" decoding="async" />;
        })()
      )}
    </div>
  );
}
