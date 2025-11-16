"use client";
import { useEffect, useRef, useState } from 'react';

type Props = {
  type: 'iframe' | 'file';
  src: string;
  className?: string;
  muted?: boolean;
  threshold?: number;
  rootMargin?: string;
};

const toAutoplaySrc = (src: string, muted: boolean = true) => {
  try {
    const u = new URL(src);
    const host = u.hostname.replace(/^www\./, '');
    const qs = new URLSearchParams(u.search);
    
    if (host.includes('youtube.com')) {
      // YouTube URL을 embed 형식으로 변환
      const videoId = qs.get('v') || u.pathname.split('/').pop();
      if (videoId) {
        const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
        const embedQs = new URLSearchParams();
        embedQs.set('autoplay', '1');
        embedQs.set('mute', muted ? '1' : '0');
        embedQs.set('playsinline', '1');
        embedQs.set('rel', '0'); // 관련 동영상 표시 안 함
        embedQs.set('modestbranding', '1'); // YouTube 로고 최소화
        embedUrl.search = embedQs.toString();
        return embedUrl.toString();
      }
    } else if (host.includes('vimeo.com')) {
      qs.set('autoplay', '1');
      qs.set('muted', muted ? '1' : '0');
    } else if (host.includes('dailymotion.com')) {
      qs.set('autoplay', '1');
      qs.set('mute', muted ? '1' : '0');
    } else if (host.includes('twitch.tv')) {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
      let parentHost = 'localhost';
      try { parentHost = new URL(siteUrl).hostname; } catch {}
      if (!qs.get('parent')) qs.set('parent', parentHost);
      qs.set('autoplay', 'true');
      qs.set('muted', muted ? 'true' : 'false');
    } else if (host.includes('facebook.com')) {
      // Facebook video plugin
      qs.set('autoplay', '1');
      // mute 파라미터는 공식 지원하지 않아 무시
    } else if (host.includes('naver.com')) {
      qs.set('autoplay', 'true');
      // mute 파라미터 없음
    } else if (host.includes('tiktok.com')) {
      // no-op
    }
    u.search = `?${qs.toString()}`;
    return u.toString();
  } catch {
    return src;
  }
};

export default function AutoPlayEmbed({ type, src, className, muted = true, threshold, rootMargin }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeSrc, setActiveSrc] = useState<string>('');

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isMobile = typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false;
    const th = typeof threshold === 'number' ? threshold : (isMobile ? 0.15 : 0.25);
    const rm = typeof rootMargin === 'string' ? rootMargin : (isMobile ? '100px 0px' : '0px');
    const observer = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        if (e.isIntersecting) {
          if (type === 'iframe') {
            setActiveSrc(toAutoplaySrc(src, muted));
          } else {
            const v = videoRef.current;
            if (v) {
              try {
                v.muted = muted;
                v.play().catch(() => {});
              } catch {}
            }
          }
        } else {
          if (type === 'iframe') {
            setActiveSrc('about:blank');
          } else {
            const v = videoRef.current;
            if (v) {
              try { v.pause(); } catch {}
            }
          }
        }
      },
      { threshold: th, rootMargin: rm }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [type, src, muted, threshold, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {type === 'iframe' ? (
        <iframe
          src={activeSrc || 'about:blank'}
          title="Embedded video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
          sandbox="allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <video ref={videoRef} src={src} controls preload="metadata" playsInline muted={muted} className="absolute inset-0 w-full h-full" />
      )}
    </div>
  );
}
