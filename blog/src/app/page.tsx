import Link from 'next/link';
import ProtectedLink from '@/components/common/ProtectedLink';
import Image from 'next/image';
import { SITE_NAME, TAGLINE } from '@/lib/brand';
import { formatDateKR } from '@/lib/date';
// 대표 글 카드 제거에 따라 이미지 유틸 불필요
import PostCard from '@/components/blog/PostCard';
import { Mail, AtSign, Globe, Facebook, Twitter, Instagram, Share2, Link2 } from 'lucide-react';
import ShareButtonsClient from '@/components/common/ShareButtonsClient';
import VisitorPing from '@/components/analytics/VisitorPing';
import { createPublicSupabaseClient } from '@/lib/supabase/env';
import { Suspense } from 'react';
import { outlineButtonSmall } from '@/lib/styles/ui';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { getLocale } from '@/i18n/getLocale';
import { prefixPath } from '@/lib/i18n/link';
import HomeLocalPosts from '@/components/blog/HomeLocalPosts';
import ServerPreviewPosts from '@/components/blog/ServerPreviewPosts';
import { initializeLocalTestData } from '@/lib/local-test-data';
// Accordion 섹션 제거

export const revalidate = 60;

const SocialLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors duration-200">
    <span aria-hidden="true">{icon}</span>
    <span className="text-sm font-medium">{label}</span>
  </a>
);



