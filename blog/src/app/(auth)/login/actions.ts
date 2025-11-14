"use server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ ok: boolean; message?: string; access_token?: string; refresh_token?: string }> {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) return { ok: false, message: "Supabase 초기화 오류" };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message || "로그인 실패";
      if (msg.toLowerCase().includes("confirm") || msg.toLowerCase().includes("verified")) {
        return { ok: false, message: "이메일 확인 후 로그인할 수 있습니다." };
      }
      return { ok: false, message: msg };
    }
    const at = (data as any)?.session?.access_token;
    const rt = (data as any)?.session?.refresh_token;
    return { ok: true, access_token: at, refresh_token: rt };
  } catch (e: any) {
    return { ok: false, message: e?.message || "알 수 없는 오류가 발생했습니다" };
  }
}
