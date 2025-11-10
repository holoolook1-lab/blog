"use client";
import { supabase } from '@/lib/supabase/client';

export default function LogoutButton() {
  const onLogout = async () => {
    const ok = confirm('로그아웃하시겠습니까?');
    if (!ok) return;
    await supabase.auth.signOut();
    window.location.href = '/';
  };
  return (
    <button onClick={onLogout} className="text-gray-700 hover:underline">로그아웃</button>
  );
}