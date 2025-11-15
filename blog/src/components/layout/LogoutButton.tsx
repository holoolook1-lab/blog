"use client";
import { logout } from '@/lib/auth/logout';

interface LogoutButtonProps {
  onClick?: () => void;
}

export default function LogoutButton({ onClick }: LogoutButtonProps) {
  const onLogout = async () => {
    const ok = confirm('로그아웃하시겠습니까?');
    if (!ok) return;
    if (onClick) onClick();
    await logout('/');
  };
  return (
    <button 
      type="button" 
      onClick={onLogout} 
      className="text-lg md:text-base font-normal text-gray-700 hover:text-black transition-all duration-300 w-full md:w-auto text-left menu-item-luxury menu-typography menu-hover-effect" 
      aria-label="로그아웃"
    >
      로그아웃
    </button>
  );
}
