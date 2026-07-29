import type { TaskCategory, TaskItemType } from "@/lib/supabase/types";

/** 逆算の基準となる日付フィールド */
export type BaseDateField = "contract_date" | "settlement_date";

/**
 * 逆算タスクのテンプレート定義。
 * offsetBusinessDays 営業日前（0 は当日）にタスク期限を設定する。
 * ここに項目を足すだけで自動生成タスクを増やせる。
 */
export interface TaskTemplate {
  /** 案件内で一意のキー（tasks.template_key に保存し、追従・重複判定に使う） */
  key: string;
  /** 起点となる日付 */
  base: BaseDateField;
  /** 起点から何営業日前か（0 = 当日） */
  offsetBusinessDays: number;
  /** タスク名 */
  title: string;
  /** カテゴリ */
  category: TaskCategory;
  /** 種別: 当日イベント（売買契約・決済）は due（期日/赤字）、準備作業は todo */
  itemType: TaskItemType;
}

/**
 * 契約日・決済日を起点とした逆算タスクテンプレート一覧。
 * TODO: 祝日は将来対応（現状は土日のみ営業日から除外）。
 */
export const TASK_TEMPLATES: TaskTemplate[] = [
  // ---- 売買契約日（contract_date）基準 ----
  {
    key: "contract_minus_7",
    base: "contract_date",
    offsetBusinessDays: 7,
    title: "重要事項説明書ドラフト完成",
    category: "契約前",
    itemType: "todo",
  },
  {
    key: "contract_minus_5",
    base: "contract_date",
    offsetBusinessDays: 5,
    title: "売買契約書ドラフト・特約確認",
    category: "契約前",
    itemType: "todo",
  },
  {
    key: "contract_minus_3",
    base: "contract_date",
    offsetBusinessDays: 3,
    title: "契約書類最終チェック・押印段取り",
    category: "契約前",
    itemType: "todo",
  },
  {
    key: "contract_minus_1",
    base: "contract_date",
    offsetBusinessDays: 1,
    title: "手付金授受・当日持ち物確認",
    category: "契約前",
    itemType: "todo",
  },
  {
    key: "contract_day",
    base: "contract_date",
    offsetBusinessDays: 0,
    title: "売買契約",
    category: "契約前",
    itemType: "due",
  },

  // ---- 決済・引渡し日（settlement_date）基準 ----
  {
    key: "settlement_minus_20",
    base: "settlement_date",
    offsetBusinessDays: 20,
    title: "ローン本申込",
    category: "契約〜決済",
    itemType: "todo",
  },
  {
    key: "settlement_minus_10",
    base: "settlement_date",
    offsetBusinessDays: 10,
    title: "融資本承認確認・金消契約日調整",
    category: "契約〜決済",
    itemType: "todo",
  },
  {
    key: "settlement_minus_5",
    base: "settlement_date",
    offsetBusinessDays: 5,
    title: "司法書士へ必要書類依頼・登記関係確認",
    category: "契約〜決済",
    itemType: "todo",
  },
  {
    key: "settlement_minus_2",
    base: "settlement_date",
    offsetBusinessDays: 2,
    title: "決済金額最終確定・精算書作成",
    category: "契約〜決済",
    itemType: "todo",
  },
  {
    key: "settlement_day",
    base: "settlement_date",
    offsetBusinessDays: 0,
    title: "決済・引渡し",
    category: "契約〜決済",
    itemType: "due",
  },
];
