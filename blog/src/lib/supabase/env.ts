import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnvOrThrow, hasSupabasePublicEnv } from '@/lib/env';

function createSupabaseStub(): any {
  const noopSub = { subscription: { unsubscribe() {} } };
  const auth = {
    async getUser() { return { data: { user: null } }; },
    async getSession() { return { data: { session: null } }; },
    onAuthStateChange(_cb: any) { return { data: noopSub }; },
  };
  const query = {
    async select(_cols?: string) { return { data: [], error: new Error('supabase_env_missing') }; },
    async insert(_vals: any) { return { data: null, error: new Error('supabase_env_missing') }; },
    async update(_vals: any) { return { data: null, error: new Error('supabase_env_missing') }; },
    async delete() { return { data: null, error: new Error('supabase_env_missing') }; },
    eq(_col: string, _val: any) { return this; },
    order(_col: string, _opts?: any) { return this; },
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
  if (!hasSupabasePublicEnv()) {
    return { url: '', key: '' } as any;
  }
  return getSupabasePublicEnvOrThrow();
}

export function createPublicSupabaseClient() {
  if (hasSupabasePublicEnv()) {
    const { url, key } = getSupabasePublicEnvOrThrow();
    return createClient(url, key);
  }
  return createSupabaseStub();
}
