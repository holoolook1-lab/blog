/**
 * 소셜 미디어 링크 카드 컴포넌트
 * SNS 링크 미리보기 및 임베드
 */

import React, { useState, useEffect } from 'react';
import { processSocialLink, type ProcessedLink } from '@/lib/social-media/processor';
import { Link, Play, Image, FileText, User, ExternalLink, Loader2, AlertCircle } from 'lucide-react';

interface SocialLinkCardProps {
  url: string;
  onEmbed?: (html: string) => void;
  onRemove?: () => void;
  className?: string;
  processingTime?: number;
}

export default function SocialLinkCard({ url, onEmbed, onRemove, className = "" }: SocialLinkCardProps) {
  const [processedLink, setProcessedLink] = useState<ProcessedLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);

  useEffect(() => {
    processLink();
  }, [url]);

  const processLink = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await processSocialLink(url, {
        expandShortUrls: true,
        fetchOEmbed: true,
        generateEmbed: true,
        timeout: 8000
      });
      
      setProcessedLink(result);
      
      if (result.status === 'failed') {
        setError(result.error || '링크 처리 실패');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '링크 처리 중 오류 발생');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string | null) => {
    if (!platform) return <Link className="w-4 h-4" />;
    
    switch (platform.toLowerCase()) {
      case 'youtube':
        return <Play className="w-4 h-4 text-red-500" />;
      case 'instagram':
        return <Image className="w-4 h-4 text-pink-500" aria-label="인스타그램" />;
      case 'twitter':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'facebook':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'tiktok':
        return <Play className="w-4 h-4 text-black" />;
      case 'naver tv':
        return <Play className="w-4 h-4 text-green-500" />;
      default:
        return <Link className="w-4 h-4" />;
    }
  };

  const getPlatformColor = (platform: string | null) => {
    if (!platform) return 'bg-gray-100 text-gray-600';
    
    switch (platform.toLowerCase()) {
      case 'youtube':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'instagram':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'twitter':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'facebook':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'tiktok':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'naver tv':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleEmbed = () => {
    if (processedLink?.embedHtml && onEmbed) {
      onEmbed(processedLink.embedHtml);
      setShowEmbed(true);
    }
  };

  const handleRetry = () => {
    processLink();
  };

  if (loading) {
    return (
      <div className={`border rounded-lg p-4 bg-white ${className}`}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border rounded-lg p-4 bg-red-50 border-red-200 ${className}`}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">링크 처리 실패</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
            >
              재시도
            </button>
            {onRemove && (
              <button
                onClick={onRemove}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                제거
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!processedLink) {
    return (
      <div className={`border rounded-lg p-4 bg-gray-50 ${className}`}>
        <div className="flex items-center gap-3">
          <Link className="w-5 h-5 text-gray-400" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">링크 정보를 불러올 수 없습니다</p>
          </div>
        </div>
      </div>
    );
  }

  const { platform, type, title, author, thumbnail, embedHtml } = processedLink;

  return (
    <div className={`border rounded-lg bg-white overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className={`px-4 py-3 border-b ${getPlatformColor(platform)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getPlatformIcon(platform)}
            <span className="text-sm font-medium">
              {platform || '웹사이트'}
              {type && type !== 'unknown' && (
                <span className="ml-1 text-xs opacity-75">
                  ({type === 'video' ? '동영상' : type === 'image' ? '이미지' : type === 'post' ? '게시물' : '프로필'})
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {embedHtml && onEmbed && !showEmbed && (
              <button
                onClick={handleEmbed}
                className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-all flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                임베드
              </button>
            )}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs p-1 hover:bg-white hover:bg-opacity-50 rounded transition-all"
              title="새 창에서 열기"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
            {onRemove && (
              <button
                onClick={onRemove}
                className="text-xs p-1 hover:bg-white hover:bg-opacity-50 rounded transition-all"
                title="제거"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4">
        {thumbnail && (
          <div className="mb-3 rounded-lg overflow-hidden">
            <img
              src={thumbnail}
              alt={title || '썸네일'}
              className="w-full h-32 object-cover"
              loading="lazy"
            />
          </div>
        )}
        
        {title && (
          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
            {title}
          </h4>
        )}
        
        {author && (
          <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
            <User className="w-3 h-3" />
            {author}
          </p>
        )}

        {showEmbed && embedHtml && (
          <div className="mt-3 border rounded-lg overflow-hidden">
            <div dangerouslySetInnerHTML={{ __html: embedHtml }} />
          </div>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
        <div className="flex justify-between items-center">
          <span>처리 시간: {processedLink.processingTime}ms</span>
          <span>상태: {processedLink.status}</span>
        </div>
      </div>
    </div>
  );
}