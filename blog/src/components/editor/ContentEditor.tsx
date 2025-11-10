"use client";
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { useRef } from 'react';

export default function ContentEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const wrap = (left: string, right: string = left) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);
    const next = `${before}${left}${selected}${right}${after}`;
    onChange(next);
    // restore selection roughly
    setTimeout(() => {
      const pos = start + left.length + selected.length + right.length;
      el.selectionStart = el.selectionEnd = pos;
      el.focus();
    }, 0);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="border rounded px-2 py-1" onClick={() => wrap('**')}>굵게</button>
        <button type="button" className="border rounded px-2 py-1" onClick={() => wrap('*')}>기울임</button>
        <button
          type="button"
          className="border rounded px-2 py-1"
          onClick={() => {
            const url = prompt('링크 URL을 입력하세요');
            if (!url) return;
            const el = ref.current;
            if (!el) return;
            const start = el.selectionStart ?? 0;
            const end = el.selectionEnd ?? 0;
            const selected = value.slice(start, end) || '링크텍스트';
            const md = `[${selected}](${url})`;
            const before = value.slice(0, start);
            const after = value.slice(end);
            onChange(`${before}${md}${after}`);
          }}
        >링크</button>
      </div>
      <textarea
        ref={ref}
        className="border rounded w-full p-2 min-h-[180px]"
        placeholder="내용(HTML 또는 Markdown)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div>
        <p className="text-sm text-gray-600">미리보기</p>
        <div className="prose max-w-none border rounded p-3" dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />
      </div>
    </div>
  );
}