export default async function HomePage() {
  const t = await getTranslations('home');
  const locale = await getLocale();
  const prefix = prefixPath(locale);
  let recent: any[] = [];
  
  // 로컬 테스트 데이터 초기화
  try {
    initializeLocalTestData();
  } catch (error) {
    console.log('로컬 테스트 데이터 초기화 실패:', error);
  }
  
  // 서버프리뷰 환경 체크
  const isServerPreview = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('localhost');
  
  // 항상 데이터를 시도하고 실패 시 대체 데이터 사용
  try {
    // 먼저 API 엔드포인트 시도
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const apiUrl = new URL('/api/public/recent', baseUrl).toString();
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(apiUrl, { 
      next: { revalidate: 60, tags: ['posts:list'] },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const json = await res.json();
      recent = (json?.posts || []).map((p: any) => ({
        ...p,
        __authorName: p.authorName,
        __authorAvatar: p.authorAvatarUrl,
      }));
    }
  } catch (apiError) {
    console.log('API 엔드포인트 실패, Supabase 직접 연결 시도:', apiError);
  }

  // API 실패 또는 데이터 없으면 Supabase 직접 연결
  if (recent.length === 0 && !isServerPreview) {
    try {
      const supabase = createPublicSupabaseClient();
      const { data: posts } = await supabase
        .from('posts')
        .select('id, user_id, title, slug, excerpt, cover_image, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(6);
      const list = posts || [];
      const userIds = Array.from(new Set(list.map((p: any) => p.user_id).filter(Boolean)));
      let profiles: Record<string, { name: string; avatar: string }> = {};
      if (userIds.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds as any);
        (profs || []).forEach((pr: any) => {
          profiles[pr.id] = { name: pr.username || '', avatar: pr.avatar_url || '' };
        });
      }
      recent = list.map((p: any) => ({
        ...p,
        __authorName: profiles[p.user_id]?.name || p.user_id || '',
        __authorAvatar: profiles[p.user_id]?.avatar || '',
      }));
    } catch (supabaseError) {
      console.log('Supabase 연결도 실패, 테스트 데이터 사용:', supabaseError);
    }
  }

  return (
    <main id="main" role="main" aria-labelledby="home-title" className="max-w-3xl mx-auto p-4 space-y-12">
      {/* 히어로 */}
      <section className="space-y-6">
        <div className="space-y-3">
          <h1 id="home-title" className="text-3xl font-bold">{SITE_NAME}</h1>
          <p className="text-gray-600 text-lg">{TAGLINE}</p>
          
          {/* 라키라키 모토 - 미니멀 럭셔리 디자인 */}
          <div className="relative mt-4 luxury-hover">
            <p className="text-sm font-light tracking-wide text-gray-600 uppercase letter-spacing-wide refined-text">
              당신의 생각이 반짝이는 곳, 라키라키
            </p>
            <div className="mt-2 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-32"></div>
          </div>
          
          {/* 방문자 통계는 푸터에서만 통합 표시합니다 */}
          <div className="flex gap-3 pt-2">
            <Link href={`${prefix}/posts`} className={outlineButtonSmall}>{t('viewRecent')}</Link>
            <ProtectedLink href={`${prefix}/write`} className={outlineButtonSmall} ariaLabel={t('write')}>{t('write')}</ProtectedLink>
          </div>
        </div>
        
        {/* 소셜 공유 아이콘 */}
        <ShareButtonsClient />
        
        {/* 방문 핑: 새로고침은 중복 집계되지 않음 */}
        <VisitorPing />
      </section>

      {/* 뉴스레터 섹션 제거 */}

      {/* 대표 글 섹션 제거 */}

      {/* 최신 글 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t('latest')}</h2>
          <Link href={`${prefix}/posts`} className="text-sm font-medium text-gray-600 hover:text-black focus:outline-none focus:ring-2 focus:ring-black rounded">{(await getTranslations('common'))('viewAll')}</Link>
        </div>
        {recent.length === 0 ? (
          <div className="border rounded-lg p-8 text-center space-y-3">
            <p className="text-base text-gray-600">
              {isServerPreview ? '서버프리뷰에서는 실제 데이터를 불러올 수 없습니다. 로컬 테스트 데이터를 확인해주세요.' : t('noPosts')}
            </p>
            {isServerPreview ? (
              <p className="text-sm text-gray-500">
                아래의 '테스트 글' 또는 '서버프리뷰 테스트 글' 섹션을 확인하세요.
              </p>
            ) : (
              <ProtectedLink href={`${prefix}/write`} className={outlineButtonSmall} ariaLabel={t('writeFirst')}>
                {t('writeFirst')}
              </ProtectedLink>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {recent.map((p, i) => (
              <PostCard
                key={p.id}
                variant="polaroid"
                showExcerpt={true}
                priority={i === 0}
                post={{
                  id: p.id,
                  user_id: p.user_id,
                  title: p.title,
                  slug: p.slug,
                  excerpt: p.excerpt,
                  cover_image: p.cover_image,
                  content: null,
                  created_at: p.created_at,
                  like_count: null,
                  dislike_count: null,
                }}
                authorName={(p as any).__authorName}
                authorAvatarUrl={(p as any).__authorAvatar}
              />
            ))}
          </div>
        )}
      </section>

      {/* 서버프리뷰 전용 테스트 데이터 - 서버프리뷰에서만 추가 표시 */}
      {isServerPreview && <ServerPreviewPosts />}

      {/* 퀵 링크 */}
      <section className="border rounded-lg p-5">
        <h2 className="text-lg font-bold mb-3">{t('quick')}</h2>
        <div className="flex flex-wrap gap-3">
          <Link href={`${prefix}/posts`} className={outlineButtonSmall}>{t('posts')}</Link>
          <ProtectedLink href={`${prefix}/write`} className={outlineButtonSmall} ariaLabel={t('write')}>{t('write')}</ProtectedLink>
          <Link href="/rss.xml" className={outlineButtonSmall}>{t('rss')}</Link>
          <Link href="/atom.xml" className={outlineButtonSmall}>{t('atom')}</Link>
        </div>
      </section>

      {/* 소개 박스 */}
      <section className="border rounded-lg p-5">
        <h2 className="text-lg font-bold mb-4">{t('intro')}</h2>
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src="https://hyueqldwgertapmhmmni.supabase.co/storage/v1/object/public/blog-images/IMG_20250916_085108_380.jpg"
              alt="프로필 이미지"
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="space-y-2">
            <p className="text-base text-gray-700">{TAGLINE}. 라키라키는 담백한 레이아웃으로 글 중심 경험을 제공합니다.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              <SocialLink href="mailto:salad20c@gmail.com" icon={<Mail size={16} />} label="Email" />
              <SocialLink href="https://www.threads.net/@ilovemom_2026" icon={<AtSign size={16} />} label="Threads" />
              <SocialLink href="https://cafe.naver.com/catch10man" icon={<Globe size={16} />} label="키움캐치" />
            </div>
          </div>
        </div>
      </section>

      {/* 정보 아코디언 섹션 제거 */}
    </main>
  );
}

// 서버 함수 기반 StatsBar 제거: 클라이언트 컴포넌트로 대체
