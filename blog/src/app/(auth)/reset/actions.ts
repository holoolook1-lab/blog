"use server";
import { headers } from "next/headers";
import { getServerSupabase } from "@/lib/supabase/server";

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; message?: string }>{
  try {
    const supabase = await getServerSupabase();
    if (!supabase) return { ok: false, message: "Supabase 초기화 오류" };
    const h = await headers();
    const origin = h.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3010";
    const redirectTo = `${origin}/auth/callback?redirect=/reset/confirm&flow=recovery&type=recovery`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return { ok: false, message: error.message || "재설정 이메일 전송 실패" };
    return { ok: true, message: "재설정 이메일을 발송했습니다. 메일함을 확인하세요." };
  } catch (e: any) {
    return { ok: false, message: e?.message || "알 수 없는 오류가 발생했습니다" };
  }
}

export async function updatePassword(newPassword: string): Promise<{ ok: boolean; message?: string }>{
  try {
    const supabase = await getServerSupabase();
    if (!supabase) return { ok: false, message: "Supabase 초기화 오류" };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, message: error.message || "비밀번호 변경 실패" };
    return { ok: true, message: "비밀번호가 변경되었습니다. 다시 로그인하세요." };
  } catch (e: any) {
    return { ok: false, message: e?.message || "알 수 없는 오류가 발생했습니다" };
  }
}

