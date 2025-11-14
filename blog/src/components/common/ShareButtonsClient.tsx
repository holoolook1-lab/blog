'use client';

import { Facebook, Twitter, Instagram, Share2 } from 'lucide-react';
import { SITE_NAME, TAGLINE } from '@/lib/brand';

export default function ShareButtonsClient() {
  const shareUrl = 'https://' + (process.env.NEXT_PUBLIC_SITE_URL || 'rakiraki.blog');

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: SITE_NAME,
        text: TAGLINE,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('URL이 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="flex items-center gap-4 pt-4">
      <span className="text-sm font-medium text-gray-400">공유하기</span>
      <div className="flex gap-3">
        <a 
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(SITE_NAME + ' - ' + TAGLINE)}&url=${encodeURIComponent(shareUrl)}`}
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          aria-label="Twitter"
          title="Twitter"
        >
          <Twitter size={20} className="text-gray-400 hover:text-blue-400 transition-colors duration-200" />
        </a>
        <a 
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          aria-label="Facebook"
          title="Facebook"
        >
          <Facebook size={20} className="text-gray-400 hover:text-blue-500 transition-colors duration-200" />
        </a>
        <a 
          href={`https://www.instagram.com`}
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          aria-label="Instagram"
          title="Instagram"
        >
          <Instagram size={20} className="text-gray-400 hover:text-pink-400 transition-colors duration-200" />
        </a>
        <button
          onClick={handleShare}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-200 hover:scale-110"
          aria-label="공유하기"
          title="공유하기"
        >
          <Share2 size={20} className="text-gray-400 hover:text-white transition-colors duration-200" />
        </button>
      </div>
    </div>
  );
}