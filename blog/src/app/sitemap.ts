import { createPublicSupabaseClient } from '@/lib/supabase/env';
import type { MetadataRoute } from 'next';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicSupabaseClient();
  const { data: posts } = await supabase.from('posts').select('slug, updated_at').eq('published', true);
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const now = new Date().toISOString();
  const items: MetadataRoute.Sitemap = (posts || []).map((p) => ({
    url: `${site}/posts/${p.slug}`,
    lastModified: p.updated_at || now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  return [{ url: site, lastModified: now, changeFrequency: 'daily' as const, priority: 1 }, ...items];
}
