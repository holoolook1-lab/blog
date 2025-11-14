/**
 * 단축 URL 확장 서비스
 * bit.ly, tinyurl.com, goo.gl 등의 단축 URL을 실제 URL로 확장
 */

import { SHORT_URL_PATTERNS } from './platforms';

export interface ExpandedUrl {
  original: string;
  expanded: string;
  status: 'success' | 'failed' | 'timeout';
  responseTime: number;
  error?: string;
}

/**
 * 단축 URL 캐시
 */
class ShortUrlCache {
  private cache = new Map<string, { expanded: string; timestamp: number }>();
  private readonly TTL = 1000 * 60 * 30; // 30분

  get(shortUrl: string): string | null {
    const cached = this.cache.get(shortUrl);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(shortUrl);
      return null;
    }
    
    return cached.expanded;
  }

  set(shortUrl: string, expanded: string): void {
    this.cache.set(shortUrl, { expanded, timestamp: Date.now() });
  }
}

export const shortUrlCache = new ShortUrlCache();

/**
 * 단축 URL 감지
 */
export function isShortUrl(url: string): boolean {
  return SHORT_URL_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * 단축 URL 확장
 */
export async function expandShortUrl(shortUrl: string): Promise<ExpandedUrl> {
  const startTime = Date.now();
  
  // 캐시 확인
  const cached = shortUrlCache.get(shortUrl);
  if (cached) {
    return {
      original: shortUrl,
      expanded: cached,
      status: 'success',
      responseTime: Date.now() - startTime
    };
  }

  try {
    // HEAD 요청으로 리다이렉트 추적
    const response = await fetch(shortUrl, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000), // 10초 타임아웃
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SocialEmbedBot/1.0)'
      }
    });

    const expanded = response.url || shortUrl;
    
    // 캐시 저장
    shortUrlCache.set(shortUrl, expanded);
    
    return {
      original: shortUrl,
      expanded,
      status: 'success',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    // 실패 시 원본 URL 반환
    return {
      original: shortUrl,
      expanded: shortUrl,
      status: 'failed',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 여러 단축 URL 일괄 확장
 */
export async function expandMultipleShortUrls(urls: string[]): Promise<ExpandedUrl[]> {
  const results = await Promise.allSettled(
    urls.map(url => expandShortUrl(url))
  );
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        original: urls[index],
        expanded: urls[index],
        status: 'failed',
        responseTime: 0,
        error: result.reason
      };
    }
  });
}

/**
 * 단축 URL 제공자 정보
 */
export function getShortUrlProvider(url: string): string | null {
  if (/bit\.ly/i.test(url)) return 'Bitly';
  if (/tinyurl\.com/i.test(url)) return 'TinyURL';
  if (/goo\.gl/i.test(url)) return 'Google URL Shortener';
  if (/t\.co/i.test(url)) return 'Twitter';
  if (/buff\.ly/i.test(url)) return 'Buffer';
  if (/ow\.ly/i.test(url)) return 'Hootsuite';
  if (/short\.link/i.test(url)) return 'Short.link';
  return null;
}

/**
 * 단축 URL 통계
 */
export function getShortUrlStats() {
  return {
    cacheSize: shortUrlCache['cache']?.size || 0,
    ttl: 30 * 60 * 1000 // 30분 (밀리초)
  };
}