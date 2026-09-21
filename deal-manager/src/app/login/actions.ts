"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * メール＋パスワードでログインする Server Action。
 * サインアップは招待制のため用意しない（スタッフ管理画面から管理者が招待）。
 */
export async function login(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  redirect("/");
}
