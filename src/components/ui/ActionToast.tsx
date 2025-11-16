"use client";
import { useEffect } from "react";
type Toast = { type: "success" | "error"; message: string };
export default function ActionToast({ toast, onClose }: { toast: Toast; onClose?: () => void }) {
  const bg = toast.type === "success" ? "bg-green-600" : "bg-red-600";
  const border = toast.type === "success" ? "border-green-700" : "border-red-700";

  // 자동 닫힘: onClose가 제공되면 2초 후 자동으로 닫습니다.
  useEffect(() => {
    if (!onClose) return;
    const t = setTimeout(() => onClose(), 2000);
    return () => clearTimeout(t);
  }, [onClose, toast]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`text-white ${bg} border ${border} rounded shadow px-3 py-2 flex items-center gap-3`}
        role={toast.type === 'success' ? 'status' : 'alert'}
        aria-live={toast.type === 'success' ? 'polite' : 'assertive'}
      >
        <span>{toast.message}</span>
        {onClose && (
          <button
            className="ml-2 bg-white/20 hover:bg-white/30 rounded px-2 py-0.5"
            onClick={() => onClose?.()}
            aria-label="닫기"
          >닫기</button>
        )}
      </div>
    </div>
  );
}
