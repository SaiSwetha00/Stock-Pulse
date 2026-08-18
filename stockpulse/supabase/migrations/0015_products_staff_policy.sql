-- ============================================================
-- 0015 — narrow "staff can update stock on sale" on products
-- ============================================================
--
--   *** APPLIED 2026-08-17, and VERIFIED. ***
--
-- Was written as ..._PROPOSAL.sql and renamed on apply, because a filename
-- saying PROPOSAL next to an applied migration is a lie a reader would believe
-- without opening the file.
--
-- The three post-apply checks at the bottom were run with real sessions and
-- the anon key, rows actually affected (D24):
--
--     role      log_sale            PATCH products.brand
--     staff     200, 1 row, -1      200, **0 rows**   <- refused, the fix
--     manager   200, 1 row, -1      200, 1 row        <- unaffected
--     owner     200, 1 row, -1      200, 1 row        <- unaffected
--
-- Selling still works for staff, which was the risk. The definer guard below
-- did not fire, confirming log_sale runs with definer rights as expected.
--
-- ------------------------------------------------------------
-- THE PROBLEM, MEASURED
-- ------------------------------------------------------------
-- schema.sql creates, and 0002 never rewrote:
--
--     create policy "staff can update stock on sale" on products
--       for update using (store_id = public.current_store_id());
--
-- No role test. No column list. No WITH CHECK. Permissive policies are OR'd,
-- so this one alone lets ANY store member update ANY column of ANY product in
-- their own store. Measured repeatedly with real sessions and the anon key,
-- rows actually affected (D24):
--
--     role      PATCH products.brand / .barcode / .stock
--     staff     200, 1 row
--     manager   200, 1 row
--     owner     200, 1 row
--
-- The name says "stock on sale". The grant is "everything, always".
--
-- What has been stopping staff in practice is the app-layer canManage() check
-- in app/(dashboard)/inventory/actions.ts — not the database. A crafted
-- PostgREST request bypasses that entirely.
--
-- ------------------------------------------------------------
-- WHY THE OBVIOUS FIX IS WRONG
-- ------------------------------------------------------------
-- The tempting change is to add `and public.can_manage()` and be done. That
-- breaks selling: log_sale decrements products.stock, and staff must be able
-- to sell. /sales has no role guard precisely because staff work the till.
--
-- Postgres RLS also cannot restrict an UPDATE to particular COLUMNS — there is
-- no `for update of (stock)`. Column-level control is a GRANT, and GRANTs do
-- not compose with RLS the way one would like here. So "let staff change only
-- stock" cannot be written as a policy at all.
--
-- ------------------------------------------------------------
-- THE PROPOSAL
-- ------------------------------------------------------------
-- Drop the blanket staff UPDATE policy entirely, and let log_sale do the
-- decrement with definer rights.
--
-- This works because log_sale is ALREADY `security definer` (schema.sql) — it
-- runs as its owner, so it is not subject to the caller's RLS on products. The
-- staff UPDATE policy is therefore not what makes selling work; it is
-- redundant to the sale path and load-bearing only for direct PATCHes, which
-- is exactly what should stop.
--
-- *** VERIFY THAT CLAIM BEFORE APPLYING. *** If log_sale turns out NOT to be
-- security definer on the hosted project, this migration breaks every sale by
-- a staff member, which is the worst possible failure for a shop. The check:
--
--     select p.proname, p.prosecdef
--     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--     where n.nspname = 'public' and p.proname = 'log_sale';
--     -- prosecdef must be true
--
-- ------------------------------------------------------------

begin;

-- Guard: refuse on a database where the assumption does not hold.
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'log_sale' and p.prosecdef
  ) then
    raise exception
      'Aborted: public.log_sale is not SECURITY DEFINER. Dropping the staff '
      'UPDATE policy would stop staff completing sales. Investigate first.';
  end if;
end $$;

drop policy if exists "staff can update stock on sale" on public.products;

commit;

-- ============================================================
-- POST-APPLY CHECKS — run all three, do not infer
-- ============================================================
--   1. staff can still SELL (the thing that must not break):
--        sign in as staff, POST /rest/v1/rpc/log_sale with one item,
--        expect HTTP 200 and products.stock decremented by the quantity.
--
--   2. staff can no longer PATCH products directly (the thing being fixed):
--        sign in as staff, PATCH /rest/v1/products?id=eq.<id> {"brand":"x"}
--        expect HTTP 200 with **0 rows** — an RLS refusal is a successful
--        statement matching no rows, never an error (D24).
--
--   3. manager and owner are UNAFFECTED:
--        the same PATCH as each, expect 200 with 1 row, via
--        "owner can update products" which already carries can_manage().
--
-- ============================================================
-- DOWN
-- ============================================================
--   create policy "staff can update stock on sale" on public.products
--     for update using (store_id = public.current_store_id());
