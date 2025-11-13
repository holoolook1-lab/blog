import { SITE_NAME, TAGLINE } from './brand';

export function buildPostPath(slug: string): string {
  const s = String(slug || '');
  return `/posts/${encodeURIComponent(s)}`;
}

export function buildPostUrl(base: string, slug: string): string {
  const origin = String(base || '').replace(/\/+$/, '');
  return `${origin}${buildPostPath(slug)}`;
}

// 공개 환경에서 사용할 사이트 메타데이터(기본값 포함)
export function getPublicSiteMeta(): { url: string; name: string; description: string } {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const url = String(rawUrl || '').replace(/\/+$/, '');
  const name = process.env.NEXT_PUBLIC_SITE_NAME || SITE_NAME;
  const description = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || TAGLINE;
  return { url, name, description };
}

// 임의 경로에 대한 표준 Canonical URL 생성
export function buildCanonicalUrl(path: string): string {
  const { url } = getPublicSiteMeta();
  const p = String(path || '');
  const normalized = p.startsWith('/') ? p : `/${p}`;
  return `${url}${normalized}`;
}
