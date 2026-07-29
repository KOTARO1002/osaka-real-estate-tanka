import { subBusinessDays, format, parseISO, isValid } from "date-fns";

import { createClient } from "@/lib/supabase/server";
import { TASK_TEMPLATES, type TaskTemplate } from "@/lib/task-templates";
import type { Database, TaskRow } from "@/lib/supabase/types";

type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];

/**
 * 期日逆算エンジン。
 *
 * 案件の契約日・決済日をもとに、TASK_TEMPLATES に沿った逆算タスクを
 * 生成・追従・削除する。営業日ベース（土日除外）で期限を計算する。
 * ※ 祝日は将来対応（TODO）。
 *
 * ルール:
 *   - 起点日が入っていれば、対応テンプレートのタスクを生成/期限追従。
 *   - 手動編集済み（manually_edited）または完了済み（is_done）の自動タスクは
 *     上書き・削除しない（担当者の作業を尊重する）。
 *   - 起点日が外れた場合、未着手かつ未編集の自動タスクは削除する。
 */
export async function syncAutoTasks(dealId: string): Promise<void> {
  const supabase = await createClient();

  // 案件の起点日と主担当を取得
  const { data: deal } = await supabase
    .from("deals")
    .select("contract_date, settlement_date, assignee_id")
    .eq("id", dealId)
    .single();
  if (!deal) return;

  const baseDates: Record<string, string | null> = {
    contract_date: deal.contract_date,
    settlement_date: deal.settlement_date,
  };

  // 既存の自動生成タスクを template_key で引けるように
  const { data: existingRows } = await supabase
    .from("tasks")
    .select("*")
    .eq("deal_id", dealId)
    .eq("auto_generated", true);
  const existing = new Map<string, TaskRow>();
  for (const t of (existingRows ?? []) as TaskRow[]) {
    if (t.template_key) existing.set(t.template_key, t);
  }

  const toInsert: TaskInsert[] = [];
  const toUpdate: Array<{ id: string; due_date: string }> = [];
  const toDelete: string[] = [];

  for (const tpl of TASK_TEMPLATES) {
    const baseValue = baseDates[tpl.base];
    const current = existing.get(tpl.key);
    const dueDate = baseValue ? computeDueDate(baseValue, tpl) : null;

    if (dueDate) {
      // 起点日あり: 生成 or 期限追従
      if (!current) {
        toInsert.push({
          deal_id: dealId,
          title: tpl.title,
          due_date: dueDate,
          category: tpl.category,
          item_type: tpl.itemType,
          assignee_id: deal.assignee_id,
          auto_generated: true,
          template_key: tpl.key,
        });
      } else if (
        !current.manually_edited &&
        !current.is_done &&
        current.due_date !== dueDate
      ) {
        // 未編集・未完なら期限を追従させる
        toUpdate.push({ id: current.id, due_date: dueDate });
      }
    } else {
      // 起点日なし: 未着手・未編集の自動タスクは削除
      if (current && !current.manually_edited && !current.is_done) {
        toDelete.push(current.id);
      }
    }
  }

  // まとめて反映
  if (toInsert.length > 0) {
    await supabase.from("tasks").insert(toInsert);
  }
  for (const u of toUpdate) {
    await supabase.from("tasks").update({ due_date: u.due_date }).eq("id", u.id);
  }
  if (toDelete.length > 0) {
    await supabase.from("tasks").delete().in("id", toDelete);
  }
}

/** 起点日から営業日を逆算し、YYYY-MM-DD を返す。 */
function computeDueDate(baseDate: string, tpl: TaskTemplate): string | null {
  const d = parseISO(baseDate);
  if (!isValid(d)) return null;
  // offset 営業日前（0 は当日）。土日はスキップ。
  const due =
    tpl.offsetBusinessDays === 0
      ? d
      : subBusinessDays(d, tpl.offsetBusinessDays);
  return format(due, "yyyy-MM-dd");
}
