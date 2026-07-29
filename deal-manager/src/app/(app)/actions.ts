"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** ログアウトして /login へ戻る。 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
