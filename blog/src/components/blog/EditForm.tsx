"use client";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ActionToast from '@/components/ui/ActionToast';
import { supabase } from '@/lib/supabase/client';
import { isValidSlug, slugifyKorean } from '@/lib/slug';
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
  const [slugEdited, setSlugEdited] = useState(false);
  const [content, setContent] = useState(initial.content);
  const [cover] = useState<string | null>(initial.cover_image);
  const [published, setPublished] = useState<boolean>(initial.published);
  const HEADINGS = ['자유게시판','키움캐치','sns','유머','유용한정보','개발','블로그','기타'] as const;
  const [heading, setHeading] = useState<string>(initial.heading || '');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const originalPublished = initial.published;
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 제목 변경 시 슬러그 자동 생성(사용자가 직접 수정하지 않은 경우)
  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugifyKorean(title));
    }
  }, [title, slugEdited]);

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    // 기본 검증
    const t = (title || '').trim();
    const s = (slug || '').trim().toLowerCase();
    if (!t) { setToast({ type: 'error', message: '제목을 입력하세요' }); return; }
    if (!isValidSlug(s)) { setToast({ type: 'error', message: '슬러그는 한글/영문/숫자/하이픈, 3~64자이며 앞뒤/연속 하이픈 불가' }); return; }
    if (published !== originalPublished) {
      const changingTo = published ? '공개' : '비공개';
      const ok = confirm(`발행 상태를 "${changingTo}"로 변경하시겠습니까?`);
      if (!ok) return;
    }
    try {
      setIsUpdating(true);
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
    } catch (err) {
      setToast({ type: 'error', message: '업데이트 중 오류가 발생했습니다' });
    } finally {
      setIsUpdating(false);
    }
  };

  const onDelete = async () => {
    setToast(null);
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/posts/${initial.id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) setToast({ type: 'error', message: json.error || '삭제 오류' });
      else {
        setToast({ type: 'success', message: '삭제 완료' });
        setTimeout(() => {
          window.location.href = '/posts';
        }, 500);
      }
    } catch (err) {
      setToast({ type: 'error', message: '삭제 중 오류가 발생했습니다' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form className="space-y-3" onSubmit={onUpdate}>
      <label className="block text-sm font-medium mb-1" htmlFor="title">제목</label>
      <input id="title" className="border rounded w-full p-2" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
      {/* 슬러그: 기본은 자동 생성, 필요 시 수동 편집 */}
      <div className="mt-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">슬러그: <span className="font-medium text-gray-800 break-all">{slug || '(자동 생성)'}</span></p>
          <button type="button" className="px-2 py-1 border rounded text-xs hover:bg-gray-50" onClick={() => setSlugEdited(true)}>슬러그 수정</button>
        </div>
        {slugEdited && (
          <>
            <label className="block text-xs text-gray-700 mt-2" htmlFor="slug">슬러그(제목에서 자동 생성, 직접 수정 가능)</label>
            <input id="slug" className="border rounded w-full p-2" placeholder="슬러그(한글/영문/숫자/하이픈)" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <p className="text-xs text-gray-500">3~64자, 앞뒤/연속 하이픈 불가</p>
          </>
        )}
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
        <label className="text-sm text-gray-700" htmlFor="edit-published">발행</label>
        <input id="edit-published" type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} aria-describedby="edit-published-hint" />
        <p id="edit-published-hint" className="sr-only">공개/비공개 상태를 변경할 때 확인 대화 상자가 나타납니다.</p>
      </div>
      <RichEditor value={content} onChange={setContent} />
      <div className="flex gap-2">
        <button className={outlineButtonSmall} type="submit" disabled={isUpdating} aria-busy={isUpdating}>{isUpdating ? '업데이트 중...' : '업데이트'}</button>
        <button className="bg-red-600 text-white px-3 py-1 rounded disabled:opacity-60" type="button" onClick={onDelete} disabled={isDeleting} aria-busy={isDeleting}>{isDeleting ? '삭제 중...' : '삭제'}</button>
      </div>
      {toast && <ActionToast toast={{ type: toast.type, message: toast.message }} onClose={() => setToast(null)} />}
    </form>
  );
}
