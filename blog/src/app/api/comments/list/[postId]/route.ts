import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type Params = { params: { postId: string } };

export const revalidate = 60;

export async function GET(_: Request, { params }: Params) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hyueqldwgertapmhmmni.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5dWVxbGR3Z2VydGFwbWhtbW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NjQxOTksImV4cCI6MjA3ODI0MDE5OX0.tkQ1H7jzdX2AlIrZiUmiSGqYfjreCgcBv9fpMkEtsg0';
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('comments')
    .select('id, user_id, post_id, parent_id, content, created_at')
    .eq('post_id', params.postId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ comments: data || [] });
}
