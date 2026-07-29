import { createClient } from "@/lib/supabase/server";
import type {
  DealActivityRow,
  DealRow,
  StaffRow,
  TaskRow,
} from "@/lib/supabase/types";

/** 一覧表示に必要な担当者名の最小情報 */
export type StaffMini = Pick<StaffRow, "id" | "name">;

/** 一覧行: 案件 + 担当者名 + 未完タスク数 */
export type DealListItem = DealRow & {
  assignee: StaffMini | null;
  sub_assignee: StaffMini | null;
  open_task_count: number;
};

/** 詳細: 案件 + 担当者 + タスク一覧 + タイムライン */
export type DealDetail = DealRow & {
  assignee: StaffMini | null;
  sub_assignee: StaffMini | null;
  tasks: TaskRow[];
  activities: (DealActivityRow & { staff: StaffMini | null })[];
};

// 担当者2種を別々のFK経由で結合するためのselect式
const ASSIGNEE_SELECT =
  "assignee:staff!deals_assignee_id_fkey(id,name), sub_assignee:staff!deals_sub_assignee_id_fkey(id,name)";

// 埋め込み結合はリレーション定義を型に持たせていないため、
// クエリ結果は手書きの型へキャストして扱う。
type DealListRaw = DealRow & {
  assignee: StaffMini | null;
  sub_assignee: StaffMini | null;
  tasks: Pick<TaskRow, "id" | "is_done" | "item_type">[] | null;
};

/** 案件一覧を取得（未完タスク数付き）。 */
export async function getDeals(): Promise<DealListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(`*, ${ASSIGNEE_SELECT}, tasks(id, is_done, item_type)`)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as DealListRaw[];
  return rows.map(({ tasks, assignee, sub_assignee, ...deal }) => ({
    ...deal,
    assignee: assignee ?? null,
    sub_assignee: sub_assignee ?? null,
    // 未完タスク数は「やること(todo)」のみ数える（期日は完了概念がないため）
    open_task_count: (tasks ?? []).filter(
      (t) => t.item_type === "todo" && !t.is_done
    ).length,
  }));
}

/** 案件を1件取得（担当者・タスク・タイムライン込み）。存在しなければ null。 */
export async function getDealById(id: string): Promise<DealDetail | null> {
  const supabase = await createClient();

  // 入れ子の埋め込み結合は環境によって失敗するため、クエリを分けて取得する。
  const { data: dealData, error } = await supabase
    .from("deals")
    .select(`*, ${ASSIGNEE_SELECT}`)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!dealData) return null;

  const [{ data: taskData }, { data: activityData }, staff] = await Promise.all(
    [
      supabase.from("tasks").select("*").eq("deal_id", id),
      supabase
        .from("deal_activities")
        .select("*")
        .eq("deal_id", id)
        .order("created_at", { ascending: false }),
      getStaffList(),
    ]
  );

  const nameById = new Map(staff.map((s) => [s.id, s.name]));
  const { assignee, sub_assignee, ...deal } = dealData as DealRow & {
    assignee: StaffMini | null;
    sub_assignee: StaffMini | null;
  };

  return {
    ...(deal as DealRow),
    assignee: assignee ?? null,
    sub_assignee: sub_assignee ?? null,
    tasks: ((taskData ?? []) as TaskRow[]).slice().sort(sortTasks),
    activities: ((activityData ?? []) as DealActivityRow[]).map((a) => ({
      ...a,
      staff: a.staff_id
        ? { id: a.staff_id, name: nameById.get(a.staff_id) ?? "不明" }
        : null,
    })),
  };
}

/** タスク並び順: 未完を先に、期限昇順（null は最後）、作成順。 */
export function sortTasks(a: TaskRow, b: TaskRow): number {
  if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
  if (a.due_date && b.due_date) {
    if (a.due_date !== b.due_date) return a.due_date < b.due_date ? -1 : 1;
  } else if (a.due_date || b.due_date) {
    return a.due_date ? -1 : 1;
  }
  return a.created_at < b.created_at ? -1 : 1;
}

/** スタッフ一覧（担当者セレクト用）。 */
export async function getStaffList(): Promise<StaffMini[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select("id, name")
    .order("name");
  if (error) throw error;
  return (data ?? []) as StaffMini[];
}
