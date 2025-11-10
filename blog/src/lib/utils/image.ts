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
    const u = new URL(cleaned);
    const isSupabasePublic = /\/storage\/v1\/object\/public\//.test(u.pathname);
    if (!isSupabasePublic) return url;

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
  list: '(max-width: 768px) 100vw, 768px',
  detail: '(max-width: 768px) 100vw, 1024px',
};
