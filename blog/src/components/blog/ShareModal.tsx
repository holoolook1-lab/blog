'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import CardPreview from './CardPreview';

interface ShareModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

export default function ShareModal({ url, title, onClose }: ShareModalProps) {
  const ogImageUrl = `${url.replace(/\/posts\/.*/, '')}/opengraph-image`;
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    // 모달 열릴 때 포커스 복귀 대상 저장
    openerRef.current = document.activeElement;
    // 초기 포커스를 닫기 버튼으로 이동
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    // 탭 포커스 트랩
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const shift = (e as any).shiftKey;
      if (shift && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!shift && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keydown', trap);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keydown', trap);
    };
  }, [onClose]);

  // 닫힐 때 원래 포커스로 복귀
  useEffect(() => {
    return () => {
      const el = openerRef.current as HTMLElement | null;
      try { el?.focus(); } catch {}
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        ref={dialogRef}
        className="bg-white rounded-lg p-6 w-full max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        aria-describedby="share-dialog-desc"
        id="share-dialog"
        tabIndex={-1}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="share-dialog-title" className="text-xl font-bold">소셜 공유 미리보기</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black"
            aria-label="닫기"
            aria-describedby="share-close-hint"
          >
            <X size={24} aria-hidden="true" focusable="false" />
          </button>
        </div>
        <div className="space-y-6">
          <p id="share-dialog-desc" className="sr-only">Esc로 닫기, Tab으로 모달 내부 포커스만 순환합니다.</p>
          <p id="share-close-hint" className="sr-only">모달을 닫습니다. Esc 키로도 닫을 수 있습니다.</p>
          <CardPreview platform="twitter" title={title} url={url} imageUrl={ogImageUrl} />
          <CardPreview platform="facebook" title={title} url={url} imageUrl={ogImageUrl} />
        </div>
      </div>
    </div>
  );
}
