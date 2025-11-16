import { unstable_cache } from 'next/cache';
import { createPublicSupabaseClient } from '@/lib/supabase/env';

export const getRssItemsCached = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient();
    const { data: posts } = await supabase
      .from('posts')
      .select('title, slug, excerpt, updated_at, heading')
      .eq('published', true)
      .order('updated_at', { ascending: false })
      .limit(20);
    return posts || [];
  },
  ['feed:rss'],
  { revalidate: 3600, tags: ['feed:rss'] }
);

export const getAtomEntriesCached = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient();
    const { data: posts } = await supabase
      .from('posts')
      .select('title, slug, excerpt, updated_at, heading')
      .eq('published', true)
      .order('updated_at', { ascending: false })
      .limit(20);
    return posts || [];
  },
  ['feed:atom'],
  { revalidate: 3600, tags: ['feed:atom'] }
);

export const getSitemapItemsCached = unstable_cache(
  async () => {
    const supabase = createPublicSupabaseClient();
    const { data: posts } = await supabase.from('posts').select('slug, updated_at').eq('published', true);
    return posts || [];
  },
  ['feed:sitemap'],
  { revalidate: 3600, tags: ['feed:sitemap'] }
);

