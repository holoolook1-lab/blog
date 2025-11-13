import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthToastBridge from '@/components/layout/AuthToastBridge';
import AuthSessionHydrator from '@/components/layout/AuthSessionHydrator';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getPublicSiteMeta } from '@/lib/site';

const { url: site, name: siteName, description: siteDesc } = getPublicSiteMeta();

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: siteDesc,
  openGraph: {
    type: 'website',
    siteName,
    url: site,
    title: siteName,
    description: siteDesc,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDesc,
  },
  alternates: {
    types: {
      'application/rss+xml': '/rss.xml',
      'application/atom+xml': '/atom.xml',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-white text-black antialiased">
        {/* 접근성: 본문 바로가기 스킵 링크 */}
        <a href="#main" className="skip-link">본문 바로가기</a>
        {/* 공용 헤더 */}
        <Header />
        {/* 인증 성공/실패 토스트 브릿지 */}
        <Suspense fallback={null}>
          <AuthToastBridge />
          {/* 서버 쿠키 세션을 클라이언트 세션으로 하이드레이션 */}
          <AuthSessionHydrator />
        </Suspense>
        {/* 스킵 링크 타깃 */}
        <span id="main" />
        {children}
        {/* 모바일 하단 CTA 제거 */}
        <Footer />
      </body>
    </html>
  );
}
