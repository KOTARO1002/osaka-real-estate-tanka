import Link from "next/link";
import { Plus, FolderPlus } from "lucide-react";

import { requireStaff } from "@/lib/auth";
import { getDeals, getStaffList } from "@/lib/queries/deals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DealsView } from "./deals-view";

export default async function DealsPage() {
  await requireStaff();
  const [deals, staff] = await Promise.all([getDeals(), getStaffList()]);

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
          <p className="text-sm text-muted-foreground">まだ案件がありません。</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/deals/new">最初の案件を作成</Link>
          </Button>
        </Card>
      ) : (
        <DealsView deals={deals} staff={staff} />
      )}
    </div>
  );
}
