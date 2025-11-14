import Link from 'next/link';
import { SITE_NAME, TAGLINE } from '@/lib/brand';
import VisitorStats from '@/components/analytics/VisitorStats';
import { getTranslations } from 'next-intl/server';
import { getLocale } from '@/i18n/getLocale';
import { prefixPath } from '@/lib/i18n/link';

export default async function Footer() {
  const t = await getTranslations('common');
  const locale = await getLocale();
  const prefix = prefixPath(locale);
  return (
    <footer className="mt-8 border-t" role="contentinfo" aria-labelledby="footer-title">
      <div className="max-w-3xl mx-auto p-4 text-sm text-gray-600 flex flex-col gap-2">
        <h2 id="footer-title" className="sr-only">{SITE_NAME}</h2>
        <p>
          <span className="font-medium text-gray-800">{SITE_NAME}</span> · {TAGLINE}
        </p>
        <VisitorStats />
        <div className="flex flex-wrap gap-3">
          <Link href="/rss.xml" className="link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded" aria-label={t('rss')}>{t('rss')}</Link>
          <Link href="/atom.xml" className="link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded" aria-label={t('atom')}>{t('atom')}</Link>
          <Link href="/feed.xml" className="link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded" aria-label={t('jsonFeed')}>{t('jsonFeed')}</Link>
          <Link href={`${prefix}/privacy`} className="link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded" aria-label={t('privacy')}>{t('privacy')}</Link>
          <Link href={`${prefix}/terms`} className="link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded" aria-label={t('terms')}>{t('terms')}</Link>
        </div>
        <p className="text-xs text-black font-medium">© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
      </div>
    </footer>
  );
}
