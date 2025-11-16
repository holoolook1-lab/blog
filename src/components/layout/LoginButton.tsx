"use client";

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface LoginButtonProps {
  onClick?: () => void;
}

export default function LoginButton({ onClick }: LoginButtonProps) {
  const t = useTranslations('nav');
  
  return (
    <Link
      href="/login"
      className="text-lg md:text-base font-normal menu-item-luxury menu-typography menu-hover-effect text-gray-700 hover:text-black"
      onClick={onClick}
    >
      {t('login')}
    </Link>
  );
}