import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export const getServerSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null as unknown as ReturnType<typeof createRouteHandlerClient>;
  }
  // Route Handler/Server 환경 모두에서 안전하게 동작하도록 RouteHandlerClient 사용
  return createRouteHandlerClient({ cookies });
};
