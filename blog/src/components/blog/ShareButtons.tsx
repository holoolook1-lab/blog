'use client';

import React, { useState } from 'react';
import { Link2, Twitter, Facebook, Linkedin, Share2, Eye, MessageSquare } from 'lucide-react';
import ActionToast from '@/components/ui/ActionToast';
import ShareModal from './ShareModal';

export default function ShareButtons({ url, title }: { url: string; title?: string }) {
  const { useTranslations } = require('next-intl');
  const t = useTranslations('share');
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
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
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
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200" role="group" aria-label={t('share')}>
      {toast && <ActionToast toast={toast} onClose={() => setToast(null)} />}
      
      {/* 공유하기 라벨 */}
      <div className="flex items-center gap-2">
        <Share2 size={16} className="text-neutral-600" aria-hidden="true" />
        <span className="text-sm font-semibold text-neutral-700">공유하기</span>
      </div>

      {/* 공유 버튼 그룹 */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 미리보기 버튼 */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
          aria-label={t('preview')}
          title={t('preview')}
          aria-expanded={isModalOpen}
          aria-controls="share-dialog"
        >
          <Eye size={16} className="text-current" aria-hidden="true" focusable="false" />
          <span className="text-sm font-medium hidden sm:inline">미리보기</span>
        </button>

        {/* 소셜 미디어 공유 버튼들 */}
        {shareOptions.map((option) => (
          <a
            key={option.name}
            href={option.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            aria-label={option.name}
            title={option.name}
          >
            <div className="text-current">
              {React.cloneElement(option.icon, { size: 16 })}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{option.name}</span>
          </a>
        ))}

        {/* 카카오톡 공유 */}
        {kakaoKey && (
          <button
            onClick={shareKakao}
            className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FEE500] border border-[#FEE500] text-[#3C1E1E] hover:bg-[#FDD800] hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:ring-offset-1 shadow-sm"
            aria-label={t('kakao')}
            title={t('kakao')}
          >
            <MessageSquare size={16} className="text-current" aria-hidden="true" focusable="false" />
            <span className="text-sm font-medium hidden sm:inline">카카오톡</span>
          </button>
        )}

        {/* 네이티브 공유 (모바일) */}
        <button
          onClick={nativeShare}
          className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-800 text-white hover:bg-neutral-900 hover:border-neutral-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-1 md:hidden"
          aria-label={t('native')}
          title={t('native')}
        >
          <Share2 size={16} className="text-current" aria-hidden="true" focusable="false" />
          <span className="text-sm font-medium">공유</span>
        </button>

        {/* URL 복사 */}
        <button
          onClick={copyToClipboard}
          className="group relative flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-neutral-300 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400 hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
          aria-label={t('copy')}
          title={t('copy')}
        >
          <Link2 size={16} className="text-current" aria-hidden="true" focusable="false" />
          <span className="text-sm font-medium hidden sm:inline">복사</span>
        </button>
      </div>

      {/* 공유 모달 */}
      {isModalOpen && <ShareModal url={url} title={title || ''} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
