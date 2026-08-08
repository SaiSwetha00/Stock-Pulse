-- =====================================================================
-- 0012_checkout_stations_delete_policy.sql — let the shop remove a counter
--
-- THE BUG THIS FIXES:
--   checkout_stations shipped with select/insert/update policies and no
--   DELETE policy. RLS denies by default, so a delete through the normal
--   client returned HTTP 200 and removed zero rows — a silent no-op. There
--   is no way to remove a checkout counter from the UI, and the failure
--   reports success, which is the worst combination.
--
--   Found while clearing four demo rows from a live store: the delete came
--   back 200 with the rows still present.
--
-- WHO MAY DELETE:
--   public.can_manage() — owners and managers. This matches the existing
--   "owner can update stations" policy that 0002 rewrote, so removing a
--   counter takes exactly the same authority as changing one. Staff can
--   still read the board and set a station's status through the update
--   policy; they cannot remove hardware from the configuration.
--
-- ROLLBACK:
--   drop policy if exists "managers can delete stations" on public.checkout_stations;
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Step 0. Abort unless the helpers this policy depends on exist, and
--         unless the table is actually missing a delete policy — so a
--         re-run on an already-patched database is a no-op rather than a
--         second permissive rule. RLS policies OR together, so silently
--         adding a duplicate would widen access, not replace it.
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('public.checkout_stations') is null then
    raise exception 'Aborted: public.checkout_stations does not exist. Apply schema_phase3.sql first.';
  end if;
  if to_regprocedure('public.current_store_id()') is null then
    raise exception 'Aborted: public.current_store_id() is missing. Apply the base schema first.';
  end if;
  if to_regprocedure('public.can_manage()') is null then
    raise exception 'Aborted: public.can_manage() is missing. Apply 0002_manager_role.sql first.';
  end if;
end $$;

-- Named to match the 0002 convention ("owner can update stations" became
-- can_manage()-gated there; this is the same authority, named for what it
-- now actually checks).
drop policy if exists "managers can delete stations" on public.checkout_stations;
create policy "managers can delete stations" on public.checkout_stations
  for delete using (store_id = public.current_store_id() and public.can_manage());

commit;
