"use client";
import { useEffect, useRef, useState, useTransition } from 'react';
import { outlineButtonSmall } from '@/lib/styles/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function PostsSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState<string>(params.get('q') || '');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;
      const key = e.key.toLowerCase();
      if (!isTyping && !e.ctrlKey && !e.metaKey && !e.altKey && (key === 's' || key === '/')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams(params.toString());
    if (q.trim()) {
      sp.set('q', q.trim());
      sp.set('page', '1');
    } else {
      sp.delete('q');
      sp.set('page', '1');
    }
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`);
    });
    try {
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    } catch {}
  };

  const onClear = () => {
    setQ('');
    const sp = new URLSearchParams(params.toString());
    sp.delete('q');
    sp.set('page', '1');
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`);
    });
    try {
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    } catch {}
  };

  // 입력 디바운스로 자동 검색
  useEffect(() => {
    const current = params.get('q') || '';
    const handle = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (q.trim()) {
        sp.set('q', q.trim());
        sp.set('page', '1');
      } else {
        sp.delete('q');
        sp.set('page', '1');
      }
      const next = `${pathname}?${sp.toString()}`;
      // 현재 쿼리와 동일하면 푸시하지 않음
      if (q.trim() === current.trim()) return;
      router.push(next);
    }, 350);
    return () => clearTimeout(handle);
  }, [q]);

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2" role="search" aria-busy={isPending} aria-describedby="search-hint search-submit-hint">
      <label htmlFor="search" className="text-sm text-gray-700">검색</label>
      <input
        id="search"
        ref={inputRef}
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={require('next-intl').useTranslations('posts')('searchPlaceholder')}
        className="flex-1 border rounded px-3 py-1 text-sm"
        aria-label="포스트 검색"
        aria-describedby="search-hint"
      />
      <button type="submit" className={outlineButtonSmall} disabled={isPending} aria-describedby="search-submit-hint" aria-busy={isPending}>찾기</button>
      {params.get('q') && (
        <button type="button" className={outlineButtonSmall} onClick={onClear} aria-label="검색 초기화" disabled={isPending} aria-busy={isPending}>초기화</button>
      )}
      <p id="search-hint" className="sr-only">S 또는 / 키로 검색창에 포커스됩니다.</p>
      <p id="search-submit-hint" className="sr-only">검색을 누르면 목록이 업데이트됩니다.</p>
    </form>
  );
}
