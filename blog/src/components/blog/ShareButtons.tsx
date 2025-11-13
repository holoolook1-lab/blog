'use client';

import { useState } from 'react';
import { Link, Twitter, Facebook, Linkedin, Share2, Eye, MessageSquare } from 'lucide-react';
import ActionToast from '@/components/ui/ActionToast';
import ShareModal from './ShareModal';

export default function ShareButtons({ url, title }: { url: string; title?: string }) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || '');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kakaoReady, setKakaoReady] = useState(false);

  // Kakao SDK 로드 (환경변수 키가 있을 때만)
  const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (typeof window !== 'undefined' && kakaoKey && !kakaoReady) {
    const ensureKakao = async () => {
      if ((window as any).Kakao?.isInitialized?.()) { setKakaoReady(true); return; }
      await new Promise<void>((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Kakao SDK 로드 실패'));
        document.head.appendChild(s);
      });
      try {
        (window as any).Kakao?.init?.(kakaoKey);
        setKakaoReady(true);
      } catch (e) {
        console.warn('Kakao 초기화 실패:', e);
      }
    };
    // 한 번만 시도
    setTimeout(() => { void ensureKakao(); }, 0);
  }

  const shareOptions = [
    {
      name: 'Twitter',
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      icon: <Twitter size={20} aria-hidden="true" focusable="false" />,
    },
    {
      name: 'Facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <Facebook size={20} aria-hidden="true" focusable="false" />,
    },
    {
      name: 'LinkedIn',
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      icon: <Linkedin size={20} aria-hidden="true" focusable="false" />,
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setToast({ type: 'success', message: 'URL이 복사되었습니다.' });
    } catch (err) {
      setToast({ type: 'error', message: 'URL 복사에 실패했습니다.' });
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  };

  const nativeShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ url, title });
        setToast({ type: 'success', message: '네이티브 공유가 완료되었습니다.' });
      } else {
        setToast({ type: 'error', message: '현재 브라우저에서 네이티브 공유를 지원하지 않습니다.' });
      }
    } catch (err) {
      // 사용자가 공유를 취소한 경우 등 에러를 조용히 처리
      setToast({ type: 'error', message: '공유를 진행할 수 없습니다.' });
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  };

  const shareKakao = () => {
    try {
      const Kakao = (window as any).Kakao;
      if (!kakaoKey || !Kakao || !Kakao.Share) {
        setToast({ type: 'error', message: '카카오 공유를 사용할 수 없습니다.' });
      } else {
        Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: title || '공유',
            description: '라키라키 블로그',
            imageUrl: `${url.replace(/\/posts\/.*$/, '')}/opengraph-image`,
            link: { webUrl: url, mobileWebUrl: url },
          },
          buttons: [
            { title: '글 보기', link: { webUrl: url, mobileWebUrl: url } },
          ],
        });
      }
    } catch (e) {
      setToast({ type: 'error', message: '카카오 공유에 실패했습니다.' });
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div className="flex items-center gap-1" role="group" aria-label="공유 옵션">
      {toast && <ActionToast toast={toast} onClose={() => setToast(null)} />}
      <span className="text-xs font-medium">공유하기:</span>
      <button
        onClick={() => setIsModalOpen(true)}
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black min-w-[44px] min-h-[44px]"
        aria-label="소셜 공유 미리보기"
        title="소셜 공유 미리보기"
        aria-expanded={isModalOpen}
        aria-controls="share-dialog"
      >
        <Eye size={16} aria-hidden="true" focusable="false" />
      </button>
      {shareOptions.map((option) => (
        <a
          key={option.name}
          href={option.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black min-w-[44px] min-h-[44px]"
          aria-label={`${option.name}에 공유`}
          title={`${option.name}에 공유`}
        >
          {option.icon}
        </a>
      ))}
      {kakaoKey && (
        <button
          onClick={shareKakao}
          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black min-w-[44px] min-h-[44px]"
          aria-label="카카오톡 공유"
          title="카카오톡 공유"
        >
          <MessageSquare size={16} aria-hidden="true" focusable="false" />
        </button>
      )}
      <button
        onClick={nativeShare}
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black min-w-[44px] min-h-[44px]"
        aria-label="네이티브 공유"
        title="네이티브 공유"
      >
        <Share2 size={16} aria-hidden="true" focusable="false" />
      </button>
      <button
        onClick={copyToClipboard}
        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black min-w-[44px] min-h-[44px]"
        aria-label="URL 복사"
        title="URL 복사"
      >
        <Link size={16} aria-hidden="true" focusable="false" />
      </button>
      {isModalOpen && <ShareModal url={url} title={title || ''} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
