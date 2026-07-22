import type {
  DealStatus,
  DealType,
  LoanStatus,
  TaskCategory,
  TaskItemType,
  TransactionSide,
} from "@/lib/supabase/types";

/**
 * 案件ステータスの表示順序（カンバンの列順・進捗フェーズ順）。
 */
export const DEAL_STATUSES: DealStatus[] = [
  "反響・追客",
  "媒介契約",
  "売買契約準備",
  "売買契約済",
  "融資本審査",
  "金消・決済準備",
  "決済完了",
  "失注・見送り",
];

/** ステータスごとの表示色（globals.css の CSS変数と対応） */
export const DEAL_STATUS_COLORS: Record<DealStatus, string> = {
  "反響・追客": "var(--status-lead)",
  "媒介契約": "var(--status-mediation)",
  "売買契約準備": "var(--status-contract-prep)",
  "売買契約済": "var(--status-contracted)",
  "融資本審査": "var(--status-loan-review)",
  "金消・決済準備": "var(--status-settlement-prep)",
  "決済完了": "var(--status-done)",
  "失注・見送り": "var(--status-lost)",
};

export const DEAL_TYPES: DealType[] = ["売買仲介", "買取再販", "リノベ"];

export const TRANSACTION_SIDES: TransactionSide[] = [
  "売主側",
  "買主側",
  "両手",
];

export const LOAN_STATUSES: LoanStatus[] = [
  "事前審査前",
  "事前承認",
  "本審査中",
  "本承認",
  "融資利用なし",
];

export const TASK_CATEGORIES: TaskCategory[] = [
  "契約前",
  "契約〜決済",
  "決済後",
  "その他",
];

/** タスクカテゴリごとのバッジ色 */
export const TASK_CATEGORY_COLORS: Record<TaskCategory, string> = {
  "契約前": "#0ea5e9",
  "契約〜決済": "#58a1aa",
  "決済後": "#8b5cf6",
  "その他": "#94a3b8",
};

/** タスク種別ラベル（todo=やること / due=期日） */
export const TASK_ITEM_TYPE_LABELS: Record<TaskItemType, string> = {
  todo: "やること",
  due: "期日",
};

/**
 * 追加ダイアログのプルダウン候補。
 * 「必ずあるイベント」＝期日(due, 赤字)、「よく使うやること」＝todo。
 * type は初期値で、ダイアログの種別トグルで上書き可能。
 */
export interface TaskPreset {
  title: string;
  type: TaskItemType;
  category: TaskCategory;
}

export const EVENT_PRESETS: TaskPreset[] = [
  { title: "売買契約", type: "due", category: "契約前" },
  { title: "決済・引渡し", type: "due", category: "契約〜決済" },
  { title: "ローン本申込", type: "due", category: "契約〜決済" },
  { title: "金消契約", type: "due", category: "契約〜決済" },
  { title: "手付金授受", type: "due", category: "契約前" },
  { title: "融資事前審査", type: "due", category: "契約前" },
  { title: "融資本承認", type: "due", category: "契約〜決済" },
];

export const TODO_PRESETS: TaskPreset[] = [
  { title: "重要事項説明の準備", type: "todo", category: "契約前" },
  { title: "売買契約書ドラフト・特約確認", type: "todo", category: "契約前" },
  { title: "契約書類最終チェック", type: "todo", category: "契約前" },
  { title: "内見同行", type: "todo", category: "その他" },
  { title: "司法書士へ書類依頼", type: "todo", category: "契約〜決済" },
  { title: "精算書作成", type: "todo", category: "契約〜決済" },
  { title: "顧客へ連絡", type: "todo", category: "その他" },
];

/** 採用銀行のよく使う候補（自由入力のサジェスト用） */
export const BANK_SUGGESTIONS: string[] = [
  "三井住友銀行",
  "三菱UFJ銀行",
  "みずほ銀行",
  "りそな銀行",
  "関西みらい銀行",
  "池田泉州銀行",
  "近畿産業信用組合",
  "住信SBIネット銀行",
  "auじぶん銀行",
  "ARUHI",
  "フラット35",
];
