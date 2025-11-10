import type { MetadataRoute } from 'next';

export const revalidate = 3600;

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      // API 경로는 크롤링 불필요
      { userAgent: '*', disallow: ['/api'] },
    ],
    host: site,
    sitemap: `${site}/sitemap.xml`,
  };
}

