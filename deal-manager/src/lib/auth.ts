import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { StaffRow } from "@/lib/supabase/types";

/**
 * ログイン中のユーザーに対応する staff レコードを返す。
 * 未ログイン、または staff レコードが無い場合は null。
 */
export async function getCurrentStaff(): Promise<StaffRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: staff } = await supabase
    .from("staff")
    .select("*")
    .eq("id", user.id)
    .single();

  return staff ?? null;
}

/**
 * ログイン必須ページで使うガード。未ログインなら /login へ飛ばす。
 * staff レコードが無い場合もログインへ（招待されていない扱い）。
 */
export async function requireStaff(): Promise<StaffRow> {
  const staff = await getCurrentStaff();
  if (!staff) {
    redirect("/login");
  }
  return staff;
}

/** admin 権限が必要なページ・操作で使うガード。 */
export async function requireAdmin(): Promise<StaffRow> {
  const staff = await requireStaff();
  if (staff.role !== "admin") {
    redirect("/");
  }
  return staff;
}
