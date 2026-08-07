-- =====================================================================
-- 0005_notifications.sql — in-app notifications with role-scoped reach
--
-- WHAT THIS ADDS:
--   A durable notifications feed: low stock alerts, staff added, supplier
--   updates, sales milestones. Unlike supplier_activity (an informational
--   panel on one page) these carry per-viewer read state, so the bell can
--   show an unread count.
--
-- WHO SEES WHAT — the rule the UI cannot be trusted to enforce:
--   Staff   — only notifications addressed to them personally.
--   Manager — those, plus everything store-wide, except owner-only items.
--   Owner   — everything in their store.
--
--   `audience` carries that intent on the row itself rather than being
--   inferred from recipient_id being null, so an owner-only item and a
--   store-wide one stay distinguishable at a glance and in a policy.
--
-- WHY INSERTS GO THROUGH A FUNCTION:
--   There is deliberately NO insert policy. A staff member logging a sale
--   must be able to raise a milestone notification, but granting them a
--   direct insert would also let them forge one addressed to the owner, or
--   stamp it with another store's id. public.notify() is SECURITY DEFINER
--   and derives store_id from current_store_id(), so the caller chooses
--   the message but never the store.
--
--   That makes search_path pinning load-bearing here, not hygiene: a
--   definer function resolving `notifications` through a caller-controlled
--   search_path would write to a table of their choosing.
--
-- ROLLBACK:
--   drop function if exists public.unread_notification_count();
--   drop function if exists public.notify(text, text, text, text, text, uuid, uuid);
--   drop table if exists public.notifications;
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Step 0. Abort unless the role helpers from 0002 exist. Without them
-- every policy below would fail open or closed unpredictably.
-- ---------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.current_store_id()') is null
     or to_regprocedure('public.can_manage()') is null
     or to_regprocedure('public.current_role()') is null then
    raise exception '0005: role helpers from 0002 are missing — apply 0002 first';
  end if;
end $$;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  -- Null for anything not addressed to one person. Cascades with the
  -- profile: a departed staff member's personal alerts leave with them.
  recipient_id uuid references public.profiles(id) on delete cascade,
  audience text not null default 'store'
    check (audience in ('personal', 'store', 'managers', 'owner')),
  kind text not null default 'general'
    check (kind in ('general', 'low_stock', 'staff', 'supplier', 'sales')),
  title text not null,
  body text,
  -- What the notification is about, so the bell can link somewhere useful.
  entity text,
  entity_id uuid,
  -- Read state is a timestamp, not a boolean: "when" also answers "how
  -- stale is this feed" without a second column.
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- The feed query is always store + newest-first, so this index serves it
-- directly rather than sorting after the fact.
create index if not exists notifications_store_created_idx
  on public.notifications (store_id, created_at desc);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id);

-- Partial: the badge counts unread only, and unread is the small set.
create index if not exists notifications_unread_idx
  on public.notifications (store_id, recipient_id)
  where read_at is null;

alter table public.notifications enable row level security;

-- ---------------------------------------------------------------------
-- Visibility. The same predicate is reused verbatim by update and delete:
-- the mistake to avoid is a narrower select than update, which would let
-- someone mark read or clear notifications they cannot even read.
-- ---------------------------------------------------------------------
drop policy if exists "members read permitted notifications" on public.notifications;
create policy "members read permitted notifications" on public.notifications
  for select using (
    store_id = public.current_store_id()
    and (
      recipient_id = auth.uid()
      or public.current_role() = 'owner'
      or (public.can_manage() and audience <> 'owner')
    )
  );

drop policy if exists "members update permitted notifications" on public.notifications;
create policy "members update permitted notifications" on public.notifications
  for update using (
    store_id = public.current_store_id()
    and (
      recipient_id = auth.uid()
      or public.current_role() = 'owner'
      or (public.can_manage() and audience <> 'owner')
    )
  );

drop policy if exists "members delete permitted notifications" on public.notifications;
create policy "members delete permitted notifications" on public.notifications
  for delete using (
    store_id = public.current_store_id()
    and (
      recipient_id = auth.uid()
      or public.current_role() = 'owner'
      or (public.can_manage() and audience <> 'owner')
    )
  );

-- ---------------------------------------------------------------------
-- The only way to create one.
--
-- Returns the new id so a caller can link to it. Raises rather than
-- silently writing nothing when there is no store context, because a
-- swallowed failure here means a notification that never arrives and no
-- trace of why.
-- ---------------------------------------------------------------------
create or replace function public.notify(
  p_title     text,
  p_body      text default null,
  p_audience  text default 'store',
  p_kind      text default 'general',
  p_entity    text default null,
  p_entity_id uuid default null,
  p_recipient uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_store uuid := public.current_store_id();
  v_id    uuid;
begin
  if v_store is null then
    raise exception 'notify(): no store context for the current user';
  end if;

  insert into public.notifications
    (store_id, recipient_id, audience, kind, title, body, entity, entity_id)
  values
    (v_store, p_recipient, p_audience, p_kind, p_title, p_body, p_entity, p_entity_id)
  returning id into v_id;

  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- Unread count for the badge.
--
-- SECURITY INVOKER, so it counts exactly the rows the caller's select
-- policy admits — the badge can never claim more than the dropdown shows.
-- ---------------------------------------------------------------------
create or replace function public.unread_notification_count()
returns bigint
language sql
stable
set search_path = public, pg_temp
as $$
  select count(*)::bigint from public.notifications where read_at is null;
$$;

grant execute on function public.notify(text, text, text, text, text, uuid, uuid) to authenticated;
grant execute on function public.unread_notification_count() to authenticated;

commit;

-- ---------------------------------------------------------------------
-- Verify (run after committing, signed in as a store user):
--
--   select public.notify('Test alert', 'body text', 'store', 'general');
--   select id, audience, kind, title, read_at from public.notifications
--     order by created_at desc limit 5;
--   select public.unread_notification_count();   -- expect >= 1
--
--   -- then clean up:
--   delete from public.notifications where title = 'Test alert';
--
--   select policyname, cmd from pg_policies
--   where tablename = 'notifications' order by cmd;
--   -- expect DELETE / SELECT / UPDATE, one row each (no INSERT by design)
-- ---------------------------------------------------------------------
