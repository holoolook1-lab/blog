import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/env';

export const revalidate = 3600;

export async function GET() {
  const supabase = createPublicSupabaseClient();
  const { data: posts } = await supabase.from('posts').select('title, slug, excerpt, updated_at').eq('published', true).order('updated_at', { ascending: false }).limit(20);
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const items = (posts || [])
    .map(
      (p) => `\n  <item>\n    <title>${p.title}</title>\n    <link>${site}/posts/${p.slug}</link>\n    <guid>${site}/posts/${p.slug}</guid>\n    <description><![CDATA[${p.excerpt || ''}]]></description>\n    <pubDate>${new Date(p.updated_at).toUTCString()}</pubDate>\n  </item>`
    )
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>${process.env.NEXT_PUBLIC_SITE_NAME || '블로그'}</title>\n  <link>${site}</link>\n  <description>${process.env.NEXT_PUBLIC_SITE_DESCRIPTION || ''}</description>${items}\n</channel>\n</rss>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}
