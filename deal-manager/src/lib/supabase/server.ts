import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

/**
 * サーバー（Server Component / Server Action / Route Handler）用のSupabaseクライアント。
 * Cookieからユーザーセッションを読み取り、RLS配下で動作する。
 * Next.js 15 では cookies() が非同期のため await が必要。
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component からの呼び出しでは set が失敗するが、
            // middleware でセッションを更新しているため問題ない。
          }
        },
      },
    }
  );
}
