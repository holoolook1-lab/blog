import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnvOrThrow, hasSupabasePublicEnv } from '@/lib/env';
import { HARDCODED_SUPABASE_URL, HARDCODED_SUPABASE_ANON_KEY, hasHardcodedSupabase } from '@/lib/supabase/hardcoded';

function createSupabaseStub(): any {
  const noopSub = { subscription: { unsubscribe() {} } };
  const auth = {
    async getUser() { return { data: { user: null } }; },
    async getSession() { return { data: { session: null } }; },
    onAuthStateChange(_cb: any) { return { data: noopSub }; },
  };
  const query = {
    select(_cols?: string) { return this; },
    insert(_vals: any) { return this; },
    update(_vals: any) { return this; },
    delete() { return this; },
    eq(_col: string, _val: any) { return this; },
    gt(_col: string, _val: any) { return this; },
    lt(_col: string, _val: any) { return this; },
    gte(_col: string, _val: any) { return this; },
    lte(_col: string, _val: any) { return this; },
    or(_expr: string) { return this; },
    order(_col: string, _opts?: any) { return this; },
    in(_col: string, _vals: any[]) { return this; },
    range(_from: number, _to: number) { return this; },
    limit(_n: number) { return this; },
    async single() { return { data: null, error: null }; },
    async maybeSingle() { return { data: null, error: null }; },
  } as any;
  return {
    auth,
    from(_table: string) { return query; },
  };
}

export function getPublicSupabaseConfig() {
  // 필요 시 서버 로직에서 직접 존재 여부를 체크할 수 있도록
  // 존재하지 않으면 기본값 null로 반환하도록 변경
  if (!(hasSupabasePublicEnv() || hasHardcodedSupabase())) {
    return { url: '', key: '' } as any;
  }
  const env = hasSupabasePublicEnv() ? getSupabasePublicEnvOrThrow() : { url: HARDCODED_SUPABASE_URL, key: HARDCODED_SUPABASE_ANON_KEY };
  return env;
}

export function createPublicSupabaseClient() {
  if (hasSupabasePublicEnv() || hasHardcodedSupabase()) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || HARDCODED_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || HARDCODED_SUPABASE_ANON_KEY;
    return createClient(url!, key!);
  }
  return createSupabaseStub();
}
