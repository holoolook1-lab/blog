import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getPublicSiteMeta } from '@/lib/site';
import { buildPostUrl } from '@/lib/site';
import { getRssItemsCached } from '@/lib/cache/feeds';

export const revalidate = 3600;

export async function GET() {
  const { url: site, name, description } = getPublicSiteMeta();
  try {
    const posts = await getRssItemsCached();
    const items = (posts || [])
      .map((p: any) => {
        const url = buildPostUrl(site, p.slug || '');
        return `\n  <item>\n    <title>${p.title}</title>\n    <link>${url}</link>\n    <guid>${url}</guid>\n    ${p.heading ? `<category><![CDATA[${p.heading}]]></category>` : ''}\n    <description><![CDATA[${p.excerpt || ''}]]></description>\n    <pubDate>${new Date(p.updated_at).toUTCString()}</pubDate>\n  </item>`;
      })
      .join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>${name}</title>\n  <link>${site}</link>\n  <description>${description}</description>${items}\n</channel>\n</rss>`;
    return new NextResponse(xml, { headers: { 'Content-Type': 'application/rss+xml' } });
  } catch {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>${name}</title>\n  <link>${site}</link>\n  <description>${description}</description>\n</channel>\n</rss>`;
    return new NextResponse(xml, { headers: { 'Content-Type': 'application/rss+xml' } });
  }
}
