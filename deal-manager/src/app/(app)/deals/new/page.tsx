import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { requireStaff } from "@/lib/auth";
import { getStaffList } from "@/lib/queries/deals";
import { DealForm } from "@/components/deal-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NewDealPage() {
  await requireStaff();
  const staff = await getStaffList();

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
        <h1 className="font-heading text-2xl font-semibold">新規案件作成</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <DealForm staff={staff} />
        </CardContent>
      </Card>
    </div>
  );
}
