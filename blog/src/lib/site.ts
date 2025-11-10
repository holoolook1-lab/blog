export type PublicSiteMeta = {
  url: string;
  name: string;
  description: string;
};

export function getPublicSiteMeta(): PublicSiteMeta {
  const url = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const name = process.env.NEXT_PUBLIC_SITE_NAME || '블로그';
  const description = process.env.NEXT_PUBLIC_SITE_DESCRIPTION || '';
  return { url, name, description };
}

