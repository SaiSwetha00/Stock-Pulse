-- =====================================================================
-- 0001_audit_logs.sql — append-only audit trail + activity history
--
-- SAFETY NOTES (read before applying to a live database):
--   * Purely additive. Creates one new table, its policies and triggers.
--     No existing table, column, policy or row is altered or dropped.
--   * Triggers are AFTER-triggers that only INSERT into audit_logs, so a
--     failure to log cannot silently corrupt the user's write. Note the
--     trade-off: if audit_logs is unavailable the INSERT raises and the
--     surrounding transaction aborts. That is fail-closed by choice, which is
--     correct for an audit trail, but it is a decision worth knowing about.
--   * Re-runnable: every statement is IF NOT EXISTS / OR REPLACE guarded.
--
-- ROLLBACK:
--   drop trigger if exists audit_products on public.products;
--   drop trigger if exists audit_customers on public.customers;
--   drop trigger if exists audit_suppliers on public.suppliers;
--   drop trigger if exists audit_sales on public.sales;
--   drop function if exists public.record_audit();
--   drop table if exists public.audit_logs;
-- =====================================================================

create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  store_id    uuid not null references public.stores(id) on delete cascade,
  -- Nullable and ON DELETE SET NULL: removing a staff member must never
  -- erase or block the history of what they did.
  actor_id    uuid references auth.users(id) on delete set null,
  actor_email text,
  action      text not null check (action in ('insert', 'update', 'delete')),
  entity      text not null,
  entity_id   uuid,
  -- Row snapshots. `before` is null on insert, `after` null on delete.
  before      jsonb,
  after       jsonb,
  created_at  timestamptz not null default now()
);

-- The only query this table serves is "this store's history, newest first".
create index if not exists audit_logs_store_created_idx
  on public.audit_logs (store_id, created_at desc);
create index if not exists audit_logs_entity_idx
  on public.audit_logs (store_id, entity, entity_id);

alter table public.audit_logs enable row level security;

-- Read: owners, and only within their own store.
drop policy if exists audit_logs_select_owner on public.audit_logs;
create policy audit_logs_select_owner on public.audit_logs
  for select using (
    store_id = public.current_store_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'owner'
    )
  );

-- No insert/update/delete policies are defined on purpose. The trigger below
-- is SECURITY DEFINER, so it writes regardless; the absence of policies makes
-- the table append-only from the application's point of view — nobody can
-- forge, edit or erase an entry through PostgREST.

create or replace function public.record_audit()
returns trigger as $$
declare
  v_store_id uuid;
  v_actor_email text;
begin
  -- store_id lives on every audited table; fall back to the session's store
  -- if a row somehow lacks one (defensive; should not occur).
  v_store_id := coalesce(
    (case
       when tg_op = 'DELETE' then (to_jsonb(old) ->> 'store_id')
       else (to_jsonb(new) ->> 'store_id')
     end)::uuid,
    public.current_store_id()
  );

  select email into v_actor_email from auth.users where id = auth.uid();

  insert into public.audit_logs (
    store_id, actor_id, actor_email, action, entity, entity_id, before, after
  ) values (
    v_store_id,
    auth.uid(),
    v_actor_email,
    lower(tg_op),
    tg_table_name,
    coalesce((to_jsonb(new) ->> 'id')::uuid, (to_jsonb(old) ->> 'id')::uuid),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );

  return null; -- AFTER trigger: the return value is ignored.
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists audit_products on public.products;
create trigger audit_products
  after insert or update or delete on public.products
  for each row execute function public.record_audit();

drop trigger if exists audit_customers on public.customers;
create trigger audit_customers
  after insert or update or delete on public.customers
  for each row execute function public.record_audit();

drop trigger if exists audit_suppliers on public.suppliers;
create trigger audit_suppliers
  after insert or update or delete on public.suppliers
  for each row execute function public.record_audit();

-- Sales are insert-only in the app today, but auditing all three verbs means
-- a future void/refund path is covered the moment it lands.
drop trigger if exists audit_sales on public.sales;
create trigger audit_sales
  after insert or update or delete on public.sales
  for each row execute function public.record_audit();
