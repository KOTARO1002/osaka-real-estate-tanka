"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteDeal } from "@/app/(app)/deals/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** 案件削除ボタン（admin のみ表示）。確認ダイアログ付き。 */
export function DeleteDealButton({
  dealId,
  dealName,
}: {
  dealId: string;
  dealName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive">
          <Trash2 className="h-4 w-4" />
          削除
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>案件を削除しますか？</DialogTitle>
          <DialogDescription>
            「{dealName}」を削除します。関連するタスク・履歴も削除され、元に戻せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await deleteDeal(dealId);
              })
            }
          >
            {isPending ? "削除中..." : "削除する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
