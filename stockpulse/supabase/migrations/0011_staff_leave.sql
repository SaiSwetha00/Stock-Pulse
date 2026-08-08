-- =====================================================================
-- 0011_staff_leave.sql — holiday, sick days and other absence
--
-- WHAT THIS ADDS:
--   A date range during which a named person is not available to be
--   rostered. The rota draws it distinctly, and saveShift refuses to
--   assign anyone a shift on a day they are on leave.
--
-- WHY A RANGE AND NOT ONE ROW PER DAY:
--   A fortnight's holiday is one decision and should be one row — one
--   thing to enter, one thing to cancel, one thing to correct. Expanding
--   it to fourteen rows makes "cancel the second week" a multi-row edit
--   and invites half-deleted leave. Overlap tests are a range comparison
--   either way, and both are indexed below.
--
-- WHY start AND end ARE BOTH INCLUSIVE:
--   `starts_on = ends_on` is a single day off, which is the commonest
--   entry by far. A half-open range would make the commonest case the one
--   that reads wrongly (ends_on = the day you are back), and every caller
--   would have to remember which convention this table uses. The check
--   constraint below states it once.
--
-- WHY staff_id IS NOT NULL, UNLIKE shifts.staff_id:
--   An unassigned shift is a real thing — a gap in cover somebody has to
--   fill. Unassigned leave is not a thing: leave belongs to a person by
--   definition. `on delete cascade` rather than `set null` for the same
--   reason — if the profile goes, the absence it described is meaningless.
--
-- AUTHORIZATION:
--   Reading is store-wide, deliberately. Everyone can already see the
--   whole rota, and "who is off next Tuesday" is exactly the question the
--   rota exists to answer — hiding it would leave staff seeing an
--   unexplained empty column. `kind` is coarse (holiday/sick/unpaid/
--   other) and `note` is optional precisely so nothing here needs to be
--   medical detail.
--
--   Writing is can_manage() — owners and managers, matching shifts. The
--   person who builds the rota is the person who records absence against
--   it.
--
-- ROLLBACK:
--   drop table if exists public.staff_leave;
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Step 0. Abort unless the helpers this migration's policies depend on
--         exist. Without them every policy below would be created
--         referencing a missing function and fail at query time rather
--         than here, which is a far worse place to find out.
-- ---------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.current_store_id()') is null then
    raise exception 'Aborted: public.current_store_id() is missing. Apply the base schema first.';
  end if;
  if to_regprocedure('public.can_manage()') is null then
    raise exception 'Aborted: public.can_manage() is missing. Apply 0002_manager_role.sql first.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Step 1. The table.
-- ---------------------------------------------------------------------
create table if not exists public.staff_leave (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  staff_id uuid not null references public.profiles(id) on delete cascade,
  starts_on date not null,
  ends_on date not null,
  kind text not null default 'holiday'
    check (kind in ('holiday', 'sick', 'unpaid', 'other')),
  note text,
  -- Who recorded it. `set null` rather than cascade: if the manager who
  -- entered someone's holiday later leaves, the holiday itself is still
  -- true and must not disappear with them.
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),

  -- A range that ends before it starts is not a typo to be tolerated —
  -- it would silently match no days and read on screen as leave that
  -- does nothing.
  constraint staff_leave_range_valid check (ends_on >= starts_on)
);

-- The overlap query the rota and saveShift both run is
--   store_id = ? and staff_id = ? and starts_on <= ? and ends_on >= ?
-- so the leading columns are the equality ones.
create index if not exists staff_leave_store_staff_idx
  on public.staff_leave (store_id, staff_id);

-- The week view asks for every leave row overlapping a 7-day window
-- regardless of person, which the index above cannot serve.
create index if not exists staff_leave_store_dates_idx
  on public.staff_leave (store_id, starts_on, ends_on);

-- ---------------------------------------------------------------------
-- Step 2. RLS.
--
-- The store_id filters in the application code are for the indexes. These
-- are the enforcement: the service-role client bypasses them, and every
-- other path in the app goes through them.
-- ---------------------------------------------------------------------
alter table public.staff_leave enable row level security;

drop policy if exists "store can view leave" on public.staff_leave;
create policy "store can view leave" on public.staff_leave
  for select using (store_id = public.current_store_id());

drop policy if exists "managers can insert leave" on public.staff_leave;
create policy "managers can insert leave" on public.staff_leave
  for insert with check (store_id = public.current_store_id() and public.can_manage());

drop policy if exists "managers can update leave" on public.staff_leave;
create policy "managers can update leave" on public.staff_leave
  for update using (store_id = public.current_store_id() and public.can_manage());

drop policy if exists "managers can delete leave" on public.staff_leave;
create policy "managers can delete leave" on public.staff_leave
  for delete using (store_id = public.current_store_id() and public.can_manage());

commit;
