import Image from 'next/image';

// 최적화된 이미지 컴포넌트
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  className?: string;
  sizes?: string;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg' | 'png';
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  loading = 'lazy',
  className = '',
  sizes = '100vw',
  quality = 85,
  format = 'webp'
}: OptimizedImageProps) {
  // 이미지 URL 최적화
  const optimizedSrc = getOptimizedImageUrl(src, { width, quality, format });
  
  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      loading={loading}
      className={className}
      sizes={sizes}
      quality={quality}
    />
  );
}

// 이미지 URL 최적화 함수
export function getOptimizedImageUrl(
  url: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg' | 'png';
  } = {}
): string {
  // 이미 최적화된 URL인 경우
  if (url.includes('w=') || url.includes('q=')) {
    return url;
  }

  // Supabase Storage URL인 경우
  if (url.includes('supabase.co') || url.includes('supabase.in')) {
    const urlObj = new URL(url);
    
    if (options.width) {
      urlObj.searchParams.set('width', options.width.toString());
    }
    if (options.height) {
      urlObj.searchParams.set('height', options.height.toString());
    }
    if (options.quality) {
      urlObj.searchParams.set('quality', options.quality.toString());
    }
    if (options.format) {
      urlObj.searchParams.set('format', options.format);
    }
    
    return urlObj.toString();
  }

  // 일반 URL인 경우 (CDN 최적화)
  if (options.width || options.quality) {
    const params = new URLSearchParams();
    if (options.width) params.set('w', options.width.toString());
    if (options.quality) params.set('q', options.quality.toString());
    if (options.format) params.set('f', options.format);
    
    return `${url}?${params.toString()}`;
  }

  return url;
}

// 이미지 프리로드 함수
export function preloadImage(url: string): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
}

// 이미지 프리페치 함수
export function prefetchImage(url: string): void {
  if (typeof window === 'undefined') return;
  
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
}

// 블러 플레이스홀더 생성
export function generateBlurDataURL(width: number, height: number): string {
  const w = Math.min(width, 64); // 최대 64px
  const h = Math.min(height, 64);
  
  // SVG 기반 블러 플레이스홀더
  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="blur">
          <feGaussianBlur stdDeviation="8"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="#f3f4f6" filter="url(#blur)"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}