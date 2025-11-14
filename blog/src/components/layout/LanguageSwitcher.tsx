"use client";
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const setLocale = async (locale: string) => {
    await fetch('/api/locale', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale }) });
    startTransition(() => {
      window.location.reload();
    });
  };
  return (
    <div className="flex items-center gap-1">
      <button className="px-2 py-1 border rounded text-xs" onClick={() => setLocale('ko')} disabled={isPending}>KO</button>
      <button className="px-2 py-1 border rounded text-xs" onClick={() => setLocale('en')} disabled={isPending}>EN</button>
    </div>
  );
}
