"use client";
import { logout } from '@/lib/auth/logout';

export default function LogoutButton() {
  const onLogout = async () => {
    const ok = confirm('로그아웃하시겠습니까?');
    if (!ok) return;
    await logout('/');
  };
  return (
    <button onClick={onLogout} className="text-gray-700 link-tone">로그아웃</button>
  );
}
