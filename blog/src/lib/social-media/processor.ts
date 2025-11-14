/**
 * 통합 소셜 미디어 링크 프로세서
 * SNS 링크 자동 감지, 확장, 임베드 생성
 */

import { detectSocialPlatform, SOCIAL_PLATFORMS, isShortUrl } from './platforms';
import { extractSocialMediaInfo, type MediaInfo } from './oembed';
import { expandShortUrl } from './short-url';

export interface ProcessedLink {
  original: string;
  expanded: string;
  platform: string | null;
  type: 'video' | 'image' | 'post' | 'profile' | 'unknown';
  embedHtml: string | null;
  thumbnail: string | null;
  title: string | null;
  author: string | null;
  processingTime: number;
  status: 'success' | 'partial' | 'failed';
  error?: string;
}

/**
 * 링크 처리 옵션
 */
export interface LinkProcessingOptions {
  expandShortUrls?: boolean;
  fetchOEmbed?: boolean;
  generateEmbed?: boolean;
  cacheResults?: boolean;
  timeout?: number;
}

/**
 * 단일 링크 처리
 */
export async function processSocialLink(
  url: string, 
  options: LinkProcessingOptions = {}
): Promise<ProcessedLink> {
  const startTime = Date.now();
  const {
    expandShortUrls = true,
    fetchOEmbed = true,
    generateEmbed = true,
    timeout = 10000
  } = options;

  try {
    let expandedUrl = url;
    let mediaInfo: MediaInfo | null = null;
    let platform = null;

    // 1. 단축 URL 확장
    if (expandShortUrls && isShortUrl(url)) {
      try {
        const expansionResult = await Promise.race([
          expandShortUrl(url),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('단축 URL 확장 시간 초과')), 5000)
          )
        ]);
        
        if (expansionResult.status === 'success') {
          expandedUrl = expansionResult.expanded;
        }
      } catch (error) {
        console.warn('단축 URL 확장 실패:', error);
      }
    }

    // 2. 플랫폼 감지
    platform = detectSocialPlatform(expandedUrl);
    
    // 3. 미디어 정보 추출
    if (fetchOEmbed && platform) {
      try {
        mediaInfo = await Promise.race([
          extractSocialMediaInfo(expandedUrl),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('OEmbed 정보 추출 시간 초과')), 5000)
          )
        ]);
      } catch (error) {
        console.warn('OEmbed 정보 추출 실패:', error);
      }
    }

    // 4. 결과 생성
    const processingTime = Date.now() - startTime;
    
    if (mediaInfo && mediaInfo.error) {
      return {
        original: url,
        expanded: expandedUrl,
        platform: mediaInfo.platform,
        type: mediaInfo.type,
        embedHtml: generateEmbed ? mediaInfo.embedHtml : null,
        thumbnail: mediaInfo.thumbnail,
        title: mediaInfo.title,
        author: mediaInfo.author,
        processingTime,
        status: 'partial',
        error: mediaInfo.error
      };
    }

    if (mediaInfo) {
      return {
        original: url,
        expanded: expandedUrl,
        platform: mediaInfo.platform,
        type: mediaInfo.type,
        embedHtml: generateEmbed ? mediaInfo.embedHtml : null,
        thumbnail: mediaInfo.thumbnail,
        title: mediaInfo.title,
        author: mediaInfo.author,
        processingTime,
        status: 'success'
      };
    }

    // 기본 링크 처리
    return {
      original: url,
      expanded: expandedUrl,
      platform: platform?.name || null,
      type: 'unknown',
      embedHtml: null,
      thumbnail: null,
      title: null,
      author: null,
      processingTime,
      status: 'failed',
      error: '지원하지 않는 링크 형식입니다'
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    return {
      original: url,
      expanded: url,
      platform: null,
      type: 'unknown',
      embedHtml: null,
      thumbnail: null,
      title: null,
      author: null,
      processingTime,
      status: 'failed',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

/**
 * 여러 링크 일괄 처리
 */
export async function processMultipleSocialLinks(
  urls: string[],
  options: LinkProcessingOptions = {}
): Promise<ProcessedLink[]> {
  const { timeout = 30000 } = options;
  
  // 동시 처리 제한 (동시 10개)
  const CONCURRENCY_LIMIT = 10;
  const results: ProcessedLink[] = [];
  
  for (let i = 0; i < urls.length; i += CONCURRENCY_LIMIT) {
    const batch = urls.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.allSettled(
      batch.map(url => processSocialLink(url, options))
    );
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          original: batch[index],
          expanded: batch[index],
          platform: null,
          type: 'unknown',
          embedHtml: null,
          thumbnail: null,
          title: null,
          author: null,
          processingTime: 0,
          status: 'failed',
          error: result.reason
        });
      }
    });
  }
  
  return results;
}

/**
 * 텍스트에서 링크 추출 및 처리
 */
export async function processTextWithSocialLinks(
  text: string,
  options: LinkProcessingOptions = {}
): Promise<{ text: string; links: ProcessedLink[] }> {
  // URL 패턴으로 링크 추출
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const matches = text.match(urlPattern) || [];
  
  // 중복 제거
  const uniqueUrls = [...new Set(matches)];
  
  if (uniqueUrls.length === 0) {
    return { text, links: [] };
  }
  
  // 링크 처리
  const processedLinks = await processMultipleSocialLinks(uniqueUrls, options);
  
  // 텍스트에서 링크 교체
  let processedText = text;
  processedLinks.forEach(link => {
    if (link.embedHtml && link.status === 'success') {
      processedText = processedText.replace(
        new RegExp(link.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        link.embedHtml
      );
    }
  });
  
  return { text: processedText, links: processedLinks };
}

/**
 * 링크 통계 생성
 */
export function generateLinkStatistics(links: ProcessedLink[]) {
  const stats = {
    total: links.length,
    success: links.filter(l => l.status === 'success').length,
    partial: links.filter(l => l.status === 'partial').length,
    failed: links.filter(l => l.status === 'failed').length,
    platforms: {} as Record<string, number>,
    types: {} as Record<string, number>,
    averageProcessingTime: 0
  };
  
  // 플랫폼별 통계
  links.forEach(link => {
    if (link.platform) {
      stats.platforms[link.platform] = (stats.platforms[link.platform] || 0) + 1;
    }
    stats.types[link.type] = (stats.types[link.type] || 0) + 1;
  });
  
  // 평균 처리 시간
  if (links.length > 0) {
    stats.averageProcessingTime = links.reduce((sum, link) => sum + link.processingTime, 0) / links.length;
  }
  
  return stats;
}

/**
 * 성능 메트릭
 */
export function getProcessorPerformance() {
  return {
    maxConcurrentRequests: 10,
    timeout: 10000,
    cacheEnabled: true,
    supportedPlatforms: Object.keys(SOCIAL_PLATFORMS).length
  };
}