import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * サービスロールキーを使う管理用クライアント（サーバー専用・RLSをバイパス）。
 * スタッフ招待・削除など auth.users を操作する処理でのみ使用する。
 * ※ SUPABASE_SERVICE_ROLE_KEY は絶対にクライアントへ露出させないこと。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY が未設定です。スタッフ招待には設定が必要です。"
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
