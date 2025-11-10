'use client';

import { SITE_NAME } from '@/lib/brand';
import Image from 'next/image';

interface CardPreviewProps {
  platform: 'twitter' | 'facebook';
  title: string;
  url: string;
  imageUrl?: string;
}

export default function CardPreview({ platform, title, url, imageUrl }: CardPreviewProps) {
  const domain = new URL(url).hostname;

  return (
    <div className="w-full max-w-md mx-auto">
      <p className="text-sm font-semibold mb-2 text-gray-600">{platform === 'twitter' ? 'Twitter' : 'Facebook'} 카드 미리보기</p>
      <div className="border rounded-lg overflow-hidden">
        {imageUrl && (
          <div className="relative aspect-[1.91/1] w-full">
            <Image src={imageUrl} alt={title} fill className="object-cover" />
          </div>
        )}
        <div className="p-3 bg-gray-50">
          <p className="text-sm text-gray-500 truncate">{domain}</p>
          <p className="text-base font-semibold truncate">{title}</p>
        </div>
      </div>
    </div>
  );
}