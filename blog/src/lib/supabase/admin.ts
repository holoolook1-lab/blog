import { createClient } from '@supabase/supabase-js';
import { hasSupabasePublicEnv, hasServiceRoleKey } from '@/lib/env';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const adminSupabase = hasServiceRoleKey() && hasSupabasePublicEnv()
  ? createClient(url!, serviceKey)
  : null as unknown as ReturnType<typeof createClient>;
