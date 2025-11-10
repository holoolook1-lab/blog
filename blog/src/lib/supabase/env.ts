import { createClient } from '@supabase/supabase-js';

export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase public environment variables are missing');
  }
  return { url, key };
}

export function createPublicSupabaseClient() {
  const { url, key } = getPublicSupabaseConfig();
  return createClient(url, key);
}
