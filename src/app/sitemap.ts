import { createPublicSupabaseClient } from '@/lib/supabase/env';
import type { MetadataRoute } from 'next';
import { getPublicSiteMeta } from '@/lib/site';
import { buildPostUrl } from '@/lib/site';
import { getSitemapItemsCached } from '@/lib/cache/feeds';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { url: site } = getPublicSiteMeta();
  const now = new Date().toISOString();
  
  try {
    const posts = await getSitemapItemsCached();
    
    // 한국어 포스트 (우선순위 높음)
    const koItems: MetadataRoute.Sitemap = (posts || []).map((p: any) => ({
      url: buildPostUrl(site, p.slug || ''),
      lastModified: p.updated_at || now,
      changeFrequency: 'weekly' as const,
      priority: 0.8, // 네이버 SEO를 위한 높은 우선순위
    }));
    
    // 영어 포스트 (우선순위 낮음)
    const enItems: MetadataRoute.Sitemap = (posts || []).map((p: any) => ({
      url: `${site}/en/posts/${p.slug || ''}`,
      lastModified: p.updated_at || now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));
    
    return [
      // 메인 페이지 (최우선)
      { 
        url: site, 
        lastModified: now, 
        changeFrequency: 'daily' as const, 
        priority: 1 
      },
      
      // 한국어 메인 페이지
      { 
        url: `${site}/ko`, 
        lastModified: now, 
        changeFrequency: 'daily' as const, 
        priority: 0.9 
      },
      
      // 게시물 페이지
      { 
        url: `${site}/posts`, 
        lastModified: now, 
        changeFrequency: 'daily' as const, 
        priority: 0.9 
      },
      
      // 마이페이지 (게임화 시스템)
      { 
        url: `${site}/mypage`, 
        lastModified: now, 
        changeFrequency: 'daily' as const, 
        priority: 0.8 
      },
      
      // 글쓰기 페이지
      { 
        url: `${site}/write`, 
        lastModified: now, 
        changeFrequency: 'monthly' as const, 
        priority: 0.7 
      },
      
      // 네이버 SEO 테스트 페이지
      { 
        url: `${site}/naver-seo-test`, 
        lastModified: now, 
        changeFrequency: 'weekly' as const, 
        priority: 0.6 
      },
      
      // PWA 테스트 페이지
      { 
        url: `${site}/pwa-test`, 
        lastModified: now, 
        changeFrequency: 'weekly' as const, 
        priority: 0.6 
      },
      
      // 정적 페이지들
      { 
        url: `${site}/terms`, 
        lastModified: now, 
        changeFrequency: 'monthly' as const, 
        priority: 0.3 
      },
      { 
        url: `${site}/privacy`, 
        lastModified: now, 
        changeFrequency: 'monthly' as const, 
        priority: 0.3 
      },
      
      // 한국어 포스트들 (우선순위 높음)
      ...koItems,
      
      // 영어 페이지들 (우선순위 낮음)
      { url: `${site}/en`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.5 },
      { url: `${site}/en/terms`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.2 },
      { url: `${site}/en/privacy`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.2 },
      ...enItems,
      
      // RSS 피드
      { 
        url: `${site}/rss.xml`, 
        lastModified: now, 
        changeFrequency: 'hourly' as const, 
        priority: 0.8 
      },
      { 
        url: `${site}/atom.xml`, 
        lastModified: now, 
        changeFrequency: 'hourly' as const, 
        priority: 0.8 
      },
      { 
        url: `${site}/feed.xml`, 
        lastModified: now, 
        changeFrequency: 'hourly' as const, 
        priority: 0.8 
      },
      
      // 네이버 검증 파일
      { 
        url: `${site}/naver-verification.html`, 
        lastModified: now, 
        changeFrequency: 'yearly' as const, 
        priority: 0.1 
      },
      
      // 다음(카카오) 검색엔진용 사이트맵
      { 
        url: `${site}/daum-sitemap.xml`, 
        lastModified: now, 
        changeFrequency: 'daily' as const, 
        priority: 0.9 
      },
      
      // PWA 파일들
      { 
        url: `${site}/manifest.json`, 
        lastModified: now, 
        changeFrequency: 'monthly' as const, 
        priority: 0.4 
      },
      { 
        url: `${site}/sw.js`, 
        lastModified: now, 
        changeFrequency: 'weekly' as const, 
        priority: 0.3 
      },
    ];
  } catch {
    // 오류 시 최소한의 사이트맵 반환
    return [
      { url: site, lastModified: now, changeFrequency: 'daily' as const, priority: 1 },
      { url: `${site}/posts`, lastModified: now, changeFrequency: 'daily' as const, priority: 0.9 },
      { url: `${site}/terms`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
      { url: `${site}/privacy`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.3 },
    ];
  }
}
