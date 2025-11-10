import { createClient } from '@supabase/supabase-js';

export function getPublicSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hyueqldwgertapmhmmni.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5dWVxbGR3Z2VydGFwbWhtbW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQxOTksImV4cCI6MjA3ODI0MDE5OX0.tkQ1H7jzdX2AlIrZiUmiSGqYfjreCgcBv9fpMkEtsg0';
  return { url, key };
}

export function createPublicSupabaseClient() {
  const { url, key } = getPublicSupabaseConfig();
  return createClient(url, key);
}

