"use client";
import { useState } from 'react';

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
        onClick={handleClick}
        disabled={sending}
        className="inline-flex items-center px-2 py-1 text-xs rounded border bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
        aria-label="글 신고"
        title="이 글을 신고합니다"
      >
        {sending ? '신고 중...' : '신고하기'}
      </button>
      {ok !== null && (
        <p className={`mt-1 text-xs ${ok ? 'text-green-700' : 'text-red-700'}`}>{feedback}</p>
      )}
    </div>
  );
}

