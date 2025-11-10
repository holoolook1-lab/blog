'use client';

import { X } from 'lucide-react';
import CardPreview from './CardPreview';

interface ShareModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function ShareModal({ url, title, onClose }: ShareModalProps) {
  const ogImageUrl = `${url.replace(/\/posts\/.*/, '')}/opengraph-image`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">소셜 공유 미리보기</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-6">
          <CardPreview platform="twitter" title={title} url={url} imageUrl={ogImageUrl} />
          <CardPreview platform="facebook" title={title} url={url} imageUrl={ogImageUrl} />
        </div>
      </div>
    </div>
  );
}