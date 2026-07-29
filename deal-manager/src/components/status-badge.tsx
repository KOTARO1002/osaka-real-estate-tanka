import { DEAL_STATUS_COLORS } from "@/lib/domain";
import type { DealStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/** 案件ステータスを色付きドット＋ラベルで表示する。 */
export function StatusBadge({
  status,
  className,
}: {
  status: DealStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: DEAL_STATUS_COLORS[status] }}
      />
      {status}
    </span>
  );
}
