'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthUser } from '@/lib/hooks/useAuthUser';

export default function EditLinkClient({ authorId, slug }: { authorId: string; slug: string }) {
  const [isOwner, setIsOwner] = useState(false);
  const { userId } = useAuthUser();
  const { useTranslations } = require('next-intl');
  const t = useTranslations('nav');

  useEffect(() => {
    setIsOwner(Boolean(userId && userId === authorId));
  }, [authorId, userId]);

  if (!isOwner) return null;
  return (
    <Link href={`/edit/${slug}`} className="text-sm text-blue-600 link-gauge" aria-label={t('write')}>{t('write')}</Link>
  );
}
