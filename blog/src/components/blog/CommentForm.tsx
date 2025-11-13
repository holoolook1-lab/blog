"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import ActionToast from '@/components/ui/ActionToast';
import { outlineButtonSmall } from '@/lib/styles/ui';
type Toast = { type: 'success' | 'error'; message: string };

const MAX_LEN = 2000;

export default function CommentForm({
  postId,
  parentId,
  onSubmitted,
}: {
  postId: string;
  parentId?: string | null;
  onSubmitted?: () => void;
}) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const { userId } = useAuthUser();
  const isLoggedIn = Boolean(userId);
  const { requireAuth } = useRequireAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);


  const showToast = (toast: Toast) => {
    setToast(toast);
    setTimeout(() => setToast(null), 2500);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length > MAX_LEN) {
      setContent(text.slice(0, MAX_LEN));
      showToast({ type: 'error', message: `댓글은 ${MAX_LEN}자를 넘을 수 없습니다.` });
    } else {
      setContent(text);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;
    if (!isLoggedIn) {
      setConfirmOpen(true);
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < 8000) {
      showToast({ type: 'error', message: '너무 빠르게 반복 제출하고 있어요. 잠시 후 다시 시도하세요' });
      return;
    }

    setIsSubmitting(true);
    setLastSubmitTime(now);

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, parent_id: parentId, content }),
      });

      if (res.ok) {
        setContent('');
        showToast({ type: 'success', message: '댓글이 성공적으로 등록되었습니다.' });
        onSubmitted?.();
      } else {
        const { error } = await res.json();
        const message = error === 'profanity' ? '댓글에 부적절한 단어가 포함되어 있습니다.' : '댓글 등록에 실패했습니다.';
        showToast({ type: 'error', message });
      }
    } catch (err) {
      showToast({ type: 'error', message: '네트워크 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  useEffect(() => {
    if (!confirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 10);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
    };
  }, [confirmOpen]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {toast && <ActionToast toast={toast} onClose={() => setToast(null)} />}
      <textarea
        name="content"
        rows={3}
        className="w-full rounded-md border bg-transparent px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder={'댓글을 입력하세요...'}
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        disabled={isSubmitting}
        aria-disabled={isSubmitting}
        aria-live="polite"
        aria-describedby="comment-hint comment-count"
      />
      <div className="flex items-center justify-between">
        <span id="comment-count" className={`text-sm ${content.length > MAX_LEN ? 'text-red-500' : 'text-gray-500'}`}>
          {content.length} / {MAX_LEN}
        </span>
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className={`${outlineButtonSmall} disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2`}
          aria-busy={isSubmitting}
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          )}
          {isSubmitting ? '등록 중...' : '댓글 등록'}
        </button>
      </div>
      <p id="comment-hint" className="text-xs text-gray-500">Ctrl+Enter로 빠르게 댓글을 등록할 수 있습니다.</p>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-confirm-title"
            className="relative z-10 w-[92%] max-w-sm rounded border bg-white p-4 shadow-lg"
          >
            <h3 id="login-confirm-title" className="text-sm font-semibold">로그인 페이지로 이동합니다</h3>
            <p className="mt-2 text-sm text-gray-700">댓글 등록을 위해 로그인이 필요합니다. 계속하시겠습니까?</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                ref={confirmBtnRef}
                className={`${outlineButtonSmall}`}
                onClick={(e) => {
                  e.preventDefault();
                  setConfirmOpen(false);
                  requireAuth();
                }}
              >
                확인
              </button>
              <button
                ref={cancelBtnRef}
                className={`${outlineButtonSmall}`}
                onClick={(e) => { e.preventDefault(); setConfirmOpen(false); }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
