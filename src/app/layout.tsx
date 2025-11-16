import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthToastBridge from '@/components/layout/AuthToastBridge';
import AuthSessionHydrator from '@/components/layout/AuthSessionHydrator';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import type { Metadata, Viewport } from 'next';
import { getPublicSiteMeta } from '@/lib/site';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from '@/i18n/getLocale';
import { getMessages } from '@/i18n/messages';
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt';
import { generateNaverVerificationMeta } from '@/lib/seo/naverSEO';
import { CoreWebVitalsTracker } from '@/components/analytics/CoreWebVitalsTracker';
import { Toaster } from 'sonner';

const { url: site, name: siteName, description: siteDesc } = getPublicSiteMeta();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // 다크모드 비활성화 - 항상 밝은 테마 유지
  colorScheme: 'light',
  themeColor: '#ffffff',
};

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDesc,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '락이락이 블로그',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor': '#8b5cf6',
    'msapplication-tap-highlight': 'no',
    
    // 네이버 SEO 최적화
    'naver-site-verification': 'c4a4c8c9c1c2c3c4c5c6c7c8c9c0c1c2c3',
    'naver-search-advisor-site-verification': 'c4a4c8c9c1c2c3c4c5c6c7c8c9c0c1c2c3',
    'naver-webmaster-tool': 'enabled',
    'naver-analytics': 'true',
    'naver-search-console': 'verified',
    
    // 다음(카카오) 검색엔진 대응
    'daum-site-verification': 'c4a4c8c9c1c2c3c4c5c6c7c8c9c0c1c2c3',
    'kakao-webmaster-tool': 'enabled',
    'daum-webmaster-tool': 'enabled',
    'kakao-analytics': 'true',
    
    // 한국어 특화
    'language': 'korean',
    'content-language': 'ko',
    'geo.region': 'KR',
    'geo.placename': 'South Korea',
    'korean-blog': 'true',
    'hangul-content': 'enabled',
    
    // 블로그 플랫폼 정보
    'blog-platform': 'rakiraki',
    'blog-type': 'personal',
    'blog-language': 'korean',
    'blog-region': 'kr',
    
    // 검색엔진 최적화
    'search-engine': 'naver,google,daum',
    'search-language': 'korean',
    'search-region': 'kr',
    'priority': 'high',
    
    // 게임화 시스템
    'gamification': 'enabled',
    'attendance-system': 'enabled',
    'achievement-system': 'enabled',
    'point-system': 'enabled',
    
    // 소셜 미디어 통합
    'social-media-integration': 'enabled',
    'youtube-embed': 'enabled',
    'instagram-embed': 'enabled',
    'twitter-embed': 'enabled',
    'tiktok-embed': 'enabled',
    'facebook-embed': 'enabled',
    'navertv-embed': 'enabled',
    
    // PWA 기능
    'pwa-enabled': 'true',
    'offline-support': 'enabled',
    'service-worker': 'enabled',
    'installable-app': 'true',
  },
  openGraph: {
    type: 'website',
    siteName,
    url: site,
    title: siteName,
    description: siteDesc,
    locale: 'ko_KR',
    countryName: 'South Korea',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDesc,
    creator: '@rakiraki_blog',
    site: '@rakiraki_blog',
  },
  alternates: {
    types: {
      'application/rss+xml': '/rss.xml',
      'application/atom+xml': '/atom.xml',
    },
    languages: {
      ko: '/',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code', // 실제 코드로 교체 필요
    yandex: 'yandex-verification-code', // 실제 코드로 교체 필요
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  let nonce: string | undefined = undefined;
  try { nonce = (await cookies()).get('cspnonce')?.value; } catch {}
  return (
    <html lang={locale} className="light" style={{ colorScheme: 'light' }}>
      <body className="min-h-screen bg-white text-black antialiased">
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Seoul">
          <Header />
          <Suspense fallback={null}>
            <AuthToastBridge />
            <AuthSessionHydrator />
          </Suspense>
          <span id="main" />
          {children}
          
          {/* PWA 설치 프롬프트 */}
          <PWAInstallPrompt />
          
          {/* JSON-LD 스키마 마크업 - CSP를 위한 안전한 인라인 스크립트 */}
          <script
            type="application/ld+json"
            nonce={nonce || undefined}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: siteName,
                url: site,
              }),
            }}
          />
          <script
            type="application/ld+json"
            nonce={nonce || undefined}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                name: siteName,
                url: site,
                potentialAction: {
                  '@type': 'SearchAction',
                  target: `${site}/posts?q={search_term_string}`,
                  'query-input': 'required name=search_term_string',
                },
              }),
            }}
          />
          
          {/* Service Worker 등록 스크립트 */}
          <script
            nonce={nonce || undefined}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('[PWA] ServiceWorker registration successful:', registration.scope);
                      })
                      .catch(function(error) {
                        console.log('[PWA] ServiceWorker registration failed:', error);
                      });
                  });
                }
              `
            }}
          />
          
          <Footer />
        </NextIntlClientProvider>
        
        {/* Core Web Vitals 추적기 */}
        <CoreWebVitalsTracker />
        
        {/* Toast 알림 */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'toast',
          }}
        />
      </body>
    </html>
  );
}
