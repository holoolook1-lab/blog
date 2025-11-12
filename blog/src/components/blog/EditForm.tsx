"use client";
import { useState } from 'react';
import dynamic from 'next/dynamic';
import CoverUpload from '@/components/editor/CoverUpload';
import ActionToast from '@/components/ui/ActionToast';
import { supabase } from '@/lib/supabase/client';
import { isValidSlug } from '@/lib/slug';
import { outlineButtonSmall } from '@/lib/styles/ui';

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  cover_image: string | null;
  published: boolean;
  heading?: string | null;
};

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-600">에디터 로딩 중…</p>,
});

export default function EditForm({ initial }: { initial: Post }) {
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [content, setContent] = useState(initial.content);
  const [cover, setCover] = useState<string | null>(initial.cover_image);
  const [published, setPublished] = useState<boolean>(initial.published);
  const HEADINGS = ['자유게시판','키움캐치','sns','유머','유용한정보','개발','블로그','기타'] as const;
  const [heading, setHeading] = useState<string>(initial.heading || '');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const originalPublished = initial.published;

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    // 기본 검증
    const t = (title || '').trim();
    const s = (slug || '').trim().toLowerCase();
    if (!t) { setToast({ type: 'error', message: '제목을 입력하세요' }); return; }
    const isValidSlug = (x: string) => {
      if (x.length < 3 || x.length > 64) return false;
      if (!/^[a-z0-9-]+$/.test(x)) return false;
      if (/--/.test(x)) return false;
      if (/^-|-$/.test(x)) return false;
      return true;
    };
    if (!isValidSlug(s)) { setToast({ type: 'error', message: '슬러그는 한글/영문/숫자/하이픈, 3~64자이며 앞뒤/연속 하이픈 불가' }); return; }
    if (published !== originalPublished) {
      const changingTo = published ? '공개' : '비공개';
      const ok = confirm(`발행 상태를 "${changingTo}"로 변경하시겠습니까?`);
      if (!ok) return;
    }
    // 슬러그 중복 확인 (본인 글 제외)
    if (s !== initial.slug) {
      const { data: exists } = await supabase.from('posts').select('id').eq('slug', s).neq('id', initial.id).limit(1);
      if (exists && exists.length) {
        setToast({ type: 'error', message: '이미 사용 중인 슬러그입니다' });
        return;
      }
    }
    const res = await fetch(`/api/posts/${initial.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t, slug: s, content, cover_image: cover, published, heading: heading || null }),
    });
    const json = await res.json();
    if (!res.ok) setToast({ type: 'error', message: json.error || '업데이트 오류' });
    else {
      setToast({ type: 'success', message: '업데이트 완료, 글로 이동합니다' });
      setTimeout(() => {
    window.location.href = `/posts/${encodeURIComponent(slug)}`;
      }, 600);
    }
  };

  const onDelete = async () => {
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    setToast(null);
    const res = await fetch(`/api/posts/${initial.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) setToast({ type: 'error', message: json.error || '삭제 오류' });
    else {
      setToast({ type: 'success', message: '삭제 완료' });
      setTimeout(() => {
        window.location.href = '/posts';
      }, 500);
    }
  };

  return (
    <form className="space-y-3" onSubmit={onUpdate}>
      <input className="border rounded w-full p-2" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="border rounded w-full p-2" placeholder="슬러그" value={slug} onChange={(e) => setSlug(e.target.value)} />
      <div>
        <p className="text-sm text-gray-600 mb-1">커버 이미지</p>
        <CoverUpload value={cover} onChange={setCover} />
      </div>
      <div>
        <label className="text-sm text-gray-700">머리말(카테고리)</label>
        <select className="border rounded w-full p-2 mt-1" value={heading} onChange={(e) => setHeading(e.target.value)}>
          <option value="">선택 없음</option>
          {HEADINGS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700">발행</label>
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
      </div>
      <RichEditor value={content} onChange={setContent} />
      <div className="flex gap-2">
  <button className={outlineButtonSmall} type="submit">업데이트</button>
        <button className="bg-red-600 text-white px-3 py-1 rounded" type="button" onClick={onDelete}>삭제</button>
      </div>
      {toast && <ActionToast toast={{ type: toast.type, message: toast.message }} onClose={() => setToast(null)} />}
    </form>
  );
}
