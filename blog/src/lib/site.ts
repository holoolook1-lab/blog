export function buildPostPath(slug: string): string {
  const s = String(slug || '');
  return `/posts/${encodeURIComponent(s)}`;
}

export function buildPostUrl(base: string, slug: string): string {
  const origin = String(base || '').replace(/\/+$/, '');
  return `${origin}${buildPostPath(slug)}`;
}

