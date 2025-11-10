import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getPublicSiteMeta } from '@/lib/site';

export const revalidate = 3600;

export async function GET() {
  const supabase = createPublicSupabaseClient();
  const { data: posts } = await supabase.from('posts').select('title, slug, excerpt, updated_at').eq('published', true).order('updated_at', { ascending: false }).limit(20);
  const { url: site, name } = getPublicSiteMeta();
  const entries = (posts || [])
    .map(
      (p) => `\n  <entry>\n    <title>${p.title}</title>\n    <link href="${site}/posts/${p.slug}"/>\n    <id>${site}/posts/${p.slug}</id>\n    <updated>${new Date(p.updated_at).toISOString()}</updated>\n    <summary><![CDATA[${p.excerpt || ''}]]></summary>\n  </entry>`
    )
    .join('');
  const xml = `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>${name}</title>\n  <link href="${site}"/>\n  <updated>${new Date().toISOString()}</updated>${entries}\n</feed>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/atom+xml' } });
}
