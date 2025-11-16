import type { MetadataRoute } from 'next';
import { getPublicSiteMeta } from '@/lib/site';

export const revalidate = 3600;

export default function robots(): MetadataRoute.Robots {
  const { url: site } = getPublicSiteMeta();
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
