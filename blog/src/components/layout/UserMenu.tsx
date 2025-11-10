"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<string>('U');
  const menuRef = useRef<HTMLDivElement | null>(null);
  const firstItemRef = useRef<HTMLAnchorElement | null>(null);
  const logoutRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email || '';
      setInitial(email ? email[0].toUpperCase() : 'U');
    });
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const onLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="w-8 h-8 rounded-full bg-gray-800 text-white text-sm flex items-center justify-center"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="사용자 메뉴"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if ((e.key === 'Enter' || e.key === ' ') && !open) {
            setOpen(true);
            setTimeout(() => firstItemRef.current?.focus(), 0);
          }
          if (e.key === 'ArrowDown' && !open) {
            setOpen(true);
            setTimeout(() => firstItemRef.current?.focus(), 0);
          }
        }}
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-36 rounded-md border bg-white shadow-lg p-1 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              const first = firstItemRef.current;
              const last = logoutRef.current;
              if (!first || !last) return;
              const active = document.activeElement;
              if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
              } else if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
              }
            }
          }}
        >
          <Link href="/profile" ref={firstItemRef} className="block px-3 py-2 rounded hover:bg-gray-100 focus:outline-none focus:bg-gray-100" role="menuitem" tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                logoutRef.current?.focus();
              }
            }}
          >프로필</Link>
          <button ref={logoutRef} onClick={onLogout} className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100 focus:outline-none focus:bg-gray-100" role="menuitem" tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                firstItemRef.current?.focus();
              }
            }}
          >로그아웃</button>
        </div>
      )}
    </div>
  );
}