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
      className="text-2xl md:text-base font-light md:font-normal text-gray-600 hover:text-black transition-all duration-300 w-full md:w-auto text-left menu-item-luxury menu-typography menu-hover-effect" 
      aria-label="로그아웃"
    >
      로그아웃
    </button>
  );
}
