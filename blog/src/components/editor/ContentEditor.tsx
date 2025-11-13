"use client";
import { sanitizeHtml } from '@/lib/utils/sanitize';
import { useRef, useState } from 'react';

export default function ContentEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

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
      <div className="flex flex-wrap gap-1">
        <button type="button" className="border rounded px-1 py-0.5 text-xs" onClick={() => wrap('**')}>굵게</button>
        <button type="button" className="border rounded px-1 py-0.5 text-xs" onClick={() => wrap('*')}>기울임</button>
        <button
          type="button"
          className="border rounded px-1 py-0.5 text-xs"
          onClick={() => setShowLinkInput((v) => !v)}
        >링크</button>
      </div>
      <textarea
        ref={ref}
        className="border rounded w-full p-2 min-h-[180px]"
        placeholder="내용(HTML 또는 Markdown)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {showLinkInput && (
        <div className="flex items-center gap-2 mt-2">
          <input
            type="url"
            className="border rounded px-2 py-2 w-full md:w-96"
            placeholder="링크 주소를 입력하세요 (예: https://example.com)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <button
            type="button"
            className="border rounded px-2 py-1"
            onClick={() => {
              const url = linkUrl.trim();
              const el = ref.current;
              if (!url || !el) { setShowLinkInput(false); return; }
              const start = el.selectionStart ?? 0;
              const end = el.selectionEnd ?? 0;
              const selected = value.slice(start, end) || '링크텍스트';
              const md = `[${selected}](${url})`;
              const before = value.slice(0, start);
              const after = value.slice(end);
              onChange(`${before}${md}${after}`);
              setLinkUrl('');
              setShowLinkInput(false);
              setTimeout(() => { el.focus(); }, 0);
            }}
          >삽입</button>
          <button type="button" className="border rounded px-2 py-1" onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}>취소</button>
        </div>
      )}
      <div>
        <p className="text-sm text-gray-600">미리보기</p>
        <div className="prose max-w-none border rounded p-3" dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />
      </div>
    </div>
  );
}
