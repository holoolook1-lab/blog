import Link from 'next/link';
import { SITE_NAME, TAGLINE } from '@/lib/brand';
import VisitorStats from '@/components/analytics/VisitorStats';

export default function Footer() {
  return (
    <footer className="mt-8 border-t">
      <div className="max-w-3xl mx-auto p-4 text-sm text-gray-600 flex flex-col gap-2">
        <p>
          <span className="font-medium text-gray-800">{SITE_NAME}</span> · {TAGLINE}
        </p>
        <VisitorStats />
        <div className="flex flex-wrap gap-3">
          <Link href="/rss.xml" className="hover:underline">RSS</Link>
          <Link href="/atom.xml" className="hover:underline">Atom</Link>
          <Link href="/feed.xml" className="hover:underline">JSON Feed</Link>
        </div>
        <p className="text-xs text-gray-400">© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
      </div>
    </footer>
  );
}
