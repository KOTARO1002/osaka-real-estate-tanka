import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { requireStaff } from "@/lib/auth";
import { getDealById, getStaffList } from "@/lib/queries/deals";
import { DealForm } from "@/components/deal-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const [deal, staff] = await Promise.all([getDealById(id), getStaffList()]);
  if (!deal) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/deals/${id}`}
          className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          案件詳細へ戻る
        </Link>
        <h1 className="font-heading text-2xl font-semibold">案件を編集</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DealForm staff={staff} deal={deal} />
        </CardContent>
      </Card>
    </div>
  );
}
