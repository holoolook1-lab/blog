import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getPublicSiteMeta } from '@/lib/site';

export const revalidate = 3600;

export async function GET() {
  const supabase = createPublicSupabaseClient();
  const { data: posts } = await supabase.from('posts').select('title, slug, excerpt, updated_at').eq('published', true).order('updated_at', { ascending: false }).limit(20);
  const { url: site, name, description } = getPublicSiteMeta();
  const items = (posts || [])
    .map(
      (p) => `\n  <item>\n    <title>${p.title}</title>\n    <link>${site}/posts/${p.slug}</link>\n    <guid>${site}/posts/${p.slug}</guid>\n    <description><![CDATA[${p.excerpt || ''}]]></description>\n    <pubDate>${new Date(p.updated_at).toUTCString()}</pubDate>\n  </item>`
    )
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>${name}</title>\n  <link>${site}</link>\n  <description>${description}</description>${items}\n</channel>\n</rss>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}
