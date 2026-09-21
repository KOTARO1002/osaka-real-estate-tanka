"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import type { CalendarItem } from "@/lib/queries/dashboard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function iso(d: Date) {
  return format(d, "yyyy-MM-dd");
}

/**
 * ダッシュボードの全体カレンダー。
 * 全案件の期日（赤）・やること（グレー）を月表示で集約し、
 * 項目タップでその案件詳細へ遷移する。
 */
export function DashboardCalendar({ items }: { items: CalendarItem[] }) {
  const router = useRouter();
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));

  const byDate = useMemo(() => {
    const m = new Map<string, CalendarItem[]>();
    for (const it of items) {
      const arr = m.get(it.due_date) ?? [];
      arr.push(it);
      m.set(it.due_date, arr);
    }
    return m;
  }, [items]);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const out: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      out.push(d);
      d = addDays(d, 1);
    }
    return out;
  }, [cursor]);

  const today = new Date();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
          <CalendarDays className="h-4 w-4 text-primary" />
          全体カレンダー
        </h2>
        <div className="flex items-center gap-2">
          <span className="min-w-[92px] text-center text-sm font-medium tabular-nums">
            {format(cursor, "yyyy年 M月")}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="前の月"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="次の月"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={() => setCursor(startOfMonth(new Date()))}
          >
            今日
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-7 bg-muted/50">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={cn(
                "py-1.5 text-center text-[11px] font-medium text-muted-foreground",
                i === 0 && "text-destructive",
                i === 6 && "text-blue-600"
              )}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const key = iso(d);
            const dayItems = byDate.get(key) ?? [];
            const inMonth = isSameMonth(d, cursor);
            const dow = d.getDay();
            return (
              <div
                key={key}
                className={cn(
                  "min-h-[84px] border-l border-t p-1",
                  i % 7 === 0 && "border-l-0",
                  !inMonth && "bg-muted/20"
                )}
              >
                <span
                  className={cn(
                    "inline-block px-1 text-[10px] tabular-nums",
                    !inMonth && "text-muted-foreground/50",
                    inMonth && dow === 0 && "text-destructive",
                    inMonth && dow === 6 && "text-blue-600",
                    isSameDay(d, today) &&
                      "rounded-full bg-primary px-1.5 font-medium text-primary-foreground"
                  )}
                >
                  {d.getDate()}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayItems.slice(0, 4).map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => router.push(`/deals/${it.deal_id}`)}
                      title={`${it.deal_name}：${it.title}`}
                      className={cn(
                        "block w-full truncate rounded px-1 py-px text-left text-[9px] leading-tight transition-opacity hover:opacity-80",
                        it.item_type === "due"
                          ? "bg-destructive/10 font-semibold text-destructive"
                          : it.is_done
                            ? "bg-muted text-muted-foreground line-through"
                            : "bg-muted text-foreground"
                      )}
                    >
                      {it.item_type === "due" ? "● " : ""}
                      <span className="text-muted-foreground">
                        {it.deal_name && `${it.deal_name}/`}
                      </span>
                      {it.title}
                    </button>
                  ))}
                  {dayItems.length > 4 && (
                    <span className="block px-1 text-[9px] text-muted-foreground">
                      +{dayItems.length - 4}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-destructive/20" />
          期日（売買契約・決済など）
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted" />
          やること
        </span>
        <span>項目をタップすると案件詳細へ移動します</span>
      </div>
    </div>
  );
}
