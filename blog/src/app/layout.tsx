import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { Metadata } from 'next';

const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const siteName = process.env.NEXT_PUBLIC_SITE_NAME || '내 블로그';
const siteDesc = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '개발 블로그입니다';

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
      <body className="min-h-screen bg-white text-black">
        {/* 공용 헤더 */}
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
