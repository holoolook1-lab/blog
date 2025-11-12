import { createPublicSupabaseClient } from '@/lib/supabase/env';
import type { MetadataRoute } from 'next';
import { getPublicSiteMeta } from '@/lib/site';
import { buildPostUrl } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { url: site } = getPublicSiteMeta();
  const now = new Date().toISOString();
  try {
    const supabase = createPublicSupabaseClient();
    const { data: posts } = await supabase.from('posts').select('slug, updated_at').eq('published', true);
    const items: MetadataRoute.Sitemap = (posts || []).map((p: any) => ({
      url: buildPostUrl(site, p.slug || ''),
      lastModified: p.updated_at || now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    return [{ url: site, lastModified: now, changeFrequency: 'daily' as const, priority: 1 }, ...items];
  } catch {
    return [{ url: site, lastModified: now, changeFrequency: 'daily' as const, priority: 1 }];
  }
}
