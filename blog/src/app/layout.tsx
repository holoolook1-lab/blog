import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AuthToastBridge from '@/components/layout/AuthToastBridge';
import AuthSessionHydrator from '@/components/layout/AuthSessionHydrator';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getPublicSiteMeta } from '@/lib/site';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale } from '@/i18n/getLocale';
import { getMessages } from '@/i18n/messages';

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
    languages: {
      ko: '/',
    },
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  let nonce: string | undefined = undefined;
  try { nonce = (await cookies()).get('cspnonce')?.value; } catch {}
  return (
    <html lang={locale}>
      <body className="min-h-screen bg-white text-black antialiased">
        <a href="#main" className="skip-link">본문 바로가기</a>
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Seoul">
          <Header />
          <Suspense fallback={null}>
            <AuthToastBridge />
            <AuthSessionHydrator />
          </Suspense>
          <span id="main" />
          {children}
          <script
            type="application/ld+json"
            nonce={nonce}
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
            nonce={nonce}
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
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
