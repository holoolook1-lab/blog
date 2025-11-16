import { getPublicSiteMeta } from '@/lib/site';
import { KoreanSearchMeta } from '@/lib/seo/koreanSearchMeta';
import { generatePerformanceMeta, generatePreloadResources, generateDNSPrefetch } from '@/lib/seo/performanceOptimization';

interface EnhancedPostSEOProps {
  title: string;
  description: string;
  content: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  image?: string;
  url: string;
  keywords?: string[];
  section?: string;
  tag?: string[];
  readingTime?: number;
  wordCount?: number;
}

export function EnhancedPostSEO({
  title,
  description,
  content,
  author,
  publishedTime,
  modifiedTime,
  image,
  url,
  keywords = [],
  section = '블로그',
  tag = [],
  readingTime,
  wordCount,
}: EnhancedPostSEOProps) {
  const { url: siteUrl, name: siteName } = getPublicSiteMeta();
  
  // 읽기 시간 계산 (대략 200단어/분)
  const calculatedWordCount = wordCount || content.split(/\s+/).length;
  const calculatedReadingTime = readingTime || Math.ceil(calculatedWordCount / 200);
  
  // 날짜 포맷팅
  const publishedDate = new Date(publishedTime).toISOString();
  const modifiedDate = modifiedTime ? new Date(modifiedTime).toISOString() : publishedDate;
  
  // 한국어 검색엔진용 메타데이터
  const koreanMeta = KoreanSearchMeta({
    title,
    description,
    keywords: [...keywords, ...tag],
    author,
    publishedTime: publishedDate,
    modifiedTime: modifiedDate,
    section,
    tag,
    image,
    url,
    type: 'article',
  });
  
  // 성능 최적화 메타데이터
  const performanceMeta = generatePerformanceMeta({
    title,
    description,
    image,
    url,
    type: 'article',
    publishedTime: publishedDate,
    modifiedTime: modifiedDate,
    author,
    keywords: [...keywords, ...tag],
  });
  
  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    headline: title,
    description: description,
    image: image || `${siteUrl}/og-image.jpg`,
    author: {
      '@type': 'Person',
      name: author,
      url: siteUrl
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`
      }
    },
    datePublished: publishedDate,
    dateModified: modifiedDate,
    wordCount: calculatedWordCount,
    timeRequired: `PT${calculatedReadingTime}M`,
    articleBody: content.substring(0, 500), // 처음 500자만 포함
    url: url,
    inLanguage: 'ko-KR',
    // 한국어 검색엔진용 추가 데이터
    keywords: [...keywords, ...tag].join(', '),
    articleSection: section,
    // 게임/IT 콘텐츠 특화
    about: {
      '@type': 'Thing',
      name: '게임과 IT',
      description: '게임 리뷰와 IT 기술 정보'
    },
    // 읽기 난이도
    accessibility: {
      '@type': 'Accessibility',
      accessibilitySummary: '한국어 콘텐츠, 게임 및 IT 주제'
    },
  };

  return (
    <>
      {/* 기본 메타태그 */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={[...keywords, ...tag].join(', ')} />
      <meta name="author" content={author} />
      <meta name="language" content="ko" />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      
      {/* 한국어 검색엔진용 메타태그 */}
      {Object.entries(koreanMeta).map(([name, content]) => (
        <meta key={name} name={name} content={String(content)} />
      ))}
      
      {/* 성능 최적화 메타태그 */}
      {Object.entries(performanceMeta).map(([name, content]) => (
        <meta key={name} name={name} content={String(content)} />
      ))}
      
      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || `${siteUrl}/og-image.jpg`} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:article:author" content={author} />
      <meta property="og:article:published_time" content={publishedDate} />
      <meta property="og:article:modified_time" content={modifiedDate} />
      <meta property="og:article:section" content={section} />
      {tag.map((t) => (
        <meta key={t} property="og:article:tag" content={t} />
      ))}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || `${siteUrl}/og-image.jpg`} />
      <meta name="twitter:creator" content="@rakiraki_blog" />
      <meta name="twitter:site" content="@rakiraki_blog" />
      
      {/* 기사 메타데이터 */}
      <meta property="article:published_time" content={publishedDate} />
      <meta property="article:modified_time" content={modifiedDate} />
      <meta property="article:author" content={author} />
      <meta property="article:section" content={section} />
      {tag.map((t) => (
        <meta key={t} property="article:tag" content={t} />
      ))}
      
      {/* 읽기 시간 */}
      <meta name="reading-time" content={`${calculatedReadingTime}분`} />
      <meta name="word-count" content={String(calculatedWordCount)} />
      
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd, null, 2)
        }}
      />
    </>
  );
}

// 블로그 메인 페이지용 SEO
export function EnhancedBlogSEO() {
  const { url: siteUrl, name: siteName, description } = getPublicSiteMeta();
  
  // 한국어 검색엔진용 메타데이터
  const koreanMeta = KoreanSearchMeta({
    title: siteName,
    description,
    url: siteUrl,
    type: 'website',
  });
  
  // 성능 최적화 메타데이터
  const performanceMeta = generatePerformanceMeta({
    title: siteName,
    description,
    url: siteUrl,
    type: 'website',
  });
  
  // JSON-LD 구조화 데이터
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: siteName,
    description: description,
    url: siteUrl,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`
      }
    },
    inLanguage: 'ko-KR',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    // 한국어 블로그 특화
    about: {
      '@type': 'Thing',
      name: '게임과 IT 블로그',
      description: '게임 리뷰, IT 기술 정보, 개발 팁 등을 공유하는 한국어 블로그'
    },
    // 게임/IT 카테고리
    genre: ['게임', 'IT', '기술', '리뷰', '개발'],
    // 한국어 콘텐츠 - 이미 상단에 정의됨
    accessibility: {
      '@type': 'Accessibility',
      accessibilitySummary: '한국어 게임 및 IT 블로그'
    },
  };

  return (
    <>
      {/* 기본 메타태그 */}
      <title>{siteName}</title>
      <meta name="description" content={description} />
      <meta name="language" content="ko" />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      
      {/* 한국어 검색엔진용 메타태그 */}
      {Object.entries(koreanMeta).map(([name, content]) => (
        <meta key={name} name={name} content={String(content)} />
      ))}
      
      {/* 성능 최적화 메타태그 */}
      {Object.entries(performanceMeta).map(([name, content]) => (
        <meta key={name} name={name} content={String(content)} />
      ))}
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={siteName} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}/og-image.jpg`} />
      <meta property="og:url" content={siteUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="ko_KR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteName} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}/og-image.jpg`} />
      <meta name="twitter:creator" content="@rakiraki_blog" />
      <meta name="twitter:site" content="@rakiraki_blog" />
      
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd, null, 2)
        }}
      />
    </>
  );
}