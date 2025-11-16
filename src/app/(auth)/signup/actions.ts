"use server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function signupWithPassword(
  email: string,
  password: string,
  redirect?: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const supabase = await getServerSupabase();
    if (!supabase) return { ok: false, message: "Supabase 초기화 오류" };
    const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";
    const qp = new URLSearchParams();
    qp.set("flow", "signup");
    if (redirect) qp.set("redirect", redirect);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${site}/auth/callback?${qp.toString()}`,
      },
    });
    if (error) {
      const msg = error.message || "회원가입 실패";
      return { ok: false, message: msg };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, message: e?.message || "알 수 없는 오류가 발생했습니다" };
  }
}

