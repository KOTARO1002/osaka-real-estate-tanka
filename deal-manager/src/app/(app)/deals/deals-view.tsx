"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Table as TableIcon } from "lucide-react";

import type { DealListItem, StaffMini } from "@/lib/queries/deals";
import { DEAL_STATUSES, DEAL_STATUS_COLORS } from "@/lib/domain";
import type { DealStatus } from "@/lib/supabase/types";
import { StatusBadge } from "@/components/status-badge";
import { formatDateShort, formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL = "__all__";
type SortKey = "updated" | "contract_date" | "settlement_date";

/** null を末尾に回す日付比較（昇順） */
function compareDateAsc(a: string | null, b: string | null): number {
  if (a && b) return a < b ? -1 : a > b ? 1 : 0;
  if (a) return -1;
  if (b) return 1;
  return 0;
}

export function DealsView({
  deals,
  staff,
}: {
  deals: DealListItem[];
  staff: StaffMini[];
}) {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [assigneeFilter, setAssigneeFilter] = useState<string>(ALL);
  const [bankFilter, setBankFilter] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("updated");

  // 銀行の絞り込み候補（実データから重複排除）
  const bankOptions = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => d.bank && set.add(d.bank));
    return Array.from(set).sort();
  }, [deals]);

  const filtered = useMemo(() => {
    const result = deals.filter((d) => {
      if (statusFilter !== ALL && d.status !== statusFilter) return false;
      if (assigneeFilter !== ALL && d.assignee_id !== assigneeFilter)
        return false;
      if (bankFilter !== ALL && d.bank !== bankFilter) return false;
      return true;
    });
    if (sortKey === "contract_date") {
      result.sort((a, b) => compareDateAsc(a.contract_date, b.contract_date));
    } else if (sortKey === "settlement_date") {
      result.sort((a, b) =>
        compareDateAsc(a.settlement_date, b.settlement_date)
      );
    }
    // updated は取得時点で updated_at 降順のため並べ替え不要
    return result;
  }, [deals, statusFilter, assigneeFilter, bankFilter, sortKey]);

  return (
    <div className="space-y-4">
      {/* 絞り込み・表示切替バー */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          allLabel="全ステータス"
          options={DEAL_STATUSES.map((s) => ({ value: s, label: s }))}
          width="w-40"
        />
        <FilterSelect
          value={assigneeFilter}
          onChange={setAssigneeFilter}
          allLabel="全担当者"
          options={staff.map((s) => ({ value: s.id, label: s.name }))}
          width="w-36"
        />
        {bankOptions.length > 0 && (
          <FilterSelect
            value={bankFilter}
            onChange={setBankFilter}
            allLabel="全銀行"
            options={bankOptions.map((b) => ({ value: b, label: b }))}
            width="w-40"
          />
        )}
        <FilterSelect
          value={sortKey}
          onChange={(v) => setSortKey(v as SortKey)}
          options={[
            { value: "updated", label: "更新順" },
            { value: "contract_date", label: "契約日順" },
            { value: "settlement_date", label: "決済日順" },
          ]}
          width="w-32"
          noAll
        />

        <div className="ml-auto flex items-center rounded-md border p-0.5">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setView("table")}
          >
            <TableIcon className="h-4 w-4" />
            <span className="hidden sm:inline">テーブル</span>
          </Button>
          <Button
            variant={view === "kanban" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2"
            onClick={() => setView("kanban")}
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">カンバン</span>
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} 件表示</p>

      {view === "table" ? (
        <TableView deals={filtered} />
      ) : (
        <KanbanView deals={filtered} />
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
  width,
  noAll,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allLabel?: string;
  width?: string;
  noAll?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("h-8", width)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {!noAll && <SelectItem value={ALL}>{allLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TableView({ deals }: { deals: DealListItem[] }) {
  if (deals.length === 0) {
    return (
      <Card className="py-12 text-center text-sm text-muted-foreground">
        条件に一致する案件がありません。
      </Card>
    );
  }
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">案件名</th>
              <th className="px-4 py-3 font-medium">担当者</th>
              <th className="px-4 py-3 font-medium">ステータス</th>
              <th className="px-4 py-3 font-medium">採用銀行</th>
              <th className="px-4 py-3 font-medium">契約日</th>
              <th className="px-4 py-3 font-medium">決済日</th>
              <th className="px-4 py-3 text-right font-medium">未完</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => (
              <tr
                key={deal.id}
                className="border-b last:border-0 hover:bg-accent/40"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/deals/${deal.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {deal.name}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(deal.price)}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {deal.assignee?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={deal.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {deal.bank ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateShort(deal.contract_date)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateShort(deal.settlement_date)}
                </td>
                <td className="px-4 py-3 text-right">
                  {deal.open_task_count > 0 ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary">
                      {deal.open_task_count}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function KanbanView({ deals }: { deals: DealListItem[] }) {
  const columns = useMemo(() => {
    const map = new Map<DealStatus, DealListItem[]>();
    DEAL_STATUSES.forEach((s) => map.set(s, []));
    deals.forEach((d) => map.get(d.status)?.push(d));
    return map;
  }, [deals]);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3" style={{ minWidth: "min-content" }}>
        {DEAL_STATUSES.map((status) => {
          const items = columns.get(status) ?? [];
          return (
            <div key={status} className="w-64 shrink-0">
              <div className="mb-2 flex items-center gap-2 px-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: DEAL_STATUS_COLORS[status] }}
                />
                <span className="text-xs font-medium">{status}</span>
                <span className="text-xs text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2 rounded-lg bg-muted/40 p-2">
                {items.length === 0 ? (
                  <p className="px-1 py-4 text-center text-[11px] text-muted-foreground">
                    なし
                  </p>
                ) : (
                  items.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/deals/${deal.id}`}
                      className="block rounded-md border bg-card p-3 shadow-sm transition-colors hover:border-primary/40"
                    >
                      <p className="truncate text-sm font-medium">
                        {deal.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {deal.assignee?.name ?? "担当未設定"}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {deal.settlement_date
                            ? `決済 ${formatDateShort(deal.settlement_date)}`
                            : deal.contract_date
                              ? `契約 ${formatDateShort(deal.contract_date)}`
                              : "日程未定"}
                        </span>
                        {deal.open_task_count > 0 && (
                          <span className="rounded-full bg-primary/10 px-1.5 text-primary">
                            {deal.open_task_count}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
