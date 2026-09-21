"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** 認証エリアのエラーバウンダリ。 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 本番ではログ収集サービスへ送るなどする
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div>
            <p className="font-medium">問題が発生しました</p>
            <p className="mt-1 text-sm text-muted-foreground">
              データの読み込み中にエラーが発生しました。時間をおいて再度お試しください。
            </p>
          </div>
          <Button onClick={reset}>再読み込み</Button>
        </CardContent>
      </Card>
    </div>
  );
}
