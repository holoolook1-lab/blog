"use server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function loginWithPassword(
  email: string,
  password: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) return { ok: false, message: "Supabase 초기화 오류" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message || "로그인 실패";
      if (msg.toLowerCase().includes("confirm") || msg.toLowerCase().includes("verified")) {
        return { ok: false, message: "이메일 확인 후 로그인할 수 있습니다." };
      }
      return { ok: false, message: msg };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || "알 수 없는 오류가 발생했습니다" };
  }
}

