import { format, isValid, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

/** ISO文字列(YYYY-MM-DD)や Date を安全に Date へ変換。無効なら null。 */
function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return isValid(d) ? d : null;
}

/** 日付を「2026年7月22日(火)」形式で表示。 */
export function formatDateJa(
  value: string | Date | null | undefined,
  pattern = "yyyy年M月d日(E)"
): string {
  const d = toDate(value);
  if (!d) return "—";
  return format(d, pattern, { locale: ja });
}

/** 日付を短縮「7/22(火)」形式で表示。 */
export function formatDateShort(
  value: string | Date | null | undefined
): string {
  const d = toDate(value);
  if (!d) return "—";
  return format(d, "M/d(E)", { locale: ja });
}

/** input[type=date] 用の YYYY-MM-DD 文字列。 */
export function toDateInputValue(
  value: string | Date | null | undefined
): string {
  const d = toDate(value);
  if (!d) return "";
  return format(d, "yyyy-MM-dd");
}

/**
 * 価格（円, bigint）を「4,800万円」形式で表示。
 * 1万円未満や端数がある場合は「円」表記にフォールバック。
 */
export function formatPrice(value: number | null | undefined): string {
  if (value == null) return "—";
  if (value >= 10000 && value % 10000 === 0) {
    return `${(value / 10000).toLocaleString("ja-JP")}万円`;
  }
  if (value >= 10000) {
    // 端数あり: 「4,850.5万円」ではなく「48,500,000円」で正確に
    return `${value.toLocaleString("ja-JP")}円`;
  }
  return `${value.toLocaleString("ja-JP")}円`;
}
