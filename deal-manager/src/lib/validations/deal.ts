import { z } from "zod";

import {
  DEAL_STATUSES,
  DEAL_TYPES,
  LOAN_STATUSES,
  TRANSACTION_SIDES,
} from "@/lib/domain";
import type {
  DealStatus,
  DealType,
  LoanStatus,
  TransactionSide,
} from "@/lib/supabase/types";

/**
 * 案件フォームの入力スキーマ。
 * react-hook-form と相性を良くするため、フォーム上は全項目を「文字列」で扱う
 * （price や日付、未設定項目は空文字）。DBへ渡す前に normalizeDeal で変換する。
 */
export const dealFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "案件名を入力してください")
    .max(120, "案件名が長すぎます"),
  deal_type: z.enum(DEAL_TYPES as [DealType, ...DealType[]]),
  transaction_side: z.enum(
    TRANSACTION_SIDES as [TransactionSide, ...TransactionSide[]]
  ),
  status: z.enum(DEAL_STATUSES as [DealStatus, ...DealStatus[]]),
  loan_status: z.enum(LOAN_STATUSES as [LoanStatus, ...LoanStatus[]]),
  customer_name: z.string().max(120),
  property_address: z.string().max(200),
  price: z
    .string()
    .refine(
      (v) => v === "" || (/^\d+$/.test(v) && Number.isFinite(Number(v))),
      "価格は半角数字で入力してください"
    ),
  assignee_id: z.string(),
  sub_assignee_id: z.string(),
  bank: z.string().max(80),
  contract_date: z
    .string()
    .refine(
      (v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "日付の形式が正しくありません"
    ),
  settlement_date: z
    .string()
    .refine(
      (v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v),
      "日付の形式が正しくありません"
    ),
  memo: z.string().max(2000),
});

/** フォーム上の値（すべて文字列） */
export type DealFormValues = z.infer<typeof dealFormSchema>;

/** DBへ書き込むための正規化済みの値 */
export interface NormalizedDeal {
  name: string;
  deal_type: DealType;
  transaction_side: TransactionSide;
  status: DealStatus;
  loan_status: LoanStatus;
  customer_name: string | null;
  property_address: string | null;
  price: number | null;
  assignee_id: string | null;
  sub_assignee_id: string | null;
  bank: string | null;
  contract_date: string | null;
  settlement_date: string | null;
  memo: string | null;
}

const strOrNull = (v: string): string | null => {
  const t = v.trim();
  return t === "" ? null : t;
};

/** フォーム値をDB書き込み用に変換（空文字→null、価格→数値）。 */
export function normalizeDeal(values: DealFormValues): NormalizedDeal {
  return {
    name: values.name.trim(),
    deal_type: values.deal_type,
    transaction_side: values.transaction_side,
    status: values.status,
    loan_status: values.loan_status,
    customer_name: strOrNull(values.customer_name),
    property_address: strOrNull(values.property_address),
    price: values.price === "" ? null : Number(values.price),
    assignee_id: strOrNull(values.assignee_id),
    sub_assignee_id: strOrNull(values.sub_assignee_id),
    bank: strOrNull(values.bank),
    contract_date: strOrNull(values.contract_date),
    settlement_date: strOrNull(values.settlement_date),
    memo: strOrNull(values.memo),
  };
}

/** フォームの初期値（新規作成用） */
export const dealFormDefaults: DealFormValues = {
  name: "",
  deal_type: "売買仲介",
  transaction_side: "買主側",
  status: "反響・追客",
  loan_status: "事前審査前",
  customer_name: "",
  property_address: "",
  price: "",
  assignee_id: "",
  sub_assignee_id: "",
  bank: "",
  contract_date: "",
  settlement_date: "",
  memo: "",
};
