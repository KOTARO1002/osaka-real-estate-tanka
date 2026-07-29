import { Loader2 } from "lucide-react";

/** ルート遷移中のローディング表示。 */
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">読み込み中...</p>
      </div>
    </div>
  );
}
