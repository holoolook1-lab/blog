interface DaumSEOMeta {
  title: string;
  description: string;
  content?: string;
  author?: string;
  publishDate?: string;
  modifyDate?: string;
  tags?: string[];
  category?: string;
  readingTime?: number;
  wordCount?: number;
  image?: string;
  url?: string;
}

/**
 * 다음(카카오) 검색엔진용 메타데이터 생성
 * 다음 검색엔진은 한국어 콘텐츠에 최적화되어 있으며,
 * 특히 블로그 형태의 콘텐츠를 중요시합니다.
 */
export function generateDaumBlogPostMeta({
  title,
  description,
  content = '',
  author = '락이락이 블로그',
  publishDate,
  modifyDate,
  tags = [],
  category = '블로그 포스트',
  readingTime,
  wordCount,
  image,
  url
}: DaumSEOMeta): {
  title: string;
  description: string;
  keywords: string;
  author: string;
  other: Record<string, string | number | (string | number)[]>;
} {
  // 콘텐츠에서 주요 키워드 추출 (간단한 버전)
  const keywords = extractKeywords(content, title);
  const allTags = [...new Set([...tags, ...keywords])].slice(0, 10); // 중복 제거 후 최대 10개

  // 다음 검색엔진용 메타데이터
  const daumMeta = {
    // 기본 메타데이터
    title: `${title} | ${author}`,
    description: description || content.substring(0, 200),
    keywords: allTags.join(', '),
    author,
    
    // 다음 검색엔진 전용 메타태그
    other: Object.fromEntries(
      Object.entries({
        // 다음 블로그 형식 메타태그
        'daum:blog.title': title,
        'daum:blog.description': description,
        'daum:blog.author': author,
        'daum:blog.category': category,
        'daum:blog.tags': allTags.join(', '),
        
        // 게시물 정보
        'article:published_time': publishDate,
        'article:modified_time': modifyDate,
        'article:author': author,
        'article:section': category,
        'article:tag': allTags.join(', '),
        
        // 읽기 시간 및 분량 정보
        'article:reading_time': readingTime ? `${readingTime}분` : undefined,
        'article:word_count': wordCount?.toString(),
        
        // 한국어 콘텐츠 특화
        'lang': 'ko',
        'country': 'KR',
        'locale': 'ko_KR',
      }).filter(([, value]) => value !== undefined) as [string, string | number | (string | number)[]][]
    )
  };

  return daumMeta;
}

/**
 * 콘텐츠와 제목에서 키워드 추출
 */
function extractKeywords(content: string, title: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  
  // 한국어 자주 사용되는 단어 제거 (불용어)
  const stopWords = ['은', '는', '이', '가', '을', '를', '의', '에', '도', '와', '과', '으로', '로', '에서', '부터', '까지', '까지', '한', '하다', '있다', '되다', '없다', '아니다', '그', '저', '것', '수', '등', '들', '및', '예', '것으로', '하는', '하고', '있다', '하는', '받다', '없다'];
  
  // 단어 추출 (한글, 영문, 숫자)
  const words = text.match(/[가-힣]{2,}|[a-zA-Z]{2,}|[0-9]{2,}/g) || [];
  
  // 불용어 제거 및 빈도수 계산
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    if (!stopWords.includes(word) && word.length >= 2) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // 빈도수로 정렬하여 상위 키워드 추출
  const sortedWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 15)
    .map(([word]) => word);
  
  return sortedWords;
}