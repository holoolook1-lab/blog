import { ImageResponse } from 'next/og';
import { SITE_NAME, TAGLINE } from '@/lib/brand';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: size.width,
          height: size.height,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 64,
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 72,
              background: '#111827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            라
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 64, fontWeight: 800, color: '#111827' }}>{SITE_NAME}</div>
            <div style={{ fontSize: 28, color: '#4b5563' }}>{TAGLINE}</div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}