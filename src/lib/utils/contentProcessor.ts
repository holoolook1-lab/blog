/**
 * 콘텐츠 내의 URL들을 적절한 형식으로 변환
 * YouTube URL을 iframe으로 변환하는 등의 기능 포함
 */

export interface ProcessedContent {
  html: string;
  hasMedia: boolean;
}

/**
 * YouTube URL에서 비디오 ID 추출
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/i,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/i,
    /youtube\.com\/v\/([A-Za-z0-9_-]{11})/i
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * YouTube URL을 iframe으로 변환
 */
export function convertYouTubeUrlToEmbed(url: string): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * YouTube URL을 iframe HTML로 변환
 */
export function createYouTubeIframe(url: string): string | null {
  const embedUrl = convertYouTubeUrlToEmbed(url);
  if (!embedUrl) return null;
  
  return `<iframe 
    width="560" 
    height="315" 
    src="${embedUrl}" 
    title="YouTube video player" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
    allowfullscreen>
  </iframe>`;
}

/**
 * 텍스트 콘텐츠에서 URL을 찾아 적절한 형식으로 변환
 */
export function processContentUrls(content: string): ProcessedContent {
  let processedHtml = content;
  let hasMedia = false;

  // YouTube URL 변환
  const youtubePattern = /(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_-]{11}(?:[&\w;=\-]*)?)/gi;
  
  processedHtml = processedHtml.replace(youtubePattern, (match) => {
    const iframeHtml = createYouTubeIframe(match);
    if (iframeHtml) {
      hasMedia = true;
      return `<div class="youtube-container my-4">${iframeHtml}</div>`;
    }
    return match;
  });

  // 일반 URL을 링크로 변환 (YouTube URL은 제외)
  const urlPattern = /(https?:\/\/[^\s]+)/gi;
  processedHtml = processedHtml.replace(urlPattern, (match) => {
    // 이미 변환된 YouTube iframe은 건너뛰기
    if (match.includes('youtube.com/embed')) {
      return match;
    }
    
    // YouTube URL은 이미 처리되었으므로 건너뛰기
    if (match.includes('youtube.com') || match.includes('youtu.be')) {
      return match;
    }
    
    return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${match}</a>`;
  });

  return {
    html: processedHtml,
    hasMedia
  };
}

/**
 * 소셜 미디어 URL 처리 (향후 확장을 위해)
 */
export function processSocialMediaUrls(content: string): ProcessedContent {
  // 현재는 YouTube만 처리하지만, 향후 Instagram, Twitter 등 확장 가능
  return processContentUrls(content);
}