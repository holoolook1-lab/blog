"use client";
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { sanitizeHtml } from '@/lib/utils/sanitize';
// 슬러그는 서버에서 자동 생성되므로 클라이언트에서 처리하지 않습니다.
import ActionToast from '@/components/ui/ActionToast';
import { supabase } from '@/lib/supabase/client';
import { outlineButtonSmall } from '@/lib/styles/ui';
import { initializeLocalTestData } from '@/lib/local-test-data';

const RichEditor = dynamic(() => import('@/components/editor/RichEditor'), {
  ssr: false,
  loading: () => <p className="text-sm text-gray-600">에디터 로딩 중…</p>,
});

export default function WritePage() {
  // 로컬 테스트 데이터 초기화
  useEffect(() => {
    initializeLocalTestData();
  }, []);

  // 로그인 가드: 미로그인 시 로그인 페이지로 이동
  useEffect(() => {
    let alive = true;
    supabase.auth.getUser()
      .then(({ data }: { data: { user: any } }) => {
        if (alive && !data.user) {
          window.location.href = '/login?redirect=/write';
        }
      })
      .catch(() => {
        if (alive) {
          window.location.href = '/login?redirect=/write';
        }
      });
    return () => { alive = false; };
  }, []);
  const [title, setTitle] = useState('');
  // 슬러그 입력 제거: 서버 자동 생성
  const [content, setContent] = useState('');
  const [cover, setCover] = useState<string | null>(null);
  // 링크 미리보기 상태
  const [linkPreview, setLinkPreview] = useState<{ url: string; title?: string; description?: string; image?: string } | null>(null);
  const [linkLoading, setLinkLoading] = useState<boolean>(false);
  const HEADINGS = ['자유게시판','키움캐치','sns','유머','유용한정보','개발','블로그','기타'] as const;
  const [heading, setHeading] = useState<string>('');
  const [status, setStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [savedDraft, setSavedDraft] = useState<{ title?: string; content?: string; cover?: string | null; heading?: string } | null>(null);

  // detect draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem('draft:write');
      if (raw) {
        const d = JSON.parse(raw);
        setSavedDraft({ title: d.title || '', content: d.content || '', cover: d.cover || null, heading: d.heading || '' });
        setHasDraft(true);
      }
    } catch {}
  }, []);

  // autosave (3초 간격)
  useEffect(() => {
    const h = setInterval(() => {
      try {
        localStorage.setItem('draft:write', JSON.stringify({ title, content, cover, heading }));
        const now = new Date();
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        const ss = now.getSeconds().toString().padStart(2, '0');
        setStatus(`자동저장됨 ${hh}:${mm}:${ss}`);
      } catch {}
    }, 3000);
    return () => clearInterval(h);
  }, [title, content, cover, heading]);

  const makeExcerpt = (html: string) => {
    const safe = sanitizeHtml(html || '');
    const text = safe.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.slice(0, 160);
  };

  // 콘텐츠 기반 커버 자동 제안 (이미지/YouTube/Dailymotion + 플랫폼 폴백)
  type CoverSuggestion = { url: string; platform?: string } | null;
  const suggestCoverFromContent = (html: string): CoverSuggestion => {
    const safe = sanitizeHtml(html || '');
    // 본문 첫 이미지
    const img = safe.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
    if (img?.[1]) return { url: img[1], platform: 'image' };
    // YouTube
    const y = safe.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
    if (y?.[1]) return { url: `https://img.youtube.com/vi/${y[1]}/hqdefault.jpg`, platform: 'youtube' };
    // Dailymotion
    const d = safe.match(/dailymotion\.com\/(?:embed\/video|video)\/([a-z0-9]+)/i);
    if (d?.[1]) return { url: `https://www.dailymotion.com/thumbnail/video/${d[1]}`, platform: 'dailymotion' };
    // NaverTV (공개 썸네일 URL 불명확 → 폴백 이미지 제안)
    const n = safe.match(/tv\.naver\.com\/(?:v|embed)\/([0-9]+)/i);
    if (n?.[1]) return { url: '/window.svg', platform: 'navertv' };
    // Instagram/Facebook (oEmbed 필요 → 폴백 이미지 제안)
    const ig = safe.match(/instagram\.com\/(p|reel|tv)\//i);
    if (ig) return { url: '/window.svg', platform: 'instagram' };
    const fb = safe.match(/facebook\.com\//i);
    if (fb) return { url: '/window.svg', platform: 'facebook' };
    return null;
  };
  const suggested = suggestCoverFromContent(content);

  // 자동 커버 적용: 이미지 최우선 → 링크 카드 썸네일 → 플랫폼 폴백
  useEffect(() => {
    const firstImage = suggested?.platform === 'image' ? suggested.url : null;
    const platformFallback = suggested && suggested.platform !== 'image' ? suggested.url : null;
    const linkImage = linkPreview?.image || null;
    const next = firstImage || linkImage || platformFallback || null;
    if (next && next !== cover) setCover(next);
  }, [content, suggested?.url, suggested?.platform, linkPreview?.image]);

  // 콘텐츠에서 URL 감지 → 링크 프리뷰 요청 (엔터 입력 후 자동 링크화되어도 onChange로 감지)
  useEffect(() => {
    const safe = sanitizeHtml(content || '');
    // 우선 anchor href 추출
    const mHref = safe.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i);
    // 폴백: 텍스트 안의 첫 http(s) URL 추출 (공백/태그 제외)
    const mText = mHref ? null : safe.replace(/<[^>]+>/g, ' ').match(/https?:\/\/[^\s]+/i);
    const found = (mHref?.[1] || mText?.[0] || '').trim();
    // 이미지/비디오/embed가 아닌 일반 링크만 처리
    const isMedia = /\.(jpg|jpeg|png|webp|gif|mp4|webm|ogg)(\?.*)?$/i.test(found) || /(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv|instagram\.com|facebook\.com|tv\.naver\.com|tiktok\.com)/i.test(found);
    if (found && !isMedia) {
      // 동일 링크 반복 요청 방지
      if (linkPreview?.url === found || linkLoading) return;
      let alive = true;
      setLinkLoading(true);
      fetch(`/api/link-preview?url=${encodeURIComponent(found)}`)
        .then((r) => r.json())
        .then((j) => {
          if (!alive) return;
          if (j?.ok) {
            setLinkPreview({ url: found, title: j.title, description: j.description, image: j.image });
          } else {
            setLinkPreview({ url: found });
          }
        })
        .catch(() => { if (alive) setLinkPreview({ url: found }); })
        .finally(() => { if (alive) setLinkLoading(false); });
      return () => { alive = false; };
    }
    // 링크가 없으면 프리뷰 초기화(사용자가 삭제한 경우)
    if (!found && linkPreview) setLinkPreview(null);
  }, [content]);

  // 슬러그는 서버에서 자동 생성됩니다.

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setToast(null);
    // 기본 검증
    const t = (title || '').trim();
    if (!t) { setToast({ type: 'error', message: '제목을 입력하세요' }); return; }
    setIsSubmitting(true);
    // 중복 확인은 서버에서 처리(고유 제약 조건)하고 에러 메시지로 안내
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t, content, excerpt: makeExcerpt(content), cover_image: cover, published: true, heading: heading || null }),
    });
    const json = await res.json();
    if (!res.ok) setToast({ type: 'error', message: json.error || '오류' });
    else {
      setToast({ type: 'success', message: '작성 완료, 글로 이동합니다' });
      try {
        localStorage.removeItem('draft:write');
      } catch {}
      setTimeout(() => {
        const s = (json && json.slug) ? String(json.slug) : '';
        window.location.href = s ? `/posts/${encodeURIComponent(s)}` : '/posts';
      }, 500);
    }
    setIsSubmitting(false);
  };

  return (
    <main id="main" role="main" aria-labelledby="write-title" className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 id="write-title" className="text-2xl font-bold">글 작성</h1>
        {status && <span className="text-xs text-gray-500" role="status" aria-live="polite">{status}</span>}
      </div>
      {hasDraft && (
        <div className="border rounded p-3 bg-yellow-50 text-sm flex items-center justify-between">
          <span>임시저장된 초안이 있습니다. 복원하시겠습니까?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-2 py-1 border rounded bg-white hover:bg-gray-50"
              onClick={() => {
              if (savedDraft) {
                setTitle(savedDraft.title || '');
                setContent(savedDraft.content || '');
                setCover(savedDraft.cover || null);
                setHeading(savedDraft.heading || '');
              }
              setHasDraft(false);
              setToast({ type: 'success', message: '초안을 복원했습니다.' });
              setTimeout(() => setToast(null), 2500);
            }}
          >복원</button>
            <button
              type="button"
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
        {/* 슬러그 입력 제거: 서버에서 자동 생성됩니다. */}
        {/* 커버 이미지 수동 선택 UI 제거: 자동 탐지로만 적용 */}
        {/* 링크 프리뷰는 유지(커버 설정 버튼 삭제) */}
        {linkPreview && (
          <div className="mt-3 border rounded p-3 bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">링크 미리보기</p>
            <div className="flex items-start gap-3">
              <div className="w-28 h-18 shrink-0 border rounded bg-white overflow-hidden">
                {linkPreview.image ? (
                  <img src={linkPreview.image} alt="링크 이미지" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">이미지 없음</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{linkPreview.title || linkPreview.url}</p>
                {linkLoading ? (
                  <p className="text-xs text-gray-500 mt-0.5">메타데이터 불러오는 중…</p>
                ) : (
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{linkPreview.description || '설명이 없습니다.'}</p>
                )}
                <div className="mt-2 flex items-center gap-2">
                  {linkPreview.description && (
                    <button
                      type="button"
                      className="px-2 py-1 border rounded text-xs hover:bg-gray-100"
                      onClick={() => {
                        const desc = (linkPreview.description || '').trim();
                        if (!desc) return;
                        setContent(`<p>${desc}</p>` + (content || ''));
                      }}
                    >설명을 본문 서두에 삽입</button>
                  )}
                  <a
                    href={linkPreview.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-1 border rounded text-xs hover:bg-gray-100"
                    aria-label="원문 열기 (새 창)"
                    title="새 창에서 원문 열기"
                  >
                    원문 열기 <span className="sr-only">(새 창)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mt-3 mb-1" htmlFor="heading">머리말(카테고리)</label>
          <select id="heading" className="border rounded w-full p-2" value={heading} onChange={(e) => setHeading(e.target.value)}>
            <option value="">선택 없음</option>
            {HEADINGS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        {/* 런타임 예외 발생 시 페이지 전체 크래시를 방지하는 간단한 에러 바운더리 */}
        <EditorBoundary>
          <RichEditor value={content} onChange={setContent} />
        </EditorBoundary>
        <button
          className={`${outlineButtonSmall} disabled:opacity-60`}
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          aria-describedby="write-submit-hint"
        >
          {isSubmitting ? '작성 중...' : '작성'}
        </button>
        <p id="write-submit-hint" className="text-xs text-gray-500">Ctrl+Enter로 빠르게 작성할 수 있습니다.</p>
      </form>
      {toast && <ActionToast toast={{ type: toast.type, message: toast.message }} onClose={() => setToast(null)} />}
    </main>
  );
}

// 간단한 에러 바운더리: 에디터/이미지 업로드 등에서 예외 발생 시 안전한 폴백 제공
class EditorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }>{
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { /* 로깅 등 필요 시 추가 */ }
  render() {
    if (this.state.hasError) {
      return (
        <div className="border rounded p-3 bg-red-50 text-sm text-red-700">
          에디터 로딩 중 오류가 발생했습니다. 페이지를 새로고침하거나 다른 브라우저로 시도해 주세요.
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
// 주의: 이 파일은 Client Component입니다. Client 파일에 `export const dynamic`을 선언하면
// Next.js 컴파일러가 Client/Server 경로 모두에서 처리하려다 중복 정의 오류가 발생합니다.
// 동적 렌더링이 필요하다면 서버 컴포넌트 래퍼에서 선언하세요.
