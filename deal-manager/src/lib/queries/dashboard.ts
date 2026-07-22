import { createClient } from "@/lib/supabase/server";
import type { DealRow, TaskRow } from "@/lib/supabase/types";

/** ダッシュボード用: タスク + 所属案件名 + 担当者名 */
export type DashboardTask = TaskRow & {
  deal: { id: string; name: string; status: DealRow["status"] } | null;
  assignee_name: string | null;
};

/** ダッシュボード用: 直近の契約日・決済日サマリ */
export type UpcomingKeyDate = {
  deal_id: string;
  deal_name: string;
  kind: "契約" | "決済";
  date: string;
};

type TaskWithDealRaw = TaskRow & {
  deal: { id: string; name: string; status: DealRow["status"] } | null;
  assignee: { name: string } | null;
};

/**
 * 全案件から未完タスクを横断取得（期限昇順、期限なしは末尾）。
 * ダッシュボードの「今日／今週のタスク」集約に使う。
 */
export async function getOpenTasksAcrossDeals(): Promise<DashboardTask[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select(
      `*, deal:deals(id, name, status), assignee:staff!tasks_assignee_id_fkey(name)`
    )
    .eq("is_done", false)
    // 「やること(todo)」のみ集約（期日は完了概念がないため直近サマリで別扱い）
    .eq("item_type", "todo")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as TaskWithDealRaw[];
  return rows.map(({ assignee, ...t }) => ({
    ...t,
    assignee_name: assignee?.name ?? null,
  }));
}

/**
 * 今日以降の契約日・決済日を近い順に取得（カレンダー的サマリ用）。
 */
export async function getUpcomingKeyDates(
  todayISO: string,
  limit = 8
): Promise<UpcomingKeyDate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select("id, name, contract_date, settlement_date")
    .or(`contract_date.gte.${todayISO},settlement_date.gte.${todayISO}`);

  if (error) throw error;

  const rows = (data ?? []) as Pick<
    DealRow,
    "id" | "name" | "contract_date" | "settlement_date"
  >[];

  const items: UpcomingKeyDate[] = [];
  for (const d of rows) {
    if (d.contract_date && d.contract_date >= todayISO) {
      items.push({
        deal_id: d.id,
        deal_name: d.name,
        kind: "契約",
        date: d.contract_date,
      });
    }
    if (d.settlement_date && d.settlement_date >= todayISO) {
      items.push({
        deal_id: d.id,
        deal_name: d.name,
        kind: "決済",
        date: d.settlement_date,
      });
    }
  }

  return items.sort((a, b) => (a.date < b.date ? -1 : 1)).slice(0, limit);
}
