export type TransformOptions = {
  width?: number;
  quality?: number; // 1-100
  format?: 'webp' | 'jpeg' | 'png';
};

// Supabase Storage 공개 URL에 변환 파라미터를 붙여 최적화된 이미지 URL을 반환합니다.
export function getOptimizedImageUrl(url: string, opts: TransformOptions = {}): string {
  try {
    // 일부 입력에서 마크다운/복사 붙여넣기로 인해 끝에 괄호나 공백이 붙는 문제를 정규화합니다.
    const cleaned = url.trim().replace(/[)\]]+$/, '');
    
    // YouTube 이미지 URL은 최적화하지 않고 그대로 반환
    if (cleaned.includes('youtube.com') || cleaned.includes('ytimg.com')) {
      return cleaned;
    }
    
    const u = new URL(cleaned);
    const isSupabasePublic = /\/storage\/v1\/object\/public\//.test(u.pathname);
    if (!isSupabasePublic) return cleaned;

    const { width, quality = 80, format = 'webp' } = opts;
    if (width) u.searchParams.set('width', String(width));
    if (quality) u.searchParams.set('quality', String(quality));
    if (format) u.searchParams.set('format', format);
    return u.toString();
  } catch {
    return url;
  }
}

// 리스트/디테일에서 사용할 기본 sizes 값
export const defaultSizes = {
  // 카드 그리드가 md부터 2열이므로 50vw로 요청, 모바일은 100vw
  list: '(max-width: 768px) 100vw, 50vw',
  detail: '(max-width: 768px) 100vw, 1024px',
};
