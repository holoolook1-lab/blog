"use client";
import { useState } from 'react';

type Props = { slug: string };

export default function ReportForm({ slug }: Props) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('스팸');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');

  const submit = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    setSending(true);
    setFeedback('');
    setOk(null);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, url, category, details }),
      });
      if (res.ok) {
        setOk(true);
        setFeedback('신고가 접수되었습니다. 이메일로 전달됩니다.');
        setDetails('');
        setOpen(false);
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
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center px-2 py-1 text-xs rounded border bg-red-50 text-red-700 hover:bg-red-100"
        aria-expanded={open}
        aria-controls="report-panel"
      >
        신고하기
      </button>

      {open && (
        <div id="report-panel" className="mt-2 border rounded p-3 bg-gray-50">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-700">신고 유형</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded border p-1 text-sm bg-white"
            >
              <option>스팸</option>
              <option>욕설/혐오</option>
              <option>불법/유해</option>
              <option>허위 정보</option>
              <option>기타</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 mt-3">
            <label className="text-xs text-gray-700">상세 사유</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="신고 사유를 가능한 구체적으로 적어주세요."
              className="rounded border p-2 text-sm bg-white"
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={sending}
              className="inline-flex items-center px-3 py-1.5 text-xs rounded border bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              aria-busy={sending}
              aria-describedby="reportform-submit-hint"
            >
              {sending ? '전송 중...' : '신고 제출'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex items-center px-3 py-1.5 text-xs rounded border bg-gray-100 hover:bg-gray-200"
            >
              취소
            </button>
          </div>
          <p id="reportform-submit-hint" className="sr-only">신고 제출 처리 중에는 버튼이 비활성화됩니다.</p>
        </div>
      )}

      {ok !== null && (
        <p className={`mt-1 text-xs ${ok ? 'text-green-700' : 'text-red-700'}`} role="status" aria-live="polite">{feedback}</p>
      )}
    </div>
  );
}
