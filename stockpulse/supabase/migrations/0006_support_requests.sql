-- =====================================================================
-- 0006_support_requests.sql — Help Centre "Need more help" submissions
--
-- WHAT THIS ADDS:
--   A durable record of support requests raised from /help. Previously the
--   contact card was a mailto: link, so nothing was recorded anywhere and a
--   request could not be acknowledged, tracked, or counted.
--
-- WHY A SHORT TICKET REFERENCE:
--   The submitter needs something to quote back. A raw uuid is unusable over
--   the phone, so `reference` is a generated 8-character code (SP-XXXXXX).
--   It is derived from the row's own id rather than a counter, so it needs no
--   sequence and cannot collide across stores.
--
-- WHO SEES WHAT:
--   Anyone signed in may raise a request, and may read back the ones they
--   raised themselves — that is what makes "here is your ticket id" honest.
--   Owners and managers can read every request in their own store, because
--   they are the people who would act on one.
--
--   Nobody can UPDATE or DELETE. There is deliberately no policy for either:
--   a support request is a record of something a person said at a point in
--   time, and a store owner being able to quietly rewrite or remove a
--   complaint raised by their staff defeats the purpose of keeping it.
--   Resolution state is not modelled here for the same reason — when it is
--   needed it belongs in a separate table that references this one.
--
-- ROLLBACK:
--   drop table if exists public.support_requests;
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Step 0. Abort unless the role helpers from 0002 exist. Without them the
-- policies below would silently admit or refuse the wrong people.
-- ---------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.current_store_id()') is null
     or to_regprocedure('public.can_manage()') is null then
    raise exception '0006: role helpers from 0002 are missing — apply 0002 first';
  end if;
end $$;

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  -- Who raised it. Kept even if they later leave, so the thread still makes
  -- sense — hence `set null` rather than `cascade`.
  raised_by uuid references public.profiles(id) on delete set null,

  -- Human-quotable ticket reference. Generated, so it can never drift from
  -- the row it names and no application code has to remember to set it.
  reference text generated always as (
    'SP-' || upper(substring(replace(id::text, '-', '') from 1 for 6))
  ) stored,

  -- Contact details as typed. Deliberately NOT read from the profile: the
  -- person raising the request may want a reply somewhere else, and the
  -- form asks them explicitly.
  name text not null check (length(btrim(name)) between 1 and 120),
  email text not null check (
    length(btrim(email)) <= 255
    and btrim(email) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  category text not null default 'other'
    check (category in (
      'getting-started', 'inventory', 'sales', 'suppliers', 'customers',
      'staff', 'settings', 'ai', 'roles', 'billing', 'bug', 'other'
    )),
  -- Upper bound matters: this column is written from a user-facing form by
  -- an authenticated but otherwise untrusted client.
  message text not null check (length(btrim(message)) between 10 and 5000),

  created_at timestamptz not null default now()
);

-- The triage query is always "this store, newest first".
create index if not exists support_requests_store_created_idx
  on public.support_requests (store_id, created_at desc);

-- Serves "requests I raised", which is what a staff member reads back.
create index if not exists support_requests_raised_by_idx
  on public.support_requests (raised_by);

-- Quoting a reference back at support has to be an index hit, not a scan.
create unique index if not exists support_requests_reference_idx
  on public.support_requests (reference);

alter table public.support_requests enable row level security;

-- ---------------------------------------------------------------------
-- Insert. The store is pinned to the caller's own store by the WITH CHECK
-- rather than trusted from the payload, so a crafted request cannot file a
-- ticket into somebody else's store. Same for raised_by: it must be you.
-- ---------------------------------------------------------------------
drop policy if exists "members raise support requests" on public.support_requests;
create policy "members raise support requests" on public.support_requests
  for insert with check (
    store_id = public.current_store_id()
    and (raised_by is null or raised_by = auth.uid())
  );

-- ---------------------------------------------------------------------
-- Read. Your own always; everything in the store if you manage it.
-- ---------------------------------------------------------------------
drop policy if exists "members read own or managed support requests" on public.support_requests;
create policy "members read own or managed support requests" on public.support_requests
  for select using (
    store_id = public.current_store_id()
    and (raised_by = auth.uid() or public.can_manage())
  );

-- No update policy and no delete policy, by design. See the header.

commit;

-- ---------------------------------------------------------------------
-- Verify (run after committing, signed in as a store user):
--
--   insert into public.support_requests (store_id, raised_by, name, email, category, message)
--   values (public.current_store_id(), auth.uid(), 'Test User',
--           'test@example.com', 'bug', 'This is a test support request.');
--
--   select reference, category, created_at from public.support_requests
--     order by created_at desc limit 5;         -- expect SP-XXXXXX
--
--   -- constraints should all reject:
--   insert into public.support_requests (store_id, name, email, message)
--   values (public.current_store_id(), 'x', 'not-an-email', 'long enough message');
--   insert into public.support_requests (store_id, name, email, message)
--   values (public.current_store_id(), 'x', 'a@b.co', 'too short');
--
--   select policyname, cmd from pg_policies
--   where tablename = 'support_requests' order by cmd;
--   -- expect INSERT / SELECT, one row each (no UPDATE, no DELETE by design)
--
--   -- then clean up:
--   delete from public.support_requests where email = 'test@example.com';
--   -- ^ this will be REFUSED by RLS, which is the point. Remove it with the
--   --   service role if you need to.
-- ---------------------------------------------------------------------
