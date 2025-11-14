"use client";
import { logout } from '@/lib/auth/logout';

export default function LogoutButton() {
  const onLogout = async () => {
    const ok = confirm('로그아웃하시겠습니까?');
    if (!ok) return;
    await logout('/');
  };
  return (
    <button 
      type="button" 
      onClick={onLogout} 
      className="text-gray-700 hover:text-black hover:bg-gray-50 px-4 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50" 
      aria-label="로그아웃"
    >
      로그아웃
    </button>
  );
}
