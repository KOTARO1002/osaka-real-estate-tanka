# Supabase セットアップ手順

Supabase プロジェクトを作成後、**SQL Editor** で以下の順にSQLを実行してください。

1. `migrations/0001_schema.sql` … Enum・テーブル・インデックス・トリガー
2. `migrations/0002_rls.sql` … Row Level Security ポリシー
3. `migrations/0003_task_item_type.sql` … タスク種別（やること/期日）の追加
4. `seed.sql` … 動作確認用サンプルデータ（任意）

## サンプルログイン（seed 実行時）

| 役割 | メールアドレス | パスワード |
| ---- | -------------- | ---------- |
| 管理者 | `admin@simplehouse.co.jp` | `password123` |
| メンバー | `member@simplehouse.co.jp` | `password123` |

> パスワードは動作確認後に必ず変更してください。

## 型定義

`src/lib/supabase/types.ts` はこのDDLと一致させて手動管理しています。
Supabase CLI があれば以下でも再生成できます。

```bash
supabase gen types typescript --project-id <PROJECT_REF> --schema public > src/lib/supabase/types.ts
```

## 環境変数

`.env.local`（`.env.example` を参照）に以下を設定してください。

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```
