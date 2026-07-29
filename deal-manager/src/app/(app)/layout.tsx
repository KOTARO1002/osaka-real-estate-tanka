import { requireStaff } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";

/**
 * ログイン必須エリアの共通レイアウト。
 * サイドバー（デスクトップ）／上部バー（モバイル）を配置する。
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppNav staff={staff} />
      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
