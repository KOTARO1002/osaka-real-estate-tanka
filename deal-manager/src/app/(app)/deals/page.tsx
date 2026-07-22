import Link from "next/link";
import { Plus, FolderPlus } from "lucide-react";

import { requireStaff } from "@/lib/auth";
import { getDeals } from "@/lib/queries/deals";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { formatDateShort, formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/card";

export default async function DealsPage() {
  await requireStaff();
  const deals = await getDeals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold">案件一覧</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            全 {deals.length} 件
          </p>
        </div>
        <Button asChild>
          <Link href="/deals/new">
            <Plus className="h-4 w-4" />
            新規案件
          </Link>
        </Button>
      </div>

      {deals.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <FolderPlus className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            まだ案件がありません。
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/deals/new">最初の案件を作成</Link>
          </Button>
        </Card>
      ) : (
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
      )}
    </div>
  );
}
