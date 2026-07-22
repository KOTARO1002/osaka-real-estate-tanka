-- ============================================================================
-- 0001_schema.sql
-- シンプルハウス案件管理アプリ スキーマ定義
-- Supabase SQL Editor で実行してください。
-- ============================================================================

-- UUID生成に使用
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enum 型
-- ----------------------------------------------------------------------------

-- スタッフ権限
create type public.staff_role as enum ('admin', 'member');

-- 案件種別（将来拡張可）
create type public.deal_type as enum ('売買仲介', '買取再販', 'リノベ');

-- 取引形態
create type public.transaction_side as enum ('売主側', '買主側', '両手');

-- 融資状況
create type public.loan_status as enum (
  '事前審査前',
  '事前承認',
  '本審査中',
  '本承認',
  '融資利用なし'
);

-- 案件ステータス（進捗フェーズ。カンバン列の順序を持つ）
create type public.deal_status as enum (
  '反響・追客',
  '媒介契約',
  '売買契約準備',
  '売買契約済',
  '融資本審査',
  '金消・決済準備',
  '決済完了',
  '失注・見送り'
);

-- タスクカテゴリ
create type public.task_category as enum ('契約前', '契約〜決済', '決済後', 'その他');

-- ----------------------------------------------------------------------------
-- updated_at 自動更新トリガー関数
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- staff（スタッフ）: Supabase auth.users と1:1で連携
-- ----------------------------------------------------------------------------
create table public.staff (
  id         uuid primary key references auth.users (id) on delete cascade,
  name       text not null,
  role       public.staff_role not null default 'member',
  email      text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_staff_updated_at
  before update on public.staff
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- deals（案件）
-- ----------------------------------------------------------------------------
create table public.deals (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,                                    -- 案件名 / 物件名
  deal_type        public.deal_type not null default '売買仲介',
  transaction_side public.transaction_side not null default '買主側',
  customer_name    text,                                             -- 顧客名
  property_address text,                                             -- 物件所在地
  price            bigint,                                           -- 成約 / 想定価格（円）
  assignee_id      uuid references public.staff (id) on delete set null,      -- 主担当
  sub_assignee_id  uuid references public.staff (id) on delete set null,      -- 副担当
  bank             text,                                             -- 採用銀行名（自由入力）
  loan_status      public.loan_status not null default '事前審査前',
  contract_date    date,                                             -- 売買契約日
  settlement_date  date,                                             -- 決済・引渡し日
  status           public.deal_status not null default '反響・追客',
  memo             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_deals_status on public.deals (status);
create index idx_deals_assignee on public.deals (assignee_id);
create index idx_deals_contract_date on public.deals (contract_date);
create index idx_deals_settlement_date on public.deals (settlement_date);

create trigger trg_deals_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- tasks（タスク）
-- ----------------------------------------------------------------------------
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  deal_id         uuid not null references public.deals (id) on delete cascade,
  title           text not null,                                     -- やること
  due_date        date,                                              -- 期限
  assignee_id     uuid references public.staff (id) on delete set null,
  is_done         boolean not null default false,
  done_at         timestamptz,
  category        public.task_category not null default 'その他',
  auto_generated  boolean not null default false,                    -- 逆算エンジンで自動生成されたか
  template_key    text,                                              -- 逆算テンプレートのキー（追従・重複判定用）
  manually_edited boolean not null default false,                    -- 手動編集済み（true は逆算で上書きしない）
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_tasks_deal on public.tasks (deal_id);
create index idx_tasks_due_date on public.tasks (due_date);
create index idx_tasks_is_done on public.tasks (is_done);
-- 自動生成タスクは案件内でテンプレートキーごとに一意（追従再計算のupsert用）
create unique index uidx_tasks_auto_template
  on public.tasks (deal_id, template_key)
  where auto_generated = true and template_key is not null;

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- deal_activities（更新履歴 / タイムライン）
-- 主要フィールド更新時にアプリ側から1行追加する（担当者名付きの可読ログ）
-- ----------------------------------------------------------------------------
create table public.deal_activities (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals (id) on delete cascade,
  staff_id   uuid references public.staff (id) on delete set null,
  body       text not null,                                          -- 例:「〇〇が採用銀行を三井住友に変更」
  created_at timestamptz not null default now()
);

create index idx_activities_deal on public.deal_activities (deal_id, created_at desc);
