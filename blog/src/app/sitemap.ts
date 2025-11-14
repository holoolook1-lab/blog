import { createPublicSupabaseClient } from '@/lib/supabase/env';
import type { MetadataRoute } from 'next';
import { getPublicSiteMeta } from '@/lib/site';
import { buildPostUrl } from '@/lib/site';
import { getSitemapItemsCached } from '@/lib/cache/feeds';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { url: site } = getPublicSiteMeta();
  const now = new Date().toISOString();
  try {
    const posts = await getSitemapItemsCached();
    const koItems: MetadataRoute.Sitemap = (posts || []).map((p: any) => ({
      url: buildPostUrl(site, p.slug || ''),
      lastModified: p.updated_at || now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    const enItems: MetadataRoute.Sitemap = (posts || []).map((p: any) => ({
      url: `${site}/en/posts/${p.slug || ''}`,
      lastModified: p.updated_at || now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
    return [
      { url: site, lastModified: now, changeFrequency: 'daily' as const, priority: 1 },
      { url: `${site}/terms`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
      { url: `${site}/privacy`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
      ...koItems,
      { url: `${site}/en`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 },
      { url: `${site}/en/terms`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
      { url: `${site}/en/privacy`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
      ...enItems,
    ];
  } catch {
    return [
      { url: site, lastModified: now, changeFrequency: 'daily' as const, priority: 1 },
      { url: `${site}/terms`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
      { url: `${site}/privacy`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
    ];
  }
}
