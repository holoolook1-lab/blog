import { Metadata } from 'next';

interface NaverSEOProps {
  title: string;
  description: string;
  keywords?: string[];
  author?: string;
  section?: string;
  category?: string;
  publishDate?: string;
  modifyDate?: string;
  image?: string;
  url?: string;
}

export function generateNaverSEOMeta({
  title,
  description,
  keywords = [],
  author = '락이락이 블로그',
  section = '블로그',
  category = '커뮤니티',
  publishDate,
  modifyDate,
  image,
  url
}: NaverSEOProps): Metadata {
  const naverKeywords = [
    '블로그', '한국블로그', '글쓰기', '커뮤니티',
    '게임화시스템', '출석체크', '업적시스템',
    ...keywords
  ];

  return {
    title,
    description,
    keywords: naverKeywords.join(', '),
    authors: [{ name: author }],
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: '락이락이 블로그',
      locale: 'ko_KR',
      ...(image && { images: [{ url: image }] }),
      ...(url && { url }),
      ...(publishDate && { publishedTime: publishDate }),
      ...(modifyDate && { modifiedTime: modifyDate }),
      section,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@rakiraki_blog',
      ...(image && { images: [image] }),
    },
    other: {
      // 네이버 특화 메타 태그
      'naver-site-verification': 'c4a4c8c9c1c2c3c4c5c6c7c8c9c0c1c2c3', // 실제 검증 코드로 교체 필요
      'naver-title': title,
      'naver-description': description,
      'naver-author': author,
      'naver-section': section,
      'naver-category': category,
      'naver-keywords': naverKeywords.join(', '),
      
      // 한국어 특화 메타 태그
      'language': 'korean',
      'geo.region': 'KR',
      'geo.placename': 'South Korea',
      'korean-blog': 'true',
      'blog-platform': 'rakiraki',
      
      // 추가 SEO 메타 태그
      'article:author': author,
      'article:section': section,
      'article:tag': naverKeywords.join(', '),
      ...(publishDate && { 'article:published_time': publishDate }),
      ...(modifyDate && { 'article:modified_time': modifyDate }),
      
      // 네이버 웹마스터 도구용
      'naver-search-advisor': 'enable',
      'naver-search-title': title,
      'naver-search-description': description,
    },
  };
}

// 네이버 검색엔진을 위한 특수 메타 태그 생성
export function generateNaverSearchMeta({
  title,
  description,
  url,
  image,
  section = 'blog',
  priority = 'high'
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  section?: string;
  priority?: 'high' | 'medium' | 'low';
}) {
  return {
    title,
    description,
    canonical: url,
    other: {
      // 네이버 검색 최적화
      'naver-search-priority': priority,
      'naver-search-section': section,
      'naver-search-url': url,
      'naver-search-image': image || '',
      'naver-search-type': 'website',
      'naver-search-language': 'ko',
      'naver-search-country': 'KR',
      
      // 네이버 사이트 검색 최적화
      'naver:site': 'rakiraki-blog',
      'naver:section': section,
      'naver:priority': priority,
      'naver:language': 'korean',
      
      // 한국어 콘텐츠 마킹
      'content-language': 'ko',
      'content-type': 'blog',
      'korean-content': 'true',
      'hangul-content': 'enabled',
    },
  };
}

// 블로그 포스트용 네이버 SEO 메타
export function generateNaverBlogPostMeta({
  title,
  description,
  content,
  author,
  publishDate,
  modifyDate,
  tags = [],
  category = '일반',
  readingTime,
  wordCount
}: {
  title: string;
  description: string;
  content: string;
  author: string;
  publishDate: string;
  modifyDate?: string;
  tags?: string[];
  category?: string;
  readingTime?: number;
  wordCount?: number;
}) {
  // 콘텐츠에서 키워드 추출
  const contentKeywords = extractKoreanKeywords(content);
  const allKeywords = [...new Set([...tags, ...contentKeywords])];
  
  return generateNaverSEOMeta({
    title,
    description,
    keywords: allKeywords,
    author,
    section: '블로그 포스트',
    category,
    publishDate,
    modifyDate,
  });
}

// 한국어 키워드 추출 함수
function extractKoreanKeywords(content: string): string[] {
  // 한글 단어 추출
  const koreanWords = content.match(/[가-힣]{2,}/g) || [];
  
  // 자주 등장하는 단어 필터링
  const wordFrequency: Record<string, number> = {};
  koreanWords.forEach(word => {
    if (word.length >= 2 && word.length <= 10) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
  });
  
  // 빈도수가 높은 상위 10개 단어 선택
  return Object.entries(wordFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

// 네이버 웹마스터 도구 검증 파일 생성
export function generateNaverVerificationMeta() {
  return {
    other: {
      'naver-site-verification': 'c4a4c8c9c1c2c3c4c5c6c7c8c9c0c1c2c3',
      'naver-search-advisor-site-verification': 'c4a4c8c9c1c2c3c4c5c6c7c8c9c0c1c2c3',
      'naver-webmaster-tool': 'enabled',
      'naver-analytics': 'true',
      'naver-search-console': 'verified',
    },
  };
}