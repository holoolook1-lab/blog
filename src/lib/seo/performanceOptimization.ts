import { getPublicSiteMeta } from '@/lib/site';

interface PerformanceOptimizationProps {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: 'article' | 'website' | 'blog';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
}

export function generatePerformanceMeta({
  title,
  description,
  image,
  url,
  type = 'article',
  publishedTime,
  modifiedTime,
  author = '락이락이',
  keywords = [],
}: PerformanceOptimizationProps) {
  const { url: siteUrl, name: siteName } = getPublicSiteMeta();
  
  return {
    // Core Web Vitals 최적화
    'performance-optimized': 'true',
    'core-web-vitals': 'enabled',
    'lcp-optimized': 'true',
    'fid-optimized': 'true',
    'cls-optimized': 'true',
    'fcp-optimized': 'true',
    'ttfb-optimized': 'true',
    'inp-optimized': 'true',
    
    // 이미지 최적화
    'image-optimization': 'enabled',
    'lazy-loading': 'enabled',
    'responsive-images': 'enabled',
    'webp-support': 'enabled',
    'avif-support': 'enabled',
    
    // 폰트 최적화
    'font-optimization': 'enabled',
    'font-display-swap': 'enabled',
    'preload-fonts': 'enabled',
    'font-subset': 'enabled',
    
    // CSS 최적화
    'css-optimization': 'enabled',
    'critical-css': 'enabled',
    'unused-css-removal': 'enabled',
    'css-minification': 'enabled',
    
    // JavaScript 최적화
    'js-optimization': 'enabled',
    'code-splitting': 'enabled',
    'tree-shaking': 'enabled',
    'js-minification': 'enabled',
    'async-loading': 'enabled',
    'defer-loading': 'enabled',
    
    // 리소스 프리로드
    'dns-prefetch': 'enabled',
    'preconnect': 'enabled',
    'preload': 'enabled',
    'prefetch': 'enabled',
    
    // 캐싱 최적화
    'caching-optimized': 'true',
    'browser-caching': 'enabled',
    'cdn-caching': 'enabled',
    'service-worker': 'enabled',
    'offline-support': 'enabled',
    
    // 압축 최적화
    'gzip-compression': 'enabled',
    'brotli-compression': 'enabled',
    'image-compression': 'enabled',
    'text-compression': 'enabled',
    
    // 네트워크 최적화
    'http2-enabled': 'true',
    'http3-enabled': 'true',
    'keep-alive': 'enabled',
    'connection-reuse': 'enabled',
    
    // 모바일 최적화
    'mobile-optimized': 'true',
    'responsive-design': 'enabled',
    'viewport-optimized': 'true',
    'touch-optimized': 'enabled',
    
    // 접근성 최적화
    'accessibility-optimized': 'true',
    'aria-labels': 'enabled',
    'alt-texts': 'enabled',
    'semantic-html': 'enabled',
    
    // SEO 성능 최적화
    'seo-performance': 'high',
    'crawlability': 'optimized',
    'indexability': 'optimized',
    'structured-data': 'enabled',
    'schema-markup': 'enabled',
    
    // 한국어 성능 최적화
    'korean-performance': 'optimized',
    'korean-fonts': 'optimized',
    'hangul-rendering': 'optimized',
    'korean-cdn': 'enabled',
    
    // 게임/IT 콘텐츠 성능 최적화
    'game-content-optimized': 'true',
    'it-content-optimized': 'true',
    'tech-content-optimized': 'true',
    'review-content-optimized': 'true',
  };
}

// 리소스 프리로드 생성기
export function generatePreloadResources() {
  const { url: siteUrl } = getPublicSiteMeta();
  
  return [
    // 핵심 폰트 프리로드
    {
      rel: 'preload',
      href: '/fonts/pretendard-subset.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preload',
      href: '/fonts/noto-sans-kr-subset.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    
    // 핵심 CSS 프리로드
    {
      rel: 'preload',
      href: '/css/critical.css',
      as: 'style',
    },
    
    // 핵심 JavaScript 프리로드
    {
      rel: 'preload',
      href: '/js/critical.js',
      as: 'script',
    },
    
    // 파비콘 프리로드
    {
      rel: 'preload',
      href: '/favicon.ico',
      as: 'image',
      type: 'image/x-icon',
    },
    
    // OG 이미지 프리로드
    {
      rel: 'preload',
      href: '/og-image.png',
      as: 'image',
      type: 'image/png',
    },
  ];
}

// DNS 프리페치 및 프리커넥트
export function generateDNSPrefetch() {
  return [
    // 한국어 CDN
    { rel: 'dns-prefetch', href: '//cdn.jsdelivr.net' },
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
    
    // Supabase
    { rel: 'dns-prefetch', href: '//supabase.co' },
    { rel: 'dns-prefetch', href: '//supabase.com' },
    
    // 한국어 검색엔진
    { rel: 'dns-prefetch', href: '//search.naver.com' },
    { rel: 'dns-prefetch', href: '//search.daum.net' },
    { rel: 'dns-prefetch', href: '//search.kakao.com' },
    
    // 소셜 미디어
    { rel: 'dns-prefetch', href: '//www.youtube.com' },
    { rel: 'dns-prefetch', href: '//www.instagram.com' },
    { rel: 'dns-prefetch', href: '//twitter.com' },
    
    // 프리커넥트 (중요한 도메인)
    { rel: 'preconnect', href: '//fonts.googleapis.com', crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: '//fonts.gstatic.com', crossOrigin: 'anonymous' },
    { rel: 'preconnect', href: '//supabase.co', crossOrigin: 'anonymous' },
  ];
}

// 코어 웹 바이탈 측정용 스크립트
export function generateCoreWebVitalsScript() {
  return `
    // Core Web Vitals 측정
    function measureCoreWebVitals() {
      // LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        window.__LCP = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // FID (First Input Delay)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          window.__FID = entry.processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });
      
      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        window.__CLS = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });
      
      // FCP (First Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          window.__FCP = fcpEntry.startTime;
        }
      }).observe({ entryTypes: ['paint'] });
      
      // TTFB (Time to First Byte)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          if (entry.responseStart) {
            window.__TTFB = entry.responseStart - entry.requestStart;
          }
        });
      }).observe({ entryTypes: ['navigation'] });
    }
    
    // 즉시 실행
    measureCoreWebVitals();
  `;
}