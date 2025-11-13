"use client";
import { useState } from 'react';
import { outlineButtonSmall } from '@/lib/styles/ui';

export default function ReportButton({ slug }: { slug: string }) {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [ok, setOk] = useState<boolean | null>(null);

  const handleClick = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;
    const reason = typeof window !== 'undefined' ? window.prompt('신고 사유를 입력해주세요 (선택)') || '' : '';
    setSending(true);
    setFeedback('');
    setOk(null);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, url, reason }),
      });
      if (res.ok) {
        setOk(true);
        setFeedback('신고가 접수되었습니다. 확인 메일이 발송됩니다.');
      } else {
        const data = await res.json().catch(() => ({}));
        setOk(false);
        setFeedback(data?.error ? `오류: ${data.error}` : '신고 처리 중 오류가 발생했습니다.');
      }
    } catch {
      setOk(false);
      setFeedback('네트워크 오류로 신고에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={sending}
        className={`${outlineButtonSmall} border-red-600 text-red-700 hover:bg-red-50 disabled:opacity-50`}
        aria-label="글 신고"
        aria-busy={sending}
        aria-describedby="report-submit-hint"
        title="이 글을 신고합니다"
      >
        {sending ? '신고 중...' : '신고하기'}
      </button>
      <p id="report-submit-hint" className="sr-only">신고 처리 중에는 버튼이 비활성화됩니다.</p>
      {ok !== null && (
        <p className={`mt-1 text-xs ${ok ? 'text-green-700' : 'text-red-700'}`} role="status" aria-live="polite">{feedback}</p>
      )}
    </div>
  );
}
