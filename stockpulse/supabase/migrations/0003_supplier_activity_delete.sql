-- =====================================================================
-- 0003_supplier_activity_delete.sql — let a supplier delete clean up its
-- own activity feed rows
--
-- THE BUG:
--   supplier_activity.supplier_id is `on delete set null`, so deleting a
--   supplier leaves its feed rows behind with a null supplier_id. The
--   /suppliers activity panel reads supplier_name off the row, so it keeps
--   printing "<name> added as a new supplier" for a supplier that no longer
--   exists — and because the panel shows only the ten most recent rows,
--   those orphans crowd out live activity.
--
--   deleteSupplier could not clean them up even if it tried: supplier_activity
--   is the one table in this schema with RLS enabled and no delete policy
--   (it has select + insert only, from schema_phase2.sql and 0002). Any
--   delete against it silently affects zero rows.
--
-- WHY DELETING FEED ROWS IS SAFE:
--   supplier_activity is an informational feed, not the record of truth.
--   The durable history lives in audit_logs, where the audit_suppliers
--   trigger from 0001 records the delete together with a full `before`
--   snapshot of the row. Nothing auditable is lost here.
--
-- STEP 2 DELETES PRODUCTION ROWS. It removes activity that is *already*
--   orphaned by past deletes. Review it before running; drop that block if
--   you would rather leave the existing orphans in place. Step 1 is additive
--   and is what fixes the behaviour going forward.
--
-- ROLLBACK:
--   drop policy "manager can delete supplier activity" on public.supplier_activity;
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Step 0. Abort unless the table is in the state this migration expects.
--
-- Same reasoning as 0002: policies are PERMISSIVE and OR together, so
-- creating one against a drifted schema widens access instead of
-- correcting it. Bail out with zero changes if a delete policy already
-- exists under some other name.
-- ---------------------------------------------------------------------
do $$
declare
  existing text;
begin
  if to_regclass('public.supplier_activity') is null then
    raise exception '0003: public.supplier_activity does not exist';
  end if;

  select policyname into existing
  from pg_policies
  where schemaname = 'public'
    and tablename = 'supplier_activity'
    and cmd = 'DELETE'
    and policyname <> 'manager can delete supplier activity'
  limit 1;

  if existing is not null then
    raise exception
      '0003: supplier_activity already has a DELETE policy (%). Reconcile by hand.', existing;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Step 1. The missing delete policy.
--
-- Scoped exactly like the select/insert policies 0002 left in place:
-- own store, and can_manage() so an owner and a manager are treated
-- alike. A manager may already create these rows; letting them remove
-- the ones belonging to a supplier they are allowed to delete adds no
-- reach they did not have.
-- ---------------------------------------------------------------------
drop policy if exists "manager can delete supplier activity" on public.supplier_activity;
create policy "manager can delete supplier activity" on public.supplier_activity
  for delete using (store_id = public.current_store_id() and public.can_manage());

-- ---------------------------------------------------------------------
-- Step 2. Clear activity already orphaned by earlier deletes.
--
-- supplier_id is null only when the referenced supplier has been deleted:
-- every insert path in app/(dashboard)/suppliers/actions.ts writes a
-- supplier_id. Runs as the migration role, so the new policy above does
-- not gate it.
-- ---------------------------------------------------------------------
do $$
declare
  purged bigint;
begin
  delete from public.supplier_activity where supplier_id is null;
  get diagnostics purged = row_count;
  raise notice '0003: purged % orphaned supplier_activity row(s)', purged;
end $$;

commit;

-- ---------------------------------------------------------------------
-- Verify (run after committing):
--
--   select policyname, cmd from pg_policies
--   where tablename = 'supplier_activity' order by cmd;
--   -- expect DELETE / INSERT / SELECT, one row each
--
--   select count(*) from public.supplier_activity where supplier_id is null;
--   -- expect 0
-- ---------------------------------------------------------------------
