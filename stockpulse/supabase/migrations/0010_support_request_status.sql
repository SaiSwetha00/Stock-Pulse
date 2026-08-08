-- =====================================================================
-- 0010_support_request_status.sql — open/resolved for support requests
--
-- WHAT THIS ADDS:
--   status, resolved_at, resolved_by on support_requests, plus the one
--   UPDATE policy that lets a manager close a ticket.
--
-- ---------------------------------------------------------------------
-- THE POINT OF THE TRIGGER — read before simplifying it away.
--
--   0006 deliberately gave this table INSERT and SELECT policies and
--   NOTHING ELSE. The reasoning is in that file: an owner must not be
--   able to rewrite or delete a complaint raised by a staff member.
--   That guarantee is what makes the table trustworthy.
--
--   Marking a ticket resolved is an UPDATE, so adding one opens the door
--   to editing `message`, `name`, `email` or `category` too — RLS grants
--   the row, not the column, and Postgres has no column-level UPDATE
--   policy.
--
--   The trigger closes that door: it rejects any UPDATE that changes
--   anything other than the three status columns. A manager can close a
--   ticket and still cannot alter a word of what was said.
--
--   DELETE remains impossible. There is still no delete policy.
--
-- ROLLBACK:
--   drop trigger if exists support_requests_status_only on public.support_requests;
--   drop function if exists public.support_requests_status_only();
--   drop policy if exists "managers resolve support requests" on public.support_requests;
--   alter table public.support_requests
--     drop column if exists status,
--     drop column if exists resolved_at,
--     drop column if exists resolved_by;
-- =====================================================================

begin;

do $$
begin
  if to_regclass('public.support_requests') is null then
    raise exception '0010: support_requests is missing — apply 0006 first';
  end if;
end $$;

alter table public.support_requests
  add column if not exists status text not null default 'open'
    check (status in ('open', 'resolved')),
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references public.profiles(id) on delete set null;

-- The support list is always "this store, open first, newest first".
create index if not exists support_requests_store_status_idx
  on public.support_requests (store_id, status, created_at desc);

-- ---------------------------------------------------------------------
-- Only managers and owners may resolve, and only within their own store.
-- ---------------------------------------------------------------------
drop policy if exists "managers resolve support requests" on public.support_requests;
create policy "managers resolve support requests" on public.support_requests
  for update
  using (store_id = public.current_store_id() and public.can_manage())
  with check (store_id = public.current_store_id() and public.can_manage());

-- ---------------------------------------------------------------------
-- Status-only enforcement. See the note at the top of this file.
-- ---------------------------------------------------------------------
create or replace function public.support_requests_status_only()
returns trigger
language plpgsql
as $$
begin
  if new.id         is distinct from old.id
  or new.store_id   is distinct from old.store_id
  or new.raised_by  is distinct from old.raised_by
  or new.name       is distinct from old.name
  or new.email      is distinct from old.email
  or new.category   is distinct from old.category
  or new.message    is distinct from old.message
  or new.created_at is distinct from old.created_at then
    raise exception
      'support_requests: only status may be changed. What was reported is immutable.';
  end if;
  return new;
end $$;

drop trigger if exists support_requests_status_only on public.support_requests;
create trigger support_requests_status_only
  before update on public.support_requests
  for each row execute function public.support_requests_status_only();

commit;

-- ---------------------------------------------------------------------
-- Verify:
--   select column_name from information_schema.columns
--   where table_name = 'support_requests'
--     and column_name in ('status','resolved_at','resolved_by');  -- 3 rows
--
--   select policyname, cmd from pg_policies
--   where tablename = 'support_requests';        -- insert, select, update
--
--   -- The guarantee, as a test. Signed in as the owner, pick any request:
--   update public.support_requests set status = 'resolved' where id = '<id>';
--   -- succeeds
--   update public.support_requests set message = 'edited' where id = '<id>';
--   -- must fail: "only status may be changed"
-- ---------------------------------------------------------------------
