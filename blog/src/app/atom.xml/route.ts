import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { getPublicSiteMeta, buildPostUrl } from '@/lib/site';

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
      console.error('Atom 피드 생성 오류:', error);
      return new Response('Atom 피드 생성 실패', { status: 500 });
    }

    const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:naver="http://naver.com/"
      xmlns:media="http://search.yahoo.com/mrss/">
  <title>${siteName}</title>
  <subtitle>${siteDesc}</subtitle>
  <link href="${site}" />
  <link href="${site}/atom.xml" rel="self" />
  <id>${site}/</id>
  <updated>${new Date().toISOString()}</updated>
  <author>
    <name>락이락이 블로그</name>
    <email>admin@rakiraki.com</email>
  </author>
  <generator>락이락이 블로그 Atom Generator</generator>
  <rights>Copyright ${new Date().getFullYear()} ${siteName}</rights>
  <icon>${site}/favicon.ico</icon>
  <logo>${site}/opengraph-image</logo>
  
  <!-- 네이버 SEO -->
  <naver:blog_type>personal</naver:blog_type>
  <naver:blog_region>kr</naver:blog_region>
  <naver:blog_language>korean</naver:blog_language>
  
  ${posts?.map((post: any) => {
    const postUrl = buildPostUrl(site, post.slug || '');
    const content = post.content || post.excerpt || '';
    const readingTime = Math.ceil(content.split(/\s+/).length / 200);
    
    return `
  <entry>
    <title><![CDATA[${post.title}]]></title>
    <link href="${postUrl}" />
    <id>${postUrl}</id>
    <updated>${post.updated_at || post.created_at}</updated>
    <published>${post.created_at}</published>
    <summary><![CDATA[${post.excerpt || post.title}]]></summary>
    <content type="html"><![CDATA[${content}]]></content>
    <author>
      <name><![CDATA[${post.user_id || 'Unknown'}]]></name>
    </author>
    
    <!-- Reading time -->
    <readingTime>${readingTime}분</readingTime>
    
    <!-- Cover image -->
    ${post.cover_image ? `
    <media:thumbnail url="${post.cover_image}" />
    <media:content url="${post.cover_image}" medium="image" />` : ''}
    
    <!-- Categories -->
    <category term="블로그" />
    <category term="한국" />
    
    <!-- Naver specific -->
    <naver:blog_category>블로그 포스트</naver:blog_category>
    <naver:post_date>${post.created_at.split('T')[0]}</naver:post_date>
    <naver:author><![CDATA[${post.user_id || 'Unknown'}]]></naver:author>
    
    <!-- Source -->
    <source>
      <id>${site}</id>
      <title>${siteName}</title>
    </source>
  </entry>`;
  }).join('')}
  
</feed>`;

    return new Response(atom, {
      headers: {
        'Content-Type': 'application/atom+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'index, follow',
        'X-Atom-Generator': 'Rakiraki Atom Generator',
        'X-Naver-Atom': 'enabled',
      },
    });
    
  } catch (error) {
    console.error('Atom 피드 생성 중 오류:', error);
    return new Response('Atom 피드 생성 실패', { status: 500 });
  }
}
