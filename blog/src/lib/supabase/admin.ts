import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const adminSupabase = serviceKey && url
  ? createClient(url, serviceKey)
  : null as unknown as ReturnType<typeof createClient>;
