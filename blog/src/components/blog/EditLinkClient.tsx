'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function EditLinkClient({ authorId, slug }: { authorId: string; slug: string }) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      setIsOwner(Boolean(user && user.id === authorId));
    }).catch(() => setIsOwner(false));
  }, [authorId]);

  if (!isOwner) return null;
  return (
    <Link href={`/edit/${slug}`} className="text-sm text-blue-600 hover:underline">편집</Link>
  );
}

