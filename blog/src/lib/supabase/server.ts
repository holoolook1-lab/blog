import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export const getServerSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null as unknown as ReturnType<typeof createServerComponentClient>;
  }
  // Next.js App Router 권장 방식: cookies 함수 레퍼런스를 직접 전달
  return createServerComponentClient({ cookies });
};
