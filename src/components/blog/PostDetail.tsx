'use client';

import { useMemo, useState, useEffect } from 'react';
import { processTextWithSocialLinks, type ProcessedLink } from '@/lib/social-media/processor';
import { processContentUrls } from '@/lib/utils/contentProcessor';

type Props = { title: string; content: string };
type ProcessedContent = { html: string; links: ProcessedLink[] };

export default function PostDetail({ title, content }: Props) {
  const [processedContent, setProcessedContent] = useState<ProcessedContent>({ html: content, links: [] });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function processContent() {
      if (!content) return;
      
      setIsProcessing(true);
      try {
        // 새로운 소셜 미디어 프로세서 사용
        const result = await processTextWithSocialLinks(content, {
          expandShortUrls: true,
          fetchOEmbed: true,
          generateEmbed: true,
          timeout: 10000
        });
        setProcessedContent({ html: result.text, links: result.links });
      } catch (error) {
        console.error('소셜 미디어 처리 오류:', error);
        // 오류 발생 시 기존 처리기로 대체
        const fallbackResult = processContentUrls(content);
        setProcessedContent({ html: fallbackResult.html, links: [] });
      } finally {
        setIsProcessing(false);
      }
    }

    processContent();
  }, [content]);

  if (isProcessing) {
    return (
      <article className="max-w-3xl mx-auto p-4 space-y-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="prose max-w-none">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-secondary-600">미디어 처리 중...</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div 
        className="prose max-w-none" 
        dangerouslySetInnerHTML={{ __html: processedContent.html }} 
      />
      
      {/* 처리된 링크 통계 (디버깅용) */}
      {processedContent.links.length > 0 && (
        <div className="mt-4 p-3 bg-secondary-50 rounded-lg border border-secondary-200">
          <p className="text-sm text-secondary-600">
            {processedContent.links.filter(link => link.status === 'success').length}개의 미디어 링크가 처리되었습니다.
          </p>
        </div>
      )}
    </article>
  );
}
