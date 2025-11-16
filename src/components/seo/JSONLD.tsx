import { getPublicSiteMeta } from '@/lib/site';

interface PostJSONLDProps {
  title: string;
  description: string;
  content: string;
  author: string;
  publishedTime: string;
  modifiedTime?: string;
  image?: string;
  url: string;
}

export function PostJSONLD({ 
  title, 
  description, 
  content, 
  author, 
  publishedTime, 
  modifiedTime, 
  image, 
  url 
}: PostJSONLDProps) {
  const { url: siteUrl, name: siteName } = getPublicSiteMeta();
  
  // 읽기 시간 계산 (대략 200단어/분)
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  
  // 날짜 포맷팅
  const publishedDate = new Date(publishedTime).toISOString();
  const modifiedDate = modifiedTime ? new Date(modifiedTime).toISOString() : publishedDate;
  
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
    wordCount: wordCount,
    timeRequired: `PT${readingTime}M`,
    articleBody: content.substring(0, 500), // 처음 500자만 포함
    url: url,
    inLanguage: 'ko-KR'
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd, null, 2)
      }}
    />
  );
}

// 블로그 메인 페이지용 JSON-LD
export function BlogJSONLD() {
  const { url: siteUrl, name: siteName, description } = getPublicSiteMeta();
  
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
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd, null, 2)
      }}
    />
  );
}

// 브레드크럼 JSON-LD
export function BreadcrumbJSONLD({ items }: { items: Array<{ name: string; url: string }> }) {
  const breadcrumbItems = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd, null, 2)
      }}
    />
  );
}