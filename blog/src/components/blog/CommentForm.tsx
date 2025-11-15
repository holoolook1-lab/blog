"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuthUser } from '@/lib/hooks/useAuthUser';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import ActionToast from '@/components/ui/ActionToast';
import { Button, Input } from '@/components/ui/index';
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
  const { useTranslations } = require('next-intl');
  const t = useTranslations('comments');


  const showToast = (toast: Toast) => {
    setToast(toast);
    setTimeout(() => setToast(null), 2500);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length > MAX_LEN) {
      setContent(text.slice(0, MAX_LEN));
      showToast({ type: 'error', message: `MAX ${MAX_LEN}` });
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
      showToast({ type: 'error', message: 'Too fast.' });
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
        showToast({ type: 'success', message: t('submit') });
        onSubmitted?.();
      } else {
        const { error } = await res.json();
        const message = error === 'profanity' ? 'Profanity' : 'Failed.';
        showToast({ type: 'error', message });
      }
    } catch (err) {
      showToast({ type: 'error', message: 'Network error.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [confirmOpen]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {toast && <ActionToast toast={toast} onClose={() => setToast(null)} />}
      
      {/* 댓글 입력 영역 */}
      <div className="relative">
        <textarea
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          rows={4}
          maxLength={MAX_LEN}
          placeholder={t('placeholder') || '댓글을 입력하세요...'}
          className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-white text-sm placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-20 focus:outline-none transition-all duration-200 resize-none disabled:bg-neutral-50 disabled:cursor-not-allowed"
          aria-describedby="comment-hint comment-count"
        />
        
        {/* 글자수 표시 */}
        <div className="absolute bottom-3 right-4 flex items-center">
          <span 
            id="comment-count" 
            className={`text-xs font-medium ${
              content.length > MAX_LEN * 0.9 
                ? 'text-error-600' 
                : content.length > MAX_LEN * 0.7 
                ? 'text-warning-600' 
                : 'text-neutral-500'
            }`}
          >
            {content.length} / {MAX_LEN}
          </span>
        </div>
      </div>

      {/* 액션 바 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 힌트 메시지 */}
          <p id="comment-hint" className="text-sm text-neutral-600">
            💡 {t('hint') || 'Ctrl+Enter로 빠른 제출'}
          </p>
          
          {/* 로그인 상태 표시 */}
          {isLoggedIn && (
            <div className="flex items-center gap-1 text-xs text-success-600">
              <div className="w-2 h-2 bg-success-500 rounded-full"></div>
              <span>로그인됨</span>
            </div>
          )}
        </div>
        
        {/* 제출 버튼 */}
        <Button
          type="submit"
          variant="primary"
          size="default"
          disabled={isSubmitting || !content.trim()}
          loading={isSubmitting}
          className="px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" aria-hidden="true" />
              <span>{t('submitting') || '제출 중...'}</span>
            </>
          ) : (
            <span>{t('submit') || '댓글 작성'}</span>
          )}
        </Button>
      </div>

      {/* 로그인 확인 모달 */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-confirm-title"
            className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-neutral-200"
          >
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                <AlertCircle size={24} className="text-primary-600" aria-hidden="true" />
              </div>
              
              <h3 id="login-confirm-title" className="text-lg font-semibold text-neutral-900 mb-2">
                {t('loginRequiredTitle') || '로그인이 필요합니다'}
              </h3>
              
              <p className="text-sm text-neutral-600 mb-6">
                {t('loginRequiredDesc') || '댓글을 작성하려면 로그인이 필요합니다.'}
              </p>
              
              <div className="flex gap-3 justify-center">
                <Button
                  variant="primary"
                  size="default"
                  onClick={(e) => {
                    e.preventDefault();
                    setConfirmOpen(false);
                    requireAuth();
                  }}
                  className="px-6"
                >
                  {t('confirm') || '로그인하기'}
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setConfirmOpen(false); 
                  }}
                  className="px-6"
                >
                  {t('cancel') || '취소'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
