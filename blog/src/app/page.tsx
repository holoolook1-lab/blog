import Link from 'next/link';
import Image from 'next/image';
import { SITE_NAME, TAGLINE } from '@/lib/brand';
import { getOptimizedImageUrl, defaultSizes } from '@/lib/utils/image';
import PostCard from '@/components/blog/PostCard';
import { Mail, Github, Globe } from 'lucide-react';
import VisitorPing from '@/components/analytics/VisitorPing';

export const revalidate = 60;

const SocialLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors">
    {icon}
    <span className="text-sm font-medium">{label}</span>
  </a>
);

export default async function HomePage() {
  let latest: any | null = null;
  let recent: any[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const endpoint = `${url}/rest/v1/posts?select=id,title,slug,excerpt,cover_image,created_at&published=eq.true&order=created_at.desc&limit=6`;
      const res = await fetch(endpoint, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        next: { revalidate: 60 },
      });
      if (res.ok) {
        recent = await res.json();
        latest = recent[0] || null;
      }
    } catch {}
  }

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-12">
      {/* 히어로 */}
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">{SITE_NAME}</h1>
        <p className="text-gray-600 text-lg">{TAGLINE}</p>
        {/* 오늘/누적 방문자 */}
        <StatsBar />
        <div className="flex gap-3 pt-2">
          <Link href="/posts" className="inline-flex items-center justify-center border rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
            최근 글 보기
          </Link>
          <Link href="/write" className="inline-flex items-center justify-center border rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
            글 작성
          </Link>
        </div>
        {/* 방문 핑: 새로고침은 중복 집계되지 않음 */}
        <VisitorPing />
      </section>

      {/* 대표 글 */}
      {latest && (
        <section className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {latest.cover_image && (
            <Link href={`/posts/${latest.slug}`}>
              <div className="relative w-full aspect-[16/9]">
                <Image
                  src={getOptimizedImageUrl(latest.cover_image, { width: 1024, quality: 80, format: 'webp' })}
                  alt={latest.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            </Link>
          )}
          <div className="p-5">
            <Link href={`/posts/${latest.slug}`} className="text-xl font-bold">{latest.title}</Link>
            {latest.excerpt && <p className="text-base text-gray-600 mt-2">{latest.excerpt}</p>}
            <p className="text-sm text-gray-500 mt-3">{new Date(latest.created_at).toLocaleDateString('ko-KR')}</p>
          </div>
        </section>
      )}

      {/* 최신 글 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">최신 글</h2>
          <Link href="/posts" className="text-sm font-medium text-gray-600 hover:text-black">
            전체 보기
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="border rounded-lg p-8 text-center space-y-3">
            <p className="text-base text-gray-600">아직 공개된 포스트가 없습니다.</p>
            <Link href="/write" className="inline-flex items-center justify-center border rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
              첫 글 쓰기
            </Link>
          </div>
        ) : (
          <ul className="grid gap-6">
            {recent.map((p) => (
              <PostCard
                key={p.id}
                variant="borderless"
                showExcerpt={true}
                post={{
                  id: p.id,
                  title: p.title,
                  slug: p.slug,
                  excerpt: p.excerpt,
                  cover_image: p.cover_image,
                  content: null,
                  created_at: p.created_at,
                  like_count: null,
                  dislike_count: null,
                }}
              />
            ))}
          </ul>
        )}
      </section>

      {/* 퀵 링크 */}
      <section className="border rounded-lg p-5">
        <h2 className="text-lg font-bold mb-3">빠른 이동</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/posts" className="border rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">포스트</Link>
          <Link href="/write" className="border rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">글 작성</Link>
          <Link href="/rss.xml" className="border rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">RSS</Link>
          <Link href="/atom.xml" className="border rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">Atom</Link>
        </div>
      </section>

      {/* 소개 박스 */}
      <section className="border rounded-lg p-5">
        <h2 className="text-lg font-bold mb-4">소개</h2>
        <div className="flex items-start gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
            <Image
              src="/default-avatar.png" // TODO: 실제 프로필 이미지 경로로 교체
              alt="프로필 이미지"
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="space-y-2">
            <p className="text-base text-gray-700">{TAGLINE}. 라키라키는 담백한 레이아웃으로 글 중심 경험을 제공합니다.</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">
              <SocialLink href="mailto:your-email@example.com" icon={<Mail size={16} />} label="Email" />
              <SocialLink href="https://github.com/your-username" icon={<Github size={16} />} label="GitHub" />
              <SocialLink href="https://your-website.com" icon={<Globe size={16} />} label="Website" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

async function StatsBar() {
  try {
    const res = await fetch('/api/analytics/stats', { next: { revalidate: 10 } });
    if (!res.ok) return null;
    const { today, total } = await res.json();
    return (
      <div className="text-sm text-gray-600 flex items-center gap-3">
        <span>오늘 방문자: <span className="font-medium text-gray-800">{today}</span></span>
        <span>누적 방문자: <span className="font-medium text-gray-800">{total}</span></span>
      </div>
    );
  } catch {
    return null;
  }
}
