import { ImageResponse } from 'next/og';
import { getServerSupabase } from '@/lib/supabase/server';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Params = { params: Promise<{ slug: string }> };

export default async function TwitterImage({ params }: Params) {
  let title = '포스트';
  let excerpt = '';
  try {
    const supabase = await getServerSupabase();
    if (supabase) {
      const { slug } = await params;
      const { data } = await supabase
        .from('posts')
        .select('title, excerpt')
        .eq('slug', slug)
        .single();
      title = data?.title || title;
      excerpt = data?.excerpt || '';
    }
  } catch {}

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || '내 블로그';

  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          padding: 64,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: '#111827', lineHeight: 1.15 }}>{title}</div>
          {excerpt && (
            <div style={{ fontSize: 28, color: '#4b5563', lineHeight: 1.4 }}>{excerpt}</div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 24, color: '#6b7280' }}>{siteName}</div>
          <div style={{ fontSize: 24, color: '#9ca3af' }}>blog</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
