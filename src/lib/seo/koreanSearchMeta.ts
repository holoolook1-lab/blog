import { getPublicSiteMeta } from '@/lib/site';

interface KoreanSearchMetaProps {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tag?: string[];
  image?: string;
  url: string;
  type?: 'article' | 'website' | 'blog';
}

export function KoreanSearchMeta({
  title,
  description,
  keywords = [],
  author = '락이락이',
  publishedTime,
  modifiedTime,
  section,
  tag = [],
  image,
  url,
  type = 'article',
}: KoreanSearchMetaProps) {
  const { url: siteUrl, name: siteName } = getPublicSiteMeta();
  
  // 한국어 특화 키워드 생성
  const koreanKeywords = [
    ...keywords,
    '블로그', '게임', 'IT', '기술', '개발', '리뷰',
    '한국블로그', '한국게임', '게임리뷰', 'IT블로그',
    '락이락이', '라키라키', '게임블로그', '기술블로그'
  ];

  const metaTags = {
    // 네이버 검색엔진 최적화
    'naver:title': title,
    'naver:description': description,
    'naver:keywords': koreanKeywords.join(', '),
    'naver:author': author,
    'naver:section': section || '블로그',
    'naver:tag': tag.join(', '),
    'naver:url': url,
    'naver:site': siteName,
    'naver:image': image ? `${siteUrl}${image}` : `${siteUrl}/og-image.png`,
    
    // 다음(카카오) 검색엔진 최적화
    'daum:title': title,
    'daum:description': description,
    'daum:keywords': koreanKeywords.join(', '),
    'daum:author': author,
    'daum:section': section || '블로그',
    'daum:tag': tag.join(', '),
    'daum:url': url,
    'daum:site': siteName,
    'daum:image': image ? `${siteUrl}${image}` : `${siteUrl}/og-image.png`,
    
    // 카카오 검색엔진 최적화
    'kakao:title': title,
    'kakao:description': description,
    'kakao:keywords': koreanKeywords.join(', '),
    'kakao:author': author,
    'kakao:section': section || '블로그',
    'kakao:tag': tag.join(', '),
    'kakao:url': url,
    'kakao:site': siteName,
    'kakao:image': image ? `${siteUrl}${image}` : `${siteUrl}/og-image.png`,
    
    // 한국어 콘텐츠 특화
    'content-language': 'ko',
    'language': 'korean',
    'geo.region': 'KR',
    'geo.placename': 'South Korea',
    'korean-content': 'true',
    'hangul-content': 'enabled',
    
    // 게임/IT 콘텐츠 특화
    'content-type': 'blog',
    'content-category': 'games,it,technology',
    'content-tag': '게임,IT,기술,블로그,리뷰',
    
    // 시간 관련 메타데이터
    ...(publishedTime && { 'article:published_time': publishedTime }),
    ...(modifiedTime && { 'article:modified_time': modifiedTime }),
    'article:author': author,
    'article:section': section || '블로그',
    'article:tag': tag.join(', '),
    
    // 한국어 블로그 플랫폼 특화
    'blog-platform': 'rakiraki',
    'blog-type': 'personal',
    'blog-language': 'korean',
    'blog-region': 'kr',
    'blog-category': 'games,it',
    
    // 검색엔진 우선순위
    'search-engine-priority': 'high',
    'korean-search-priority': 'high',
    'local-search-priority': 'high',
    
    // 모바일 최적화
    'mobile-optimized': 'true',
    'mobile-friendly': 'true',
    'responsive-design': 'enabled',
    
    // 접근성
    'accessibility': 'enabled',
    'screen-reader-friendly': 'true',
    'korean-accessibility': 'enabled',
  };

  return metaTags;
}

// 한국어 검색엔진용 사이트맵 생성 헬퍼
export function generateKoreanSitemapEntry({
  url,
  lastModified,
  changeFrequency = 'daily',
  priority = '0.8',
  section = 'blog',
}: {
  url: string;
  lastModified: string;
  changeFrequency?: string;
  priority?: string;
  section?: string;
}) {
  return {
    url,
    lastModified,
    changeFrequency,
    priority,
    // 한국어 검색엔진용 추가 데이터
    'korean-section': section,
    'korean-priority': priority,
    'local-priority': 'high',
    'korean-change-frequency': changeFrequency,
  };
}

// 한국어 검색엔진용 breadcrumb 생성
export function generateKoreanBreadcrumb(items: Array<{
  name: string;
  url: string;
  position: number;
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: item.url,
      // 한국어 특화
      'korean-name': item.name,
      'korean-position': item.position,
      'local-section': 'blog',
    })),
    // 한국어 검색엔진용 추가 속성
    'korean-breadcrumb': 'enabled',
    'local-breadcrumb': 'enabled',
    'korean-section': 'blog',
  };
}