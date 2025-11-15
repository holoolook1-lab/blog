"use client";
import { useState } from 'react';
import { Flag, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function ReportButton({ slug }: { slug: string }) {
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string>('');
  const [ok, setOk] = useState<boolean | null>(null);

  const handleClick = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;
    
    // 현대적인 모달 대화상자로 변경
    const reason = typeof window !== 'undefined' ? 
      window.prompt('🚨 신고 사유를 입력해주세요\n\n선택 사항이지만, 더 나은 조치를 위해 구체적으로 작성해 주시면 도움이 됩니다.\n\n예시: 스팸, 부적절한 내용, 저작권 침해 등') || '' : '';
    
    if (reason === null) return; // 사용자가 취소한 경우
    
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
        setFeedback('✅ 신고가 접수되었습니다. 검토 후 조치하겠습니다.');
      } else {
        const data = await res.json().catch(() => ({}));
        setOk(false);
        setFeedback(data?.error ? `❌ 오류: ${data.error}` : '❌ 신고 처리 중 오류가 발생했습니다.');
      }
    } catch {
      setOk(false);
      setFeedback('❌ 네트워크 오류로 신고에 실패했습니다.');
    } finally {
      setSending(false);
      // 5초 후 피드백 메시지 자동 제거
      setTimeout(() => {
        setFeedback('');
        setOk(null);
      }, 5000);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      {/* 신고 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag size={16} className="text-error-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-neutral-700">부적절한 콘텐츠 신고</span>
        </div>
        
        <button
          type="button"
          onClick={handleClick}
          disabled={sending}
          className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-error-300 bg-white text-error-700 hover:bg-error-50 hover:border-error-400 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="이 글을 신고합니다"
          aria-busy={sending}
          aria-describedby="report-submit-hint"
          title="커뮤니티 가이드라인 위반 콘텐츠 신고"
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-error-300 border-t-error-600" aria-hidden="true" />
              <span className="text-sm font-medium">신고 중...</span>
            </>
          ) : (
            <>
              <AlertCircle size={16} className="text-current" aria-hidden="true" />
              <span className="text-sm font-medium">신고하기</span>
            </>
          )}
        </button>
      </div>

      {/* 숨김 텍스트 */}
      <p id="report-submit-hint" className="sr-only">신고 처리 중에는 버튼이 비활성화되며, 5초 후 피드백 메시지가 자동으로 사라집니다.</p>
      
      {/* 피드백 메시지 */}
      {ok !== null && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${ok ? 'bg-success-50 border-success-200' : 'bg-error-50 border-error-200'}`} role="status" aria-live="polite">
          {ok ? (
            <CheckCircle size={16} className="text-success-600" aria-hidden="true" />
          ) : (
            <XCircle size={16} className="text-error-600" aria-hidden="true" />
          )}
          <p className={`text-sm font-medium ${ok ? 'text-success-800' : 'text-error-800'}`}>
            {feedback}
          </p>
        </div>
      )}
      
      {/* 신고 가이드라인 */}
      <details className="group">
        <summary className="flex items-center gap-2 text-xs text-neutral-600 hover:text-neutral-800 cursor-pointer select-none">
          <AlertCircle size={12} className="text-current" aria-hidden="true" />
          <span className="font-medium">신고 가이드라인 보기</span>
        </summary>
        <div className="mt-2 p-3 bg-white rounded border border-neutral-200 text-xs text-neutral-600 space-y-1">
          <p>• 스팸 또는误导性 콘텐츠</p>
          <p>• 욕설, 혐오 발언, 위협</p>
          <p>• 개인정보 침해 또는 저작권 위반</p>
          <p>• 부적절한 광고 또는 홍보</p>
        </div>
      </details>
    </div>
  );
}
