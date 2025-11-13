import { createClient } from '@supabase/supabase-js';
import { HARDCODED_SUPABASE_URL, HARDCODED_SUPABASE_SERVICE_ROLE_KEY } from '@/lib/supabase/hardcoded';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || HARDCODED_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || HARDCODED_SUPABASE_SERVICE_ROLE_KEY;

export const adminSupabase = (url && serviceKey)
  ? createClient(url!, serviceKey)
  : null as unknown as ReturnType<typeof createClient>;
