import type { NormalizedDeal } from "@/lib/validations/deal";
import type { StaffMini } from "@/lib/queries/deals";
import { formatPrice } from "@/lib/format";

/** 変更履歴に出す項目ラベル */
const FIELD_LABELS: Record<keyof NormalizedDeal, string> = {
  name: "案件名",
  deal_type: "案件種別",
  transaction_side: "取引形態",
  status: "ステータス",
  loan_status: "融資状況",
  customer_name: "顧客名",
  property_address: "物件所在地",
  price: "価格",
  assignee_id: "主担当",
  sub_assignee_id: "副担当",
  bank: "採用銀行",
  contract_date: "契約日",
  settlement_date: "決済日",
  memo: "備考",
};

/** 値を履歴表示用の文字列に変換 */
function displayValue(
  field: keyof NormalizedDeal,
  value: unknown,
  staffMap: Map<string, string>
): string {
  if (value === null || value === undefined || value === "") return "未設定";
  if (field === "assignee_id" || field === "sub_assignee_id") {
    return staffMap.get(String(value)) ?? "不明なスタッフ";
  }
  if (field === "price") {
    return formatPrice(Number(value));
  }
  return String(value);
}

/**
 * 案件の旧値（DB行）と新値（正規化済み）を比較し、変更点ごとに履歴メッセージを組み立てる。
 * 例:「山田 太郎 が採用銀行を「三井住友銀行」に変更しました」
 */
export function describeDealChanges(
  actorName: string,
  before: Record<string, unknown>,
  after: NormalizedDeal,
  staffList: StaffMini[]
): string[] {
  const staffMap = new Map(staffList.map((s) => [s.id, s.name]));
  const messages: string[] = [];

  (Object.keys(FIELD_LABELS) as (keyof NormalizedDeal)[]).forEach((field) => {
    const label = FIELD_LABELS[field];
    const prev = before[field] ?? null;
    const next = after[field] ?? null;
    // null と "" を同一視して比較
    const prevNorm = prev === "" ? null : prev;
    const nextNorm = next === "" ? null : next;
    if (String(prevNorm) === String(nextNorm)) return;

    if (nextNorm === null) {
      messages.push(`${actorName} が${label}を未設定にしました`);
    } else {
      const to = displayValue(field, nextNorm, staffMap);
      messages.push(`${actorName} が${label}を「${to}」に変更しました`);
    }
  });

  return messages;
}
