"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { StaffRole } from "@/lib/supabase/types";

export type StaffActionResult = { ok: true } | { ok: false; error: string };

const inviteSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください").max(60),
  email: z.string().trim().email("メールアドレスが正しくありません"),
  role: z.enum(["admin", "member"]),
});

export type InviteInput = z.infer<typeof inviteSchema>;

/**
 * スタッフを招待する（admin のみ）。
 * サービスロールで auth ユーザーを作成し、招待メールを送信、staff レコードを作成する。
 */
export async function inviteStaff(
  input: InviteInput
): Promise<StaffActionResult> {
  await requireAdmin();
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "入力エラー" };
  }
  const { name, email, role } = parsed.data;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error:
        "サービスロールキーが未設定のため招待できません。環境変数を設定してください。",
    };
  }

  // 招待メールを送信しつつ auth ユーザーを作成
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);
  if (error || !data.user) {
    return {
      ok: false,
      error: "招待に失敗しました。既に登録済みの可能性があります。",
    };
  }

  // staff レコードを作成
  const { error: staffError } = await admin.from("staff").insert({
    id: data.user.id,
    name,
    email,
    role,
  });
  if (staffError) {
    return { ok: false, error: "スタッフ情報の登録に失敗しました。" };
  }

  revalidatePath("/staff");
  return { ok: true };
}

/** ロールを変更する（admin のみ、自分自身の降格は不可）。 */
export async function updateStaffRole(
  staffId: string,
  role: StaffRole
): Promise<StaffActionResult> {
  const me = await requireAdmin();
  if (me.id === staffId && role !== "admin") {
    return { ok: false, error: "自分自身を管理者から外すことはできません。" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("staff")
    .update({ role })
    .eq("id", staffId);
  if (error) return { ok: false, error: "ロールの変更に失敗しました。" };

  revalidatePath("/staff");
  return { ok: true };
}

/** スタッフを削除する（admin のみ、自分自身は削除不可）。 */
export async function deleteStaff(
  staffId: string
): Promise<StaffActionResult> {
  const me = await requireAdmin();
  if (me.id === staffId) {
    return { ok: false, error: "自分自身は削除できません。" };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      ok: false,
      error: "サービスロールキーが未設定のため削除できません。",
    };
  }

  // auth ユーザーを削除（staff は ON DELETE CASCADE で連動削除）
  const { error } = await admin.auth.admin.deleteUser(staffId);
  if (error) return { ok: false, error: "削除に失敗しました。" };

  revalidatePath("/staff");
  return { ok: true };
}
