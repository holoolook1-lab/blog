import { createClient } from '@supabase/supabase-js';
import { getSupabasePublicEnvOrThrow, hasSupabasePublicEnv } from '@/lib/env';

// 환경변수가 없는 로컬 프리뷰를 위해 안전 스텁 제공
function createSupabaseStub(): any {
  const noopSub = { subscription: { unsubscribe() {} } };
  const auth = {
    async getUser() { return { data: { user: null } }; },
    async getSession() { return { data: { session: null } }; },
    onAuthStateChange(_cb: any) { return { data: noopSub }; },
    async setSession(_s: any) { return { data: { session: null }, error: null }; },
    async signInWithOAuth() { return { data: null, error: new Error('supabase_env_missing') }; },
    async signInWithPassword() { return { data: null, error: new Error('supabase_env_missing') }; },
    async signUp() { return { data: null, error: new Error('supabase_env_missing') }; },
    async signOut() { return { error: null }; },
    async resetPasswordForEmail() { return { data: null, error: new Error('supabase_env_missing') }; },
    async updateUser() { return { data: null, error: new Error('supabase_env_missing') }; },
    async exchangeCodeForSession() { return { data: null, error: new Error('supabase_env_missing') }; },
    async verifyOtp() { return { data: null, error: new Error('supabase_env_missing') }; },
  };
  const query = {
    async select(_cols?: string) { return { data: [], error: new Error('supabase_env_missing') }; },
    async insert(_vals: any) { return { data: null, error: new Error('supabase_env_missing') }; },
    async update(_vals: any) { return { data: null, error: new Error('supabase_env_missing') }; },
    async upsert(_vals: any) { return { data: null, error: null }; },
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

export const supabase: any = (() => {
  if (hasSupabasePublicEnv()) {
    const { url, key } = getSupabasePublicEnvOrThrow();
    return createClient(url, key);
  }
  return createSupabaseStub();
})();
