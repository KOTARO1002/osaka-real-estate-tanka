"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth";
import {
  taskFormSchema,
  normalizeTask,
  type TaskFormValues,
} from "@/lib/validations/task";

export type TaskActionResult = { ok: true } | { ok: false; error: string };

/** タイムラインに1行追加。 */
async function logActivity(dealId: string, staffId: string, body: string) {
  const supabase = await createClient();
  await supabase
    .from("deal_activities")
    .insert({ deal_id: dealId, staff_id: staffId, body });
}

/** 手動タスクを追加する。 */
export async function addTask(
  dealId: string,
  values: TaskFormValues
): Promise<TaskActionResult> {
  const staff = await requireStaff();
  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "入力内容に誤りがあります。" };
  }
  const v = normalizeTask(parsed.data);

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    deal_id: dealId,
    title: v.title,
    due_date: v.due_date,
    category: v.category,
    assignee_id: v.assignee_id,
    auto_generated: false,
  });
  if (error) return { ok: false, error: "タスクの追加に失敗しました。" };

  await logActivity(dealId, staff.id, `${staff.name} がタスク「${v.title}」を追加しました`);
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/");
  return { ok: true };
}

/** タスクの完了状態を切り替える。 */
export async function toggleTask(
  taskId: string,
  dealId: string,
  isDone: boolean
): Promise<TaskActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ is_done: isDone, done_at: isDone ? new Date().toISOString() : null })
    .eq("id", taskId);
  if (error) return { ok: false, error: "更新に失敗しました。" };

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/");
  return { ok: true };
}

/** タスクを編集する。手動編集フラグを立て、逆算の上書き対象から外す。 */
export async function updateTask(
  taskId: string,
  dealId: string,
  values: TaskFormValues
): Promise<TaskActionResult> {
  await requireStaff();
  const parsed = taskFormSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "入力内容に誤りがあります。" };
  }
  const v = normalizeTask(parsed.data);

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      title: v.title,
      due_date: v.due_date,
      category: v.category,
      assignee_id: v.assignee_id,
      manually_edited: true,
    })
    .eq("id", taskId);
  if (error) return { ok: false, error: "更新に失敗しました。" };

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/");
  return { ok: true };
}

/** タスクを削除する。 */
export async function deleteTask(
  taskId: string,
  dealId: string
): Promise<TaskActionResult> {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return { ok: false, error: "削除に失敗しました。" };

  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/");
  return { ok: true };
}
