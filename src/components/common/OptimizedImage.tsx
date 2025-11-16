'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  quality?: number;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  loading = 'lazy',
  sizes = '100vw',
  quality = 75,
  fill = false,
  style,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    setIsLoading(false);
    onError?.();
    // 대체 이미지로 설정
    setImageSrc('/images/placeholder.png');
  };

  // 로딩 중 표시할 스켈레톤
  if (isLoading && !priority) {
    return (
      <div className={cn('relative overflow-hidden bg-gray-100', className)}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
        <Image
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          sizes={sizes}
          quality={quality}
          loading={loading}
          priority={priority}
          className={cn('opacity-0 transition-opacity duration-300', className)}
          style={style}
          onLoad={handleLoad}
          onError={handleError}
        />
      </div>
    );
  }

  // 에러 발생 시
  if (error) {
    return (
      <div className={cn('relative bg-gray-100 flex items-center justify-center', className)}>
        <div className="text-center p-4">
          <div className="text-gray-400 mb-2">🖼️</div>
          <p className="text-sm text-gray-500">이미지를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      fill={fill}
      sizes={sizes}
      quality={quality}
      loading={loading}
      priority={priority}
      className={cn('transition-opacity duration-300', className)}
      style={style}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

// 블로그 포스트용 최적화 이미지 컴포넌트
export function BlogPostImage({
  src,
  alt,
  width = 800,
  height = 400,
  className,
  priority = false,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={85}
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px"
        className="w-full h-auto"
      />
    </div>
  );
}

// 아바타 이미지용 컴포넌트
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-full', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        width={size}
        height={size}
        quality={90}
        loading="lazy"
        sizes={`${size}px`}
        className="w-full h-full object-cover"
      />
    </div>
  );
}