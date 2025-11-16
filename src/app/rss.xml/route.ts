import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getPublicSiteMeta, buildPostUrl } from '@/lib/site';
import { formatDateKR } from '@/lib/date';

export const dynamic = 'force-static';
export const revalidate = 3600; // 1시간마다 재검증

export async function GET() {
  const { url: site, name: siteName, description: siteDesc } = getPublicSiteMeta();
  const supabase = createPublicSupabaseClient();
  
  try {
    // 최근 게시물 20개 가져오기
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, excerpt, content, slug, created_at, updated_at, cover_image, user_id')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('RSS 피드 생성 오류:', error);
      return new Response('RSS 피드 생성 실패', { status: 500 });
    }

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:naver="http://naver.com/">
  <channel>
    <title>${siteName}</title>
    <link>${site}</link>
    <description>${siteDesc}</description>
    <language>ko-KR</language>
    <copyright>Copyright ${new Date().getFullYear()} ${siteName}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>락이락이 블로그</generator>
    <managingEditor>admin@rakiraki.com</managingEditor>
    <webMaster>admin@rakiraki.com</webMaster>
    
    <!-- 네이버 SEO -->
    <naver:blog_type>personal</naver:blog_type>
    <naver:blog_region>kr</naver:blog_region>
    <naver:blog_language>korean</naver:blog_language>
    
    <!-- Self reference -->
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />
    
    <!-- Feed image -->
    <image>
      <url>${site}/opengraph-image</url>
      <title>${siteName}</title>
      <link>${site}</link>
    </image>
    
    <!-- Categories -->
    <category>블로그</category>
    <category>한국</category>
    <category>커뮤니티</category>
    <category>게임화</category>
    <category>소셜미디어</category>
    
    ${posts?.map((post: any) => {
      const postUrl = buildPostUrl(site, post.slug || '');
      const pubDate = new Date(post.created_at).toUTCString();
      const updateDate = new Date(post.updated_at).toUTCString();
      const content = post.content || post.excerpt || '';
      const readingTime = Math.ceil(content.split(/\s+/).length / 200); // 200단어/분
      
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${post.excerpt || post.title}]]></description>
      <content:encoded><![CDATA[${content}]]></content:encoded>
      <dc:creator><![CDATA[${post.user_id || 'Unknown'}]]></dc:creator>
      <pubDate>${pubDate}</pubDate>
      <updated>${updateDate}</updated>
      <dc:date>${post.created_at}</dc:date>
      <dc:format>text/html</dc:format>
      <dc:language>ko-KR</dc:language>
      
      <!-- Reading time -->
      <readingTime>${readingTime}분</readingTime>
      
      <!-- Cover image -->
      ${post.cover_image ? `
      <media:thumbnail url="${post.cover_image}" />
      <media:content url="${post.cover_image}" medium="image" />
      <enclosure url="${post.cover_image}" type="image/jpeg" />` : ''}
      
      <!-- Categories -->
      <category domain="${site}/categories">블로그</category>
      <category domain="${site}/categories">한국</category>
      
      <!-- Naver specific -->
      <naver:blog_category>블로그 포스트</naver:blog_category>
      <naver:post_date>${post.created_at.split('T')[0]}</naver:post_date>
      <naver:author><![CDATA[${post.user_id || 'Unknown'}]]></naver:author>
      
      <!-- Comments count (if available) -->
      <comments>${postUrl}#comments</comments>
      
      <!-- Source -->
      <source url="${site}">${siteName}</source>
    </item>`;
    }).join('')}
    
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'index, follow',
        'X-RSS-Generator': 'Rakiraki RSS Generator',
        'X-Naver-RSS': 'enabled',
      },
    });
    
  } catch (error) {
    console.error('RSS 피드 생성 중 오류:', error);
    return new Response('RSS 피드 생성 실패', { status: 500 });
  }
}
