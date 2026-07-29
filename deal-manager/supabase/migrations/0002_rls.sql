-- ============================================================================
-- 0002_rls.sql
-- Row Level Security ポリシー
--
-- 方針:
--   - ログイン済みスタッフは全案件・全タスク・全スタッフを閲覧可（社内共有目的）
--   - 案件 / タスクの作成・編集は全 member 可
--   - 削除は deals / staff のみ admin 限定。tasks は全員可（手動タスクの整理のため）
--   - deal_activities は閲覧・追加のみ（監査ログのため更新・削除不可）
-- ============================================================================

-- ----------------------------------------------------------------------------
-- admin判定ヘルパー
-- staff テーブルの RLS ポリシー内から staff を参照すると再帰するため、
-- SECURITY DEFINER 関数で RLS を回避して role を取得する。
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================================
-- staff
-- ============================================================================
alter table public.staff enable row level security;

-- 閲覧: ログイン済みなら全員（担当者名の表示に必要）
create policy staff_select on public.staff
  for select to authenticated
  using (true);

-- 追加: admin のみ（招待フロー）
create policy staff_insert on public.staff
  for insert to authenticated
  with check (public.is_admin());

-- 更新: admin は全員分、本人は自分の name のみ想定だが簡潔に本人 or admin を許可
create policy staff_update on public.staff
  for update to authenticated
  using (public.is_admin() or id = auth.uid())
  with check (public.is_admin() or id = auth.uid());

-- 削除: admin のみ
create policy staff_delete on public.staff
  for delete to authenticated
  using (public.is_admin());

-- ============================================================================
-- deals
-- ============================================================================
alter table public.deals enable row level security;

create policy deals_select on public.deals
  for select to authenticated
  using (true);

create policy deals_insert on public.deals
  for insert to authenticated
  with check (true);

create policy deals_update on public.deals
  for update to authenticated
  using (true)
  with check (true);

-- 削除は admin のみ
create policy deals_delete on public.deals
  for delete to authenticated
  using (public.is_admin());

-- ============================================================================
-- tasks
-- ============================================================================
alter table public.tasks enable row level security;

create policy tasks_select on public.tasks
  for select to authenticated
  using (true);

create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (true);

create policy tasks_update on public.tasks
  for update to authenticated
  using (true)
  with check (true);

create policy tasks_delete on public.tasks
  for delete to authenticated
  using (true);

-- ============================================================================
-- deal_activities（監査ログ: 閲覧・追加のみ）
-- ============================================================================
alter table public.deal_activities enable row level security;

create policy activities_select on public.deal_activities
  for select to authenticated
  using (true);

create policy activities_insert on public.deal_activities
  for insert to authenticated
  with check (true);
