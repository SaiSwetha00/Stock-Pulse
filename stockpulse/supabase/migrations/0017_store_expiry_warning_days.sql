-- ============================================================
-- 0017 — stores.expiry_warning_days
-- ============================================================
-- PHASE 3 OF EXPIRY TRACKING. One column.
--
-- The threshold that decides what counts as "expiring soon", in DAYS,
-- defaulting to 7. It goes on `stores` because that is where this app already
-- keeps a per-store stock threshold — `low_stock_threshold_units` — and where
-- /settings already edits one. A second home for the same idea is how two
-- settings pages get built.
--
-- ------------------------------------------------------------
-- DECISION 1 — this replaces `perishables_warning_hours` in meaning, but does
-- NOT drop it here
-- ------------------------------------------------------------
-- `stores.perishables_warning_hours integer not null default 48` has existed
-- since schema.sql:14. /settings has always shown a slider for it. **Nothing
-- has ever read it** — measured across the whole tree, the only references are
-- SettingsClient writing it back and two marketing paragraphs promising the
-- feature. It is a D5-shaped column: created in anticipation, dead ever since.
--
-- So this is not a new setting sitting beside an old one. It is the same
-- setting, finally connected, in the unit the feature actually needs.
--
-- It is not dropped in this migration, and that is deliberate. `main`'s
-- SettingsClient still writes `perishables_warning_hours`; dropping the column
-- would break saving settings on production for the whole window between this
-- migration being applied and the Phase 3 branch being merged. Dropping it is
-- a one-line migration the moment nothing on `main` references it:
--
--     alter table public.stores drop column perishables_warning_hours;
--
-- ------------------------------------------------------------
-- DECISION 2 — every existing row gets 7. The old value is NOT converted.
-- ------------------------------------------------------------
-- The obvious move is `greatest(1, round(perishables_warning_hours / 24.0))`,
-- preserving what each shop chose. It is the wrong move here, because what
-- they chose never did anything: no query has ever read that column, so no
-- shop has ever seen a warning at 48 hours and formed an expectation about it.
-- Converting the untouched default would ship every store a 2-day window while
-- the feature they are being given is specified as 7.
--
-- Preserving a number that never had an effect is not respecting a preference.
-- It is inheriting a placeholder.
--
-- ------------------------------------------------------------
-- DECISION 3 — days, not hours
-- ------------------------------------------------------------
-- `product_batches.expiry_date` is a `date`. There is no hour on it to compare
-- against, so an hours-granular threshold cannot mean anything more precise
-- than the day it lands in — 12 hours and 23 hours are the same query. A unit
-- finer than the data is a control that promises precision it cannot deliver.
--
-- The marketing copy still says "12 hours to a week" (FAQSection,
-- HowItWorksSection). That copy is now wrong and is corrected on this branch.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Step 0. Refuse to run against the wrong database.
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.stores') is null then
    raise exception 'Aborted: public.stores does not exist. Apply schema.sql first.';
  end if;
end $$;

-- ------------------------------------------------------------
-- Step 1. The column.
-- ------------------------------------------------------------
-- `not null default 7` gives every existing row 7 without a separate update,
-- which is the whole of DECISION 2.
alter table public.stores
  add column if not exists expiry_warning_days integer not null default 7;

comment on column public.stores.expiry_warning_days is
  'How many days ahead a dated batch counts as "expiring soon". Replaces the '
  'never-read perishables_warning_hours; see migration 0017 DECISION 1.';

-- ------------------------------------------------------------
-- Step 2. A bound, so a crafted request cannot store nonsense.
-- ------------------------------------------------------------
-- 1..90. Below 1 the setting means "never warn", which is a checkbox and not
-- this control; above 90 a grocery is warning about stock it has not bought.
-- Mirrored by validateStoreSettings in lib/validation/settings.ts — CLAUDE.md
-- records a past bug where an app-layer rule and a database rule drifted, so
-- these two must be changed together.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.stores'::regclass
      and conname = 'stores_expiry_warning_days_check'
  ) then
    alter table public.stores
      add constraint stores_expiry_warning_days_check
      check (expiry_warning_days between 1 and 90);
  end if;
end $$;

commit;

-- ============================================================
-- POST-APPLY CHECKS — run all of them, do not infer
-- ============================================================
--   1. The column is in the PostgREST schema cache. MUST list it:
--
--      select column_name, column_default, is_nullable
--      from information_schema.columns
--      where table_name = 'stores' and column_name = 'expiry_warning_days';
--
--   2. Every store has 7. MUST return zero rows:
--
--      select id, name, expiry_warning_days from public.stores
--      where expiry_warning_days is distinct from 7;
--
--   3. The bound bites. MUST fail with 23514:
--
--      update public.stores set expiry_warning_days = 0;
--      update public.stores set expiry_warning_days = 400;
--
--   4. RLS is unchanged — no new policy is added or needed, because `stores`
--      already carries the UPDATE policy /settings saves through. Confirm with
--      a real owner session and the anon key, rows actually affected (D24):
--
--        owner   PATCH stores.expiry_warning_days -> 200 · 1 row
--        manager PATCH stores.expiry_warning_days -> whatever it was before
--                this migration for low_stock_threshold_units; this column
--                must match it exactly, since both are store settings.
--
-- ============================================================
-- DOWN
-- ============================================================
--   alter table public.stores drop constraint if exists stores_expiry_warning_days_check;
--   alter table public.stores drop column if exists expiry_warning_days;
--
-- Lossless: `perishables_warning_hours` is untouched by this migration, so
-- reversing it returns the table to exactly its pre-0017 shape.
