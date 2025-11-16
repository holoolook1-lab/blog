"use client";
import { supabase } from "@/lib/supabase/client";

export async function ensureProfileOnce() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return;
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!existing) {
    await supabase
      .from("profiles")
      .upsert({ id: user.id }, { onConflict: "id" });
  }
}

export async function ensureProfileGuarded() {
  try {
    if (typeof window !== "undefined" && localStorage.getItem("profile:ensured") === "1") return;
    await ensureProfileOnce();
    if (typeof window !== "undefined") localStorage.setItem("profile:ensured", "1");
  } catch {
    // ignore: 서버 트리거/백필이 커버
  }
}

