import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { StaffRow } from "@/lib/supabase/types";
import { StaffManager } from "./staff-manager";

export default async function StaffPage() {
  const me = await requireAdmin();

  const supabase = await createClient();
  const { data } = await supabase
    .from("staff")
    .select("*")
    .order("created_at", { ascending: true });
  const staff = (data ?? []) as StaffRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">スタッフ管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          スタッフの招待・ロール変更・削除を行います（管理者のみ）。
        </p>
      </div>

      <StaffManager staff={staff} currentStaffId={me.id} />
    </div>
  );
}
