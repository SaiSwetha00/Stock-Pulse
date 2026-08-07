-- =====================================================================
-- 0002_manager_role.sql — add a Manager role between Owner and Staff
--
-- WHY THE PRE-FLIGHT BLOCK EXISTS:
--   Postgres RLS policies are PERMISSIVE and OR together. If a policy name
--   here does not match the live database, `drop policy if exists` silently
--   does nothing and the following `create policy` adds a SECOND permissive
--   rule — widening access instead of replacing it. Step 0 therefore verifies
--   every name up front and raises if any is missing, inside a transaction, so
--   a drifted schema aborts with zero changes applied.
--
-- PERMISSION MODEL:
--   Owner   — everything, including store settings, staff management, audit log
--   Manager — full operations: products, customers, suppliers, shipments,
--             supplier activity, shifts, checkout stations
--   Staff   — unchanged: view products/sales/shifts, create sales, adjust
--             stock as part of a sale
--
--   Deliberately NOT granted to Manager:
--     * "owner can update store"          — store settings stay with the owner
--     * "owner can insert staff profiles" — only an owner hires
--     * audit_logs_select_owner           — the audit trail watches managers too
--
-- ROLLBACK: swap public.can_manage() back to public.current_role() = 'owner'
--   in the 21 policies below, then restore the two-value role constraint.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Step 0. Abort unless every policy this migration rewrites exists.
-- ---------------------------------------------------------------------
do $$
declare
  expected text[] := array[
    'owner can insert products', 'owner can update products', 'owner can delete products',
    'owner can view customers', 'owner can insert customers',
    'owner can update customers', 'owner can delete customers',
    'owner can view suppliers', 'owner can insert suppliers',
    'owner can update suppliers', 'owner can delete suppliers',
    'owner can view shipments', 'owner can insert shipments',
    'owner can update shipments', 'owner can delete shipments',
    'owner can view supplier activity', 'owner can insert supplier activity',
    'owner can insert shifts', 'owner can update shifts', 'owner can delete shifts',
    'owner can update stations'
  ];
  missing text[];
begin
  select array_agg(e) into missing
  from unnest(expected) e
  where not exists (
    select 1 from pg_policies where schemaname = 'public' and policyname = e
  );

  if missing is not null then
    raise exception
      'Aborted: expected policies not found: %. The live schema differs from the repo — do not proceed until reconciled.',
      missing;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Step 1. Widen the role constraint. The constraint name is looked up
--         rather than assumed, in case it was created unnamed.
-- ---------------------------------------------------------------------
do $$
declare c text;
begin
  select conname into c
  from pg_constraint
  where conrelid = 'public.profiles'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%role%';
  if c is not null then
    execute format('alter table public.profiles drop constraint %I', c);
  end if;
end $$;

alter table public.profiles
  add constraint profiles_role_check check (role in ('owner', 'manager', 'staff'));

-- ---------------------------------------------------------------------
-- Step 2. One helper, so a future role change edits one function rather
--         than twenty-one policies.
-- ---------------------------------------------------------------------
create or replace function public.can_manage() returns boolean as $$
  select coalesce(
    (select role in ('owner', 'manager') from public.profiles where id = auth.uid()),
    false
  );
$$ language sql stable security definer set search_path = public;

-- ---------------------------------------------------------------------
-- Step 3. Rewrite the 21 operational policies. Same names, so each DROP
--         genuinely removes the rule its CREATE replaces.
-- ---------------------------------------------------------------------

-- Products
drop policy if exists "owner can insert products" on public.products;
create policy "owner can insert products" on public.products
  for insert with check (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can update products" on public.products;
create policy "owner can update products" on public.products
  for update using (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can delete products" on public.products;
create policy "owner can delete products" on public.products
  for delete using (store_id = public.current_store_id() and public.can_manage());

-- Customers
drop policy if exists "owner can view customers" on public.customers;
create policy "owner can view customers" on public.customers
  for select using (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can insert customers" on public.customers;
create policy "owner can insert customers" on public.customers
  for insert with check (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can update customers" on public.customers;
create policy "owner can update customers" on public.customers
  for update using (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can delete customers" on public.customers;
create policy "owner can delete customers" on public.customers
  for delete using (store_id = public.current_store_id() and public.can_manage());

-- Suppliers
drop policy if exists "owner can view suppliers" on public.suppliers;
create policy "owner can view suppliers" on public.suppliers
  for select using (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can insert suppliers" on public.suppliers;
create policy "owner can insert suppliers" on public.suppliers
  for insert with check (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can update suppliers" on public.suppliers;
create policy "owner can update suppliers" on public.suppliers
  for update using (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can delete suppliers" on public.suppliers;
create policy "owner can delete suppliers" on public.suppliers
  for delete using (store_id = public.current_store_id() and public.can_manage());

-- Shipments
drop policy if exists "owner can view shipments" on public.shipments;
create policy "owner can view shipments" on public.shipments
  for select using (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can insert shipments" on public.shipments;
create policy "owner can insert shipments" on public.shipments
  for insert with check (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can update shipments" on public.shipments;
create policy "owner can update shipments" on public.shipments
  for update using (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can delete shipments" on public.shipments;
create policy "owner can delete shipments" on public.shipments
  for delete using (store_id = public.current_store_id() and public.can_manage());

-- Supplier activity
drop policy if exists "owner can view supplier activity" on public.supplier_activity;
create policy "owner can view supplier activity" on public.supplier_activity
  for select using (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can insert supplier activity" on public.supplier_activity;
create policy "owner can insert supplier activity" on public.supplier_activity
  for insert with check (store_id = public.current_store_id() and public.can_manage());

-- Shifts
drop policy if exists "owner can insert shifts" on public.shifts;
create policy "owner can insert shifts" on public.shifts
  for insert with check (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can update shifts" on public.shifts;
create policy "owner can update shifts" on public.shifts
  for update using (store_id = public.current_store_id() and public.can_manage());
drop policy if exists "owner can delete shifts" on public.shifts;
create policy "owner can delete shifts" on public.shifts
  for delete using (store_id = public.current_store_id() and public.can_manage());

-- Checkout stations
drop policy if exists "owner can update stations" on public.checkout_stations;
create policy "owner can update stations" on public.checkout_stations
  for update using (store_id = public.current_store_id() and public.can_manage());

commit;
