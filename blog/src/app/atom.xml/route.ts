import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getPublicSiteMeta } from '@/lib/site';
import { buildPostUrl } from '@/lib/site';
import { getAtomEntriesCached } from '@/lib/cache/feeds';

export const revalidate = 3600;

export async function GET() {
  const { url: site, name } = getPublicSiteMeta();
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  try {
    const posts = await getAtomEntriesCached();
    const entries = (posts || [])
      .map((p: any) => {
        const url = buildPostUrl(site, p.slug || '');
        return `\n  <entry>\n    <title>${p.title}</title>\n    <link href="${url}"/>\n    <id>${url}</id>\n    <updated>${new Date(p.updated_at).toISOString()}</updated>\n    ${p.heading ? `<category term="${esc(p.heading)}"/>` : ''}\n    <summary><![CDATA[${p.excerpt || ''}]]></summary>\n  </entry>`;
      })
      .join('');
    const xml = `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>${name}</title>\n  <link href="${site}"/>\n  <updated>${new Date().toISOString()}</updated>${entries}\n</feed>`;
    return new NextResponse(xml, { headers: { 'Content-Type': 'application/atom+xml' } });
  } catch {
    const xml = `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>${name}</title>\n  <link href="${site}"/>\n  <updated>${new Date().toISOString()}\n</feed>`;
    return new NextResponse(xml, { headers: { 'Content-Type': 'application/atom+xml' } });
  }
}
