"use client";
type Toast = { type: "success" | "error"; message: string };
export default function ActionToast({ toast, onClose }: { toast: Toast; onClose?: () => void }) {
  const bg = toast.type === "success" ? "bg-green-600" : "bg-red-600";
  const border = toast.type === "success" ? "border-green-700" : "border-red-700";
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`text-white ${bg} border ${border} rounded shadow px-3 py-2 flex items-center gap-3`} role="status" aria-live="polite">
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