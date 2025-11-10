"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import CoverUpload from '@/components/editor/CoverUpload';
import { sanitizeHtml } from '@/lib/utils/sanitize';
import ActionToast from '@/components/ui/ActionToast';

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-600">에디터 로딩 중…</p>,
});

export default function WritePage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [cover, setCover] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [savedDraft, setSavedDraft] = useState<{ title?: string; slug?: string; content?: string; cover?: string | null } | null>(null);

  // detect draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem('draft:write');
      if (raw) {
        const d = JSON.parse(raw);
        setSavedDraft({ title: d.title || '', slug: d.slug || '', content: d.content || '', cover: d.cover || null });
        setHasDraft(true);
      }
    } catch {}
  }, []);

  // autosave (3초 간격)
  useEffect(() => {
    const h = setInterval(() => {
      try {
        localStorage.setItem('draft:write', JSON.stringify({ title, slug, content, cover }));
        const now = new Date();
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        const ss = now.getSeconds().toString().padStart(2, '0');
        setStatus(`자동저장됨 ${hh}:${mm}:${ss}`);
      } catch {}
    }, 3000);
    return () => clearInterval(h);
  }, [title, slug, content, cover]);

  const makeExcerpt = (html: string) => {
    const safe = sanitizeHtml(html || '');
    const text = safe.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.slice(0, 160);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setToast(null);
    // 기본 검증
    const t = (title || '').trim();
    const s = (slug || '').trim();
    if (!t) { setToast({ type: 'error', message: '제목을 입력하세요' }); return; }
    // 슬러그 형식: 소문자/숫자/하이픈, 앞뒤 하이픈 금지, 연속 하이픈 금지, 3~64자
    const isValidSlug = (x: string) => {
      const v = x.toLowerCase();
      if (v.length < 3 || v.length > 64) return false;
      if (!/^[a-z0-9-]+$/.test(v)) return false;
      if (/--/.test(v)) return false;
      if (/^-|-$/.test(v)) return false;
      return true;
    };
    if (!isValidSlug(s)) { setToast({ type: 'error', message: '슬러그는 소문자/숫자/하이픈, 3~64자이며 앞뒤/연속 하이픈 불가' }); return; }
    setIsSubmitting(true);
    // 중복 확인은 서버에서 처리(고유 제약 조건)하고 에러 메시지로 안내
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t, slug: s, content, excerpt: makeExcerpt(content), cover_image: cover, published: true }),
    });
    const json = await res.json();
    if (!res.ok) setToast({ type: 'error', message: json.error || '오류' });
    else {
      setToast({ type: 'success', message: '작성 완료, 글로 이동합니다' });
      try {
        localStorage.removeItem('draft:write');
      } catch {}
      setTimeout(() => {
        window.location.href = `/posts/${s}`;
      }, 500);
    }
    setIsSubmitting(false);
  };

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">글 작성</h1>
        {status && <span className="text-xs text-gray-500">{status}</span>}
      </div>
      {hasDraft && (
        <div className="border rounded p-3 bg-yellow-50 text-sm flex items-center justify-between">
          <span>임시저장된 초안이 있습니다. 복원하시겠습니까?</span>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 border rounded bg-white hover:bg-gray-50"
              onClick={() => {
                if (savedDraft) {
                  setTitle(savedDraft.title || '');
                  setSlug(savedDraft.slug || '');
                  setContent(savedDraft.content || '');
                  setCover(savedDraft.cover || null);
                }
                setHasDraft(false);
                setToast({ type: 'success', message: '초안을 복원했습니다.' });
                setTimeout(() => setToast(null), 2500);
              }}
            >복원</button>
            <button
              className="px-2 py-1 border rounded hover:bg-gray-50"
              onClick={() => {
                setHasDraft(false);
              }}
            >무시</button>
          </div>
        </div>
      )}
      <form
        className="space-y-3"
        onSubmit={onSubmit}
        onKeyDown={(e) => {
          if (e.ctrlKey && e.key === 'Enter' && !isSubmitting) {
            e.preventDefault();
            onSubmit(e as any);
          }
        }}
      >
        <label className="block text-sm font-medium mb-1" htmlFor="title">제목</label>
        <input id="title" className="border rounded w-full p-2" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <label className="block text-sm font-medium mt-3 mb-1" htmlFor="slug">슬러그</label>
        <input
          id="slug"
          className="border rounded w-full p-2"
          placeholder="슬러그(소문자/숫자/하이픈)"
          aria-describedby="slug-help"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <p id="slug-help" className="text-xs text-gray-500">예: my-first-post · 3~64자, 앞뒤/연속 하이픈 불가</p>
        <div>
          <p className="text-sm text-gray-600 mb-1">커버 이미지</p>
          <CoverUpload value={cover} onChange={setCover} />
        </div>
        <RichEditor value={content} onChange={setContent} />
        <button className="bg-black text-white px-3 py-1 rounded disabled:opacity-60" type="submit" disabled={isSubmitting}>{isSubmitting ? '작성 중...' : '작성'}</button>
        <p className="text-xs text-gray-500">Ctrl+Enter로 빠르게 작성할 수 있습니다.</p>
      </form>
      {toast && <ActionToast toast={{ type: toast.type, message: toast.message }} onClose={() => setToast(null)} />}
    </main>
  );
}
