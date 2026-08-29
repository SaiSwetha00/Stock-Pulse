-- 0020_checkout_station_name.sql — let a shop name its counters
--
-- WHY
--   `checkout_stations` has identified a lane by `station_number` since
--   schema_phase3.sql, and the board renders that as "Station 01". A number is
--   fine for a row of identical self-checkouts and wrong for the shops that
--   actually have these: the counter by the door, the tobacco kiosk, the
--   express lane. Staff call them by those names on the floor, so a board that
--   cannot say them is a board that has to be translated before it can be used.
--
--   Measured before writing this: the live PostgREST schema reports exactly
--   fourteen columns on `checkout_stations` and `name` is not among them, so
--   this is genuinely absent rather than applied-but-undocumented. Check it the
--   same way rather than trusting this comment:
--
--     node -e "fetch(U+'/rest/v1/',{headers:{apikey:K,Authorization:'Bearer '+K}})
--       .then(r=>r.json())
--       .then(s=>console.log(Object.keys(s.definitions.checkout_stations.properties)))"
--
-- NULLABLE, AND IT STAYS NULLABLE
--   A station with no name is the normal case, not a missing value: most shops
--   will keep the numbers. `station_number` therefore remains the identity and
--   this is a label on top of it, which is also why there is no NOT NULL and no
--   default string. The UI falls back to "Station NN" whenever this is null or
--   blank, so an unnamed lane reads exactly as it does today.
--
--   It is deliberately NOT unique. Two counters called "Express" in different
--   corners of a large shop is a naming choice, not a data error, and
--   `station_number` already guarantees they are distinguishable rows.
--
-- NO RLS CHANGE, DELIBERATELY
--   Policies are per-table, not per-column, so the four already governing this
--   table cover the new column with no edit:
--     select  — store members            (schema_phase3.sql)
--     insert  — store members            (schema_phase3.sql)
--     update  — can_manage()             (0002_manager_role.sql)
--     delete  — can_manage()             (0012_checkout_stations_delete_policy)
--   So renaming a station is a manager/owner action and staff cannot rename a
--   lane, which matches every other write on this table. Adding a policy here
--   would widen the surface for no reason.
--
--   Note Postgres RLS cannot restrict an UPDATE to particular columns — the
--   same limitation CLAUDE.md records for `products` — so "staff may set only
--   the name" is not expressible and was not attempted.
--
-- SAFETY
--   `add column if not exists` makes this re-runnable, and adding a nullable
--   column with no default is a metadata-only change in modern Postgres: it
--   does not rewrite the table and does not lock out the live board.

begin;

do $$
begin
  if to_regclass('public.checkout_stations') is null then
    raise exception
      'Aborted: public.checkout_stations does not exist. Apply schema_phase3.sql first.';
  end if;
end $$;

alter table public.checkout_stations
  add column if not exists name text;

-- Bounded, and trimmed-empty is refused rather than stored.
--
-- The length ceiling is a UI fact as much as a data one: the board lays these
-- out in fixed-width cards, and a 200-character "name" would not be a name, it
-- would be a paragraph that breaks the layout for everyone in the shop. 40 is
-- comfortably past the longest real counter name and well short of that.
--
-- `btrim(name) <> ''` matters because an empty string and NULL would otherwise
-- be two ways of saying "unnamed", and the fallback would then have to test for
-- both at every call site. The client trims and sends NULL for a blank field;
-- this makes that the only representation the table will accept.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'checkout_stations_name_check'
      and conrelid = 'public.checkout_stations'::regclass
  ) then
    alter table public.checkout_stations
      add constraint checkout_stations_name_check
      check (name is null or (char_length(name) between 1 and 40 and btrim(name) <> ''));
  end if;
end $$;

comment on column public.checkout_stations.name is
  'Optional human label for the lane ("Express", "Kiosk 2"). NULL means the UI shows "Station NN" from station_number.';

commit;
