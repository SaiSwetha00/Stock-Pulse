-- StockPulse Phase 2 schema: Supplier Management + Staff Scheduling
-- Run this in the Supabase SQL editor (after the Phase 1 schema).

-- ============================================================
-- SUPPLIERS
-- ============================================================
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  primary_contact text,
  category text not null check (category in ('produce', 'dairy', 'dry_goods', 'beverages', 'bakery')),
  status text not null default 'active' check (status in ('active', 'inactive', 'issue')),
  logo_url text,
  created_at timestamptz not null default now()
);

create index suppliers_store_id_idx on suppliers(store_id);

-- ============================================================
-- SHIPMENTS
-- ============================================================
create table shipments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  po_number text not null,
  status text not null default 'ordered' check (status in ('ordered', 'shipped', 'transit', 'dock')),
  pallets integer not null default 0,
  eta date,
  created_at timestamptz not null default now()
);

create index shipments_store_id_idx on shipments(store_id);
create index shipments_supplier_id_idx on shipments(supplier_id);

-- ============================================================
-- SUPPLIER ACTIVITY (log feed)
-- ============================================================
create table supplier_activity (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  supplier_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index supplier_activity_store_id_idx on supplier_activity(store_id);

-- ============================================================
-- SHIFTS
-- ============================================================
create table shifts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  staff_id uuid references profiles(id) on delete set null,
  role_label text not null,
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create index shifts_store_id_idx on shifts(store_id);
create index shifts_shift_date_idx on shifts(shift_date);

-- ============================================================
-- RLS
-- ============================================================
alter table suppliers enable row level security;
alter table shipments enable row level security;
alter table supplier_activity enable row level security;
alter table shifts enable row level security;

-- Suppliers: owner-only (per spec)
create policy "owner can view suppliers" on suppliers
  for select using (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "owner can insert suppliers" on suppliers
  for insert with check (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "owner can update suppliers" on suppliers
  for update using (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "owner can delete suppliers" on suppliers
  for delete using (store_id = public.current_store_id() and public.current_role() = 'owner');

-- Shipments: owner-only
create policy "owner can view shipments" on shipments
  for select using (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "owner can insert shipments" on shipments
  for insert with check (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "owner can update shipments" on shipments
  for update using (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "owner can delete shipments" on shipments
  for delete using (store_id = public.current_store_id() and public.current_role() = 'owner');

-- Supplier activity: owner-only
create policy "owner can view supplier activity" on supplier_activity
  for select using (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "owner can insert supplier activity" on supplier_activity
  for insert with check (store_id = public.current_store_id() and public.current_role() = 'owner');

-- Shifts: all store members can view (needed for coverage grid + availability); only owner can write
create policy "store members can view shifts" on shifts
  for select using (store_id = public.current_store_id());
create policy "owner can insert shifts" on shifts
  for insert with check (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "owner can update shifts" on shifts
  for update using (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "owner can delete shifts" on shifts
  for delete using (store_id = public.current_store_id() and public.current_role() = 'owner');
