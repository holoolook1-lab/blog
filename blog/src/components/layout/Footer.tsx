import Link from 'next/link';
import { SITE_NAME, TAGLINE } from '@/lib/brand';
import VisitorStats from '@/components/analytics/VisitorStats';

export default function Footer() {
  return (
    <footer className="mt-8 border-t" role="contentinfo" aria-labelledby="footer-title">
      <div className="max-w-3xl mx-auto p-4 text-sm text-gray-600 flex flex-col gap-2">
        <h2 id="footer-title" className="sr-only">사이트 정보</h2>
        <p>
          <span className="font-medium text-gray-800">{SITE_NAME}</span> · {TAGLINE}
        </p>
        <VisitorStats />
        <div className="flex flex-wrap gap-3">
          <Link href="/rss.xml" className="link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded" aria-label="RSS 피드">RSS</Link>
          <Link href="/atom.xml" className="link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded" aria-label="Atom 피드">Atom</Link>
          <Link href="/feed.xml" className="link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded" aria-label="JSON 피드">JSON Feed</Link>
          <Link href="/privacy" className="link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded" aria-label="개인정보 처리 방침">개인정보 처리 방침</Link>
          <Link href="/terms" className="link-gauge focus:outline-none focus:ring-2 focus:ring-black rounded" aria-label="이용 약관">이용 약관</Link>
        </div>
        <p className="text-xs text-black font-medium">© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
      </div>
    </footer>
  );
}
