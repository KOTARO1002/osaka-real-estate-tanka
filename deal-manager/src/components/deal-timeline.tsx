import { formatDateJa } from "@/lib/format";
import type { DealActivityRow } from "@/lib/supabase/types";
import type { StaffMini } from "@/lib/queries/deals";

type Activity = DealActivityRow & { staff: StaffMini | null };

/** 案件の更新履歴（タイムライン）。新しい順に表示する。 */
export function DealTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        まだ履歴はありません。
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 border-l pl-4">
      {activities.map((a) => (
        <li key={a.id} className="relative">
          <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
          <p className="text-sm">{a.body}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDateJa(a.created_at, "M月d日(E) HH:mm")}
          </p>
        </li>
      ))}
    </ol>
  );
}
