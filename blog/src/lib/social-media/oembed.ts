/**
 * OEmbed API 통합 모듈
 * SNS 플랫폼의 OEmbed API를 통한 미디어 정보 추출
 */

import { SOCIAL_PLATFORMS, type SocialPlatform } from './platforms';

export interface OEmbedResponse {
  type: 'video' | 'photo' | 'rich' | 'link';
  title?: string;
  author_name?: string;
  author_url?: string;
  provider_name?: string;
  provider_url?: string;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
  html?: string;
  width?: number;
  height?: number;
  version?: string;
}

export interface MediaInfo {
  platform: string;
  type: 'video' | 'image' | 'post' | 'profile';
  id: string;
  url: string;
  title?: string;
  author?: string;
  thumbnail?: string;
  embedHtml?: string;
  width?: number;
  height?: number;
  duration?: number;
  viewCount?: number;
  likeCount?: number;
  error?: string;
}

/**
 * OEmbed API 요청 캐시
 */
class OEmbedCache {
  private cache = new Map<string, { data: MediaInfo; timestamp: number }>();
  private readonly TTL = 1000 * 60 * 60; // 1시간

  get(key: string): MediaInfo | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  set(key: string, data: MediaInfo): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const oembedCache = new OEmbedCache();

/**
 * OEmbed API 호출
 */
async function fetchOEmbed(url: string, platform: SocialPlatform): Promise<OEmbedResponse | null> {
  if (!platform.oembedEndpoint) return null;

  try {
    const params = new URLSearchParams({
      url: url,
      format: 'json',
      maxwidth: '800',
      maxheight: '600'
    });

    // 특정 플랫폼별 파라미터 추가
    if (platform.name === 'Instagram') {
      // Instagram은 Facebook Graph API 필요
      const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
      if (accessToken) {
        params.set('access_token', accessToken);
      }
    }

    const response = await fetch(`${platform.oembedEndpoint}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SocialEmbedBot/1.0)',
        'Accept': 'application/json'
      },
      // 타임아웃 설정
      signal: AbortSignal.timeout(5000) // 5초 타임아웃
    });

    if (!response.ok) {
      console.warn(`OEmbed API 실패 (${platform.name}): ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data as OEmbedResponse;
  } catch (error) {
    console.error(`OEmbed API 오류 (${platform.name}):`, error);
    return null;
  }
}

/**
 * 소셜 미디어 정보 추출
 */
export async function extractSocialMediaInfo(url: string): Promise<MediaInfo | null> {
  if (!url || typeof url !== 'string') return null;

  // 캐시 확인
  const cacheKey = `social:${url}`;
  const cached = oembedCache.get(cacheKey);
  if (cached) return cached;

  try {
    const platform = SOCIAL_PLATFORMS[detectPlatformKey(url)];
    if (!platform) return null;

    const id = platform.extractId(url);
    if (!id) return null;

    let mediaInfo: MediaInfo = {
      platform: platform.name,
      type: detectMediaType(platform, url),
      id,
      url,
      embedHtml: platform.embedTemplate(id, url)
    };

    // OEmbed API로 추가 정보 획득 시도
    const oembedData = await fetchOEmbed(url, platform);
    if (oembedData) {
      mediaInfo = {
        ...mediaInfo,
        title: oembedData.title,
        author: oembedData.author_name,
        thumbnail: oembedData.thumbnail_url,
        width: oembedData.width,
        height: oembedData.height,
        embedHtml: oembedData.html || mediaInfo.embedHtml
      };
    }

    // 캐시 저장
    oembedCache.set(cacheKey, mediaInfo);
    return mediaInfo;
  } catch (error) {
    console.error('소셜 미디어 정보 추출 오류:', error);
    return {
      platform: 'unknown',
      type: 'post',
      id: 'unknown',
      url,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 플랫폼 키 감지
 */
function detectPlatformKey(url: string): string {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.replace(/^www\./, '');
  
  for (const [key, platform] of Object.entries(SOCIAL_PLATFORMS)) {
    if (platform.domains.includes(hostname)) {
      return key;
    }
  }
  
  return '';
}

/**
 * 미디어 타입 감지
 */
function detectMediaType(platform: SocialPlatform, url: string): 'video' | 'image' | 'post' | 'profile' {
  if (platform.name === 'YouTube') return 'video';
  if (platform.name === 'TikTok') return 'video';
  if (platform.name === 'Naver TV') return 'video';
  
  if (url.includes('/video/') || url.includes('/videos/') || url.includes('/watch?')) {
    return 'video';
  }
  
  if (url.includes('/p/') || url.includes('/photo/')) {
    return 'image';
  }
  
  if (url.includes('/status/') || url.includes('/posts/')) {
    return 'post';
  }
  
  return 'post'; // 기본값
}

/**
 * 여러 URL 일괄 처리
 */
export async function extractMultipleMediaInfo(urls: string[]): Promise<MediaInfo[]> {
  const results = await Promise.allSettled(
    urls.map(url => extractSocialMediaInfo(url))
  );
  
  return results
    .map((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      } else {
        return {
          platform: 'unknown',
          type: 'post',
          id: 'unknown',
          url: urls[index],
          error: result.status === 'rejected' ? result.reason : '처리 실패'
        };
      }
    })
    .filter(Boolean) as MediaInfo[];
}

/**
 * 성능 메트릭
 */
export function getCacheStats() {
  return {
    size: oembedCache.size(),
    ttl: 60 * 60 * 1000 // 1시간 (밀리초)
  };
}