import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getPublicSiteMeta } from '@/lib/site';

export const revalidate = 3600; // 1시간 캐시

// 다음(카카오) 검색엔진용 사이트맵
export async function GET() {
  const supabase = createPublicSupabaseClient();
  const { url: site } = getPublicSiteMeta();
  
  try {
    // 최근 게시물 100개 조회
    const { data: posts } = await supabase
      .from('posts')
      .select('slug, created_at, updated_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!posts || posts.length === 0) {
      return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    const urls = posts.map((post: any) => {
      const lastmod = new Date(post.updated_at || post.created_at).toISOString();
      const url = `${site}/posts/${post.slug}`;
      
      return `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`;
    }).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${site}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${site}/posts</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>${urls}
</urlset>`;

    return new Response(sitemap, {
      headers: { 
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      },
    });
  } catch (error) {
    console.error('다음 사이트맵 생성 오류:', error);
    
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml' },
      status: 500
    });
  }
}