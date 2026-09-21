import { differenceInCalendarDays, parseISO, isValid } from "date-fns";

export type DueStatus = "overdue" | "today" | "soon" | "future" | "none";

/**
 * 期限日と当日を比較して緊急度を返す。
 * overdue=期限超過, today=当日, soon=3日以内, future=それ以降, none=期限なし。
 */
export function getDueStatus(
  dueDate: string | null | undefined,
  today: Date = new Date()
): DueStatus {
  if (!dueDate) return "none";
  const d = parseISO(dueDate);
  if (!isValid(d)) return "none";
  const diff = differenceInCalendarDays(d, today);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  if (diff <= 3) return "soon";
  return "future";
}

/** 期限ステータスに対応するテキスト色クラス */
export const DUE_STATUS_CLASS: Record<DueStatus, string> = {
  overdue: "text-destructive font-medium",
  today: "text-warning font-medium",
  soon: "text-foreground",
  future: "text-muted-foreground",
  none: "text-muted-foreground",
};
