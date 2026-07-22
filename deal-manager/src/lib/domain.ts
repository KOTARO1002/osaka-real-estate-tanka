import type {
  DealStatus,
  DealType,
  LoanStatus,
  TaskCategory,
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
