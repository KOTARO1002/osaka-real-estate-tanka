# 案件管理アプリ（deal-manager）開発メモ

不動産仲介「シンプルハウス」向けの案件一元管理アプリ。
Next.js **15**（App Router）を使用。標準的な App Router 規約に従う。

## 技術スタック
- Next.js 15（App Router）+ TypeScript
- Supabase（PostgreSQL / Auth / RLS / Realtime）+ `@supabase/ssr`
- Tailwind CSS v4 + shadcn/ui（`src/components/ui`）
- react-hook-form + zod / date-fns（`date-fns/locale/ja`）

## 主要ディレクトリ
- `src/app/(app)/` … ログイン必須エリア（サイドバー付きレイアウト）
- `src/app/login/` … ログイン画面
- `src/lib/supabase/` … Supabaseクライアント（client / server / middleware）と型
- `src/lib/` … ドメイン定数・認証ヘルパー・逆算エンジン等
- `supabase/migrations/` … DDL（SQL Editorで実行）／ `supabase/seed.sql`

## 環境変数
`.env.local` に `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定（`.env.example` 参照）。
