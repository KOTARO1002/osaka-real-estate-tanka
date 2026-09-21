# 案件管理アプリ（シンプルハウス）

不動産仲介「シンプルハウス」向けの、ANDPADライクな **案件一元管理Webアプリ**。
売買仲介の各案件について「案件名・担当者・採用銀行・契約日・決済日・タスク」を
一元管理し、全スタッフがログインして閲覧・編集できます。

## 技術スタック

- **Next.js 15**（App Router）+ TypeScript
- **Supabase**（PostgreSQL / Auth / Row Level Security / Realtime）+ `@supabase/ssr`
- **Tailwind CSS v4** + shadcn/ui
- **react-hook-form** + **zod**
- **date-fns**（`date-fns/locale/ja`・営業日計算）

## 主な機能

- **ダッシュボード**: 全案件から今日／今週／期限超過のタスクを横断集約、直近の契約・決済サマリ
- **案件一覧**: テーブル／カンバン切替、ステータス・担当者・銀行で絞り込み、契約日/決済日でソート
- **案件詳細**: 基本情報の編集、タスク管理、更新履歴タイムライン
- **期日逆算エンジン**: 契約日・決済日を入れると営業日ベースで逆算タスクを自動生成・追従
- **スタッフ管理**（管理者のみ）: 招待・ロール変更・削除
- **権限**: 閲覧は全スタッフ、削除（案件・スタッフ）は管理者のみ（RLSで制御）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

`.env.example` を `.env.local` にコピーし、Supabase の値を設定します。

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # スタッフ招待・削除に使用
```

### 3. データベース

Supabase の SQL Editor で以下を順に実行します（詳細は `supabase/README.md`）。

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/seed.sql`（サンプルデータ・任意）

### 4. 開発サーバー

```bash
npm run dev
```

http://localhost:3000 を開きます。サンプルログイン（seed実行時）:

- 管理者: `admin@simplehouse.co.jp` / `password123`
- メンバー: `member@simplehouse.co.jp` / `password123`

## デプロイ（Vercel）

環境変数（上記3つ）を Vercel プロジェクトに設定してデプロイします。

## ディレクトリ構成

```
src/
  app/
    (app)/          ログイン必須エリア（ダッシュボード・案件・スタッフ）
    login/          ログイン画面
  components/       UIコンポーネント（ui/ は shadcn/ui 相当）
  lib/
    supabase/       Supabaseクライアント（client/server/middleware/admin）と型
    queries/        データ取得ヘルパー
    validations/    zod スキーマ
    task-templates.ts / task-engine.ts   期日逆算エンジン
supabase/
  migrations/       DDL（SQL Editorで実行）
  seed.sql          サンプルデータ
```
