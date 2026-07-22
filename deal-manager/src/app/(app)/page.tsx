import { requireStaff } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * ダッシュボード（トップ）。
 * Phase 6 で「今日／今週のタスク集約」「期限警告」「契約・決済サマリ」を実装する。
 */
export default async function DashboardPage() {
  const staff = await requireStaff();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">ダッシュボード</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          こんにちは、{staff.name} さん
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>セットアップ完了</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          プロジェクト初期化・Supabase接続・認証・レイアウトの構築が完了しました。
          以降のフェーズで案件管理・タスク・逆算エンジン・ダッシュボードを実装します。
        </CardContent>
      </Card>
    </div>
  );
}
