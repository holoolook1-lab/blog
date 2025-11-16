import { NextResponse } from 'next/server';
import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getPublicSiteMeta } from '@/lib/site';

export const dynamic = 'force-static';
export const revalidate = 3600; // 1시간마다 재검증

export async function GET() {
  const supabase = createPublicSupabaseClient();
  const { url: siteUrl } = getPublicSiteMeta();
  
  try {
    // 공개된 포스트만 조회
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, slug, created_at, updated_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(1000); // 최대 1000개

    if (error) {
      console.error('다음 사이트맵 생성 중 오류:', error);
      return new NextResponse('사이트맵 생성 실패', { status: 500 });
    }

    // 다음 검색엔진용 XML 사이트맵 생성
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  
  <!-- 홈페이지 -->
  <url>
    <loc>${siteUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- 포스트 목록 -->
  <url>
    <loc>${siteUrl}/posts</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

${posts?.map((post: any) => {
  const postUrl = `${siteUrl}/posts/${post.slug}`;
  const lastmod = post.updated_at || post.created_at;
  
  // 다음 검색엔진용 뉴스 사이트맵 형식
  return `  <url>
    <loc>${postUrl}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <news:news>
      <news:publication>
        <news:name>락이락이 블로그</news:name>
        <news:language>ko</news:language>
      </news:publication>
      <news:publication_date>${new Date(post.created_at).toISOString()}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
      <news:keywords>${escapeXml(post.title)}</news:keywords>
    </news:news>
  </url>`;
}).join('\n')}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('다음 사이트맵 생성 중 오류:', error);
    return new NextResponse('사이트맵 생성 실패', { status: 500 });
  }
}

// XML 특수문자 이스케이프
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}