'use client';

import { useMemo } from 'react';
import { processContentUrls } from '@/lib/utils/contentProcessor';

type Props = { title: string; content: string };

export default function PostDetail({ title, content }: Props) {
  const processedContent = useMemo(() => {
    return processContentUrls(content);
  }, [content]);

  return (
    <article className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div 
        className="prose max-w-none" 
        dangerouslySetInnerHTML={{ __html: processedContent.html }} 
      />
    </article>
  );
}