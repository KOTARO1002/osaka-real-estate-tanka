-- ============================================================================
-- 0003_task_item_type.sql
-- タスクに「種別（やること / 期日）」を追加
--   - todo : やること（チェックで完了できる）
--   - due  : 期日・イベント（売買契約日・決済日など。赤字で表示・完了概念なし）
-- ============================================================================

create type public.task_item_type as enum ('todo', 'due');

alter table public.tasks
  add column item_type public.task_item_type not null default 'todo';

-- 逆算エンジンが生成する「当日イベント」（売買契約締結・決済/引渡し）は期日扱いに
update public.tasks
  set item_type = 'due'
  where template_key in ('contract_day', 'settlement_day');
