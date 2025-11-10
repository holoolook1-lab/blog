import { createClient } from '@supabase/supabase-js';

// 서비스 롤 키가 있을 때만 관리자 클라이언트 활성화
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hyueqldwgertapmhmmni.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const adminSupabase = serviceKey ? createClient(url, serviceKey) : null as unknown as ReturnType<typeof createClient>;

