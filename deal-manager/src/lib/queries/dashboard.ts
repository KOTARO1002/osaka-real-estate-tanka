import { createClient } from "@/lib/supabase/server";
import type { DealRow, TaskItemType, TaskRow } from "@/lib/supabase/types";

/** ダッシュボード用: タスク + 所属案件名 + 担当者名 */
export type DashboardTask = TaskRow & {
  deal: { id: string; name: string; status: DealRow["status"] } | null;
  assignee_name: string | null;
};

/** 全体カレンダー用: 日付を持つ全案件の予定・やること */
export type CalendarItem = {
  id: string;
  deal_id: string;
  deal_name: string;
  title: string;
  due_date: string;
  item_type: TaskItemType;
  is_done: boolean;
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

/**
 * 日付を持つ全案件の予定・やることを取得（全体カレンダー用）。
 * 埋め込み結合は使わず、案件名・担当名はマップで解決する。
 */
export async function getCalendarItems(): Promise<CalendarItem[]> {
  const supabase = await createClient();

  const [{ data: taskData, error }, { data: dealData }, { data: staffData }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select(
          "id, deal_id, title, due_date, item_type, is_done, assignee_id"
        )
        .not("due_date", "is", null),
      supabase.from("deals").select("id, name"),
      supabase.from("staff").select("id, name"),
    ]);

  if (error) throw error;

  const dealName = new Map(
    ((dealData ?? []) as { id: string; name: string }[]).map((d) => [
      d.id,
      d.name,
    ])
  );
  const staffName = new Map(
    ((staffData ?? []) as { id: string; name: string }[]).map((s) => [
      s.id,
      s.name,
    ])
  );

  type TaskLite = Pick<
    TaskRow,
    "id" | "deal_id" | "title" | "due_date" | "item_type" | "is_done" | "assignee_id"
  >;

  return ((taskData ?? []) as TaskLite[]).map((t) => ({
    id: t.id,
    deal_id: t.deal_id,
    deal_name: dealName.get(t.deal_id) ?? "",
    title: t.title,
    due_date: t.due_date as string,
    item_type: t.item_type,
    is_done: t.is_done,
    assignee_name: t.assignee_id ? staffName.get(t.assignee_id) ?? null : null,
  }));
}
