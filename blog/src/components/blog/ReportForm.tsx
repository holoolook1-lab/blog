"use client";
import { useState } from 'react';
import { Button, Input } from '@/components/ui/index';

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
    <div className="mt-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="text-error-600 hover:text-error-700"
        aria-expanded={open}
        aria-controls="report-panel"
      >
        신고하기
      </Button>

      {open && (
        <div id="report-panel" className="mt-3 border border-secondary-200 rounded-lg p-4 bg-secondary-50">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">신고 유형</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-md border border-secondary-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option>스팸</option>
                <option>욕설/혐오</option>
                <option>불법/유해</option>
                <option>허위 정보</option>
                <option>기타</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">상세 사유</label>
              <Input
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                placeholder="신고 사유를 가능한 구체적으로 적어주세요."
                className="resize-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={submit}
                disabled={sending}
                loading={sending}
              >
                신고 제출
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
            </div>
            <p id="reportform-submit-hint" className="sr-only">신고 제출 처리 중에는 버튼이 비활성화됩니다.</p>
          </div>
        </div>
      )}

      {ok !== null && (
        <p className={`mt-2 text-sm ${ok ? 'text-success-600' : 'text-error-600'}`} role="status" aria-live="polite">{feedback}</p>
      )}
    </div>
  );
}