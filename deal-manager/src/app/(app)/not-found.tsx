import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** 認証エリアの 404。 */
export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <FileQuestion className="h-10 w-10 text-muted-foreground/60" />
          <div>
            <p className="font-medium">ページが見つかりません</p>
            <p className="mt-1 text-sm text-muted-foreground">
              お探しの案件やページは削除されたか、URLが正しくない可能性があります。
            </p>
          </div>
          <Button asChild>
            <Link href="/deals">案件一覧へ</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
