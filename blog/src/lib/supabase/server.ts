import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { hasSupabasePublicEnv } from '@/lib/env';

export const getServerSupabase = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!hasSupabasePublicEnv()) {
    return null as unknown as ReturnType<typeof createServerClient>;
  }
  const store = await cookies();
  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      set(name: string, value: string, options?: any) {
        store.set(name, value, options);
      },
      remove(name: string, options?: any) {
        // Next 16에서는 삭제를 set으로 처리(maxAge=0)
        store.set(name, '', { ...options, maxAge: 0 });
      },
    },
  });
};
