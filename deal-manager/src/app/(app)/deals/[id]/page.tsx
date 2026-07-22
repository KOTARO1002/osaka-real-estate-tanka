import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil } from "lucide-react";

import { getCurrentStaff } from "@/lib/auth";
import { getDealById, getStaffList } from "@/lib/queries/deals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { DeleteDealButton } from "@/components/delete-deal-button";
import { TaskSection } from "@/components/task-section";
import { formatDateJa, formatPrice } from "@/lib/format";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:gap-4">
      <dt className="w-32 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [staff, deal, staffList] = await Promise.all([
    getCurrentStaff(),
    getDealById(id),
    getStaffList(),
  ]);
  if (!deal) notFound();

  const isAdmin = staff?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/deals"
          className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          案件一覧へ戻る
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold">{deal.name}</h1>
            <StatusBadge status={deal.status} />
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/deals/${deal.id}/edit`}>
                <Pencil className="h-4 w-4" />
                編集
              </Link>
            </Button>
            {isAdmin && (
              <DeleteDealButton dealId={deal.id} dealName={deal.name} />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 基本情報 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <InfoRow label="案件種別" value={deal.deal_type} />
              <InfoRow label="取引形態" value={deal.transaction_side} />
              <InfoRow label="顧客名" value={deal.customer_name ?? "—"} />
              <InfoRow
                label="物件所在地"
                value={deal.property_address ?? "—"}
              />
              <InfoRow label="価格" value={formatPrice(deal.price)} />
              <InfoRow label="主担当" value={deal.assignee?.name ?? "—"} />
              <InfoRow label="副担当" value={deal.sub_assignee?.name ?? "—"} />
              <InfoRow label="採用銀行" value={deal.bank ?? "—"} />
              <InfoRow label="融資状況" value={deal.loan_status} />
              <InfoRow
                label="売買契約日"
                value={formatDateJa(deal.contract_date)}
              />
              <InfoRow
                label="決済・引渡し日"
                value={formatDateJa(deal.settlement_date)}
              />
              <InfoRow
                label="備考"
                value={
                  deal.memo ? (
                    <span className="whitespace-pre-wrap">{deal.memo}</span>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
          </CardContent>
        </Card>

        {/* タスク（タイムラインは Phase 7 で追加） */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <TaskSection
                dealId={deal.id}
                tasks={deal.tasks}
                staff={staffList}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
