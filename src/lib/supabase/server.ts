import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/supabase/types';
import { hasSupabasePublicEnv } from '@/lib/env';
import { HARDCODED_SUPABASE_URL, HARDCODED_SUPABASE_ANON_KEY, hasHardcodedSupabase } from '@/lib/supabase/hardcoded';

export const getServerSupabase = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || HARDCODED_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || HARDCODED_SUPABASE_ANON_KEY;
  if (!hasSupabasePublicEnv() && !hasHardcodedSupabase()) {
    return null as unknown as ReturnType<typeof createServerClient>;
  }
  const store = await cookies();
  return createServerClient<Database>(url!, key!, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value;
      },
      // Server Component에서는 쿠키 수정이 금지됨: no-op으로 변경
      set(_name: string, _value: string, _options?: any) {
        /* no-op in Server Components */
      },
      remove(_name: string, _options?: any) {
        /* no-op in Server Components */
      },
    },
  });
};
