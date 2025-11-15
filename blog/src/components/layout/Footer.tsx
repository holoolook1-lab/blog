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
    <footer className="mt-12 border-t border-gray-200" role="contentinfo" aria-labelledby="footer-title">
      <div className="max-w-3xl mx-auto p-6 text-sm text-gray-600">
        <div className="space-y-4">
          <div className="space-y-2">
            <h2 id="footer-title" className="sr-only">{SITE_NAME}</h2>
            <p className="font-medium text-gray-800 text-base">
              {SITE_NAME}
            </p>
            <p className="text-gray-500 leading-relaxed max-w-md">
              {TAGLINE}
            </p>
            <p className="text-gray-600 font-light tracking-wide text-sm uppercase letter-spacing-wider">
              당신의 생각이 반짝이는 곳, 라키라키
            </p>
          </div>
          
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent w-full"></div>
          
          <div className="flex justify-center">
            <VisitorStats />
          </div>
          
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/rss.xml" className="text-gray-500 hover:text-gray-800 transition-colors duration-200" aria-label={t('rss')}>{t('rss')}</Link>
            <Link href="/atom.xml" className="text-gray-500 hover:text-gray-800 transition-colors duration-200" aria-label={t('atom')}>{t('atom')}</Link>
            <Link href="/feed.xml" className="text-gray-500 hover:text-gray-800 transition-colors duration-200" aria-label={t('jsonFeed')}>{t('jsonFeed')}</Link>
            <Link href={`${prefix}/privacy`} className="text-gray-500 hover:text-gray-800 transition-colors duration-200" aria-label={t('privacy')}>{t('privacy')}</Link>
            <Link href={`${prefix}/terms`} className="text-gray-500 hover:text-gray-800 transition-colors duration-200" aria-label={t('terms')}>{t('terms')}</Link>
          </div>
          
          <p className="text-xs text-gray-400 font-light tracking-wider pt-4">© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
