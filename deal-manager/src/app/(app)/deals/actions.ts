"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { requireStaff, requireAdmin, getCurrentStaff } from "@/lib/auth";
import {
  dealFormSchema,
  normalizeDeal,
  type DealFormValues,
} from "@/lib/validations/deal";
import { describeDealChanges } from "@/lib/activity";
import { getStaffList } from "@/lib/queries/deals";
import { syncAutoTasks } from "@/lib/task-engine";

export type ActionResult =
  | { ok: true; dealId: string }
  | { ok: false; error: string };

/** タイムラインに1行追加する内部ヘルパー。 */
async function logActivities(
  dealId: string,
  staffId: string | null,
  bodies: string[]
) {
  if (bodies.length === 0) return;
  const supabase = await createClient();
  await supabase
    .from("deal_activities")
    .insert(bodies.map((body) => ({ deal_id: dealId, staff_id: staffId, body })));
}

/** 新規案件を作成する。作成後、契約日・決済日があれば逆算タスクを生成する。 */
export async function createDeal(
  values: DealFormValues
): Promise<ActionResult> {
  const staff = await requireStaff();
  const parsed = dealFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "入力内容に誤りがあります。" };
  }
  const v = normalizeDeal(parsed.data);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .insert(v)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: "案件の作成に失敗しました。" };
  }

  await logActivities(data.id, staff.id, [
    `${staff.name} が案件を作成しました`,
  ]);

  // 契約日・決済日が入っていれば逆算タスクを自動生成
  await syncAutoTasks(data.id);

  revalidatePath("/deals");
  revalidatePath("/");
  return { ok: true, dealId: data.id };
}

/** 案件を更新する。変更点を履歴に残し、日付変更に応じて逆算タスクを追従させる。 */
export async function updateDeal(
  id: string,
  values: DealFormValues
): Promise<ActionResult> {
  const staff = await requireStaff();
  const parsed = dealFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "入力内容に誤りがあります。" };
  }
  const v = normalizeDeal(parsed.data);

  const supabase = await createClient();

  // 変更前の値を取得（履歴・日付追従の判定用）
  const { data: before } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .single();
  if (!before) {
    return { ok: false, error: "案件が見つかりません。" };
  }

  const { error } = await supabase.from("deals").update(v).eq("id", id);

  if (error) {
    return { ok: false, error: "案件の更新に失敗しました。" };
  }

  // 変更点を履歴に記録
  const staffList = await getStaffList();
  const messages = describeDealChanges(staff.name, before, v, staffList);
  await logActivities(id, staff.id, messages);

  // 契約日・決済日が変わっていたら逆算タスクを再計算して追従
  if (
    before.contract_date !== v.contract_date ||
    before.settlement_date !== v.settlement_date
  ) {
    await syncAutoTasks(id);
  }

  revalidatePath("/deals");
  revalidatePath(`/deals/${id}`);
  revalidatePath("/");
  return { ok: true, dealId: id };
}

/** 案件を削除する（admin のみ）。 */
export async function deleteDeal(id: string): Promise<void> {
  await requireAdmin();
  const supabase = await createClient();
  await supabase.from("deals").delete().eq("id", id);
  revalidatePath("/deals");
  revalidatePath("/");
  redirect("/deals");
}

/** 現在のスタッフを返す（クライアントからの権限判定補助）。 */
export async function whoAmI() {
  return getCurrentStaff();
}
