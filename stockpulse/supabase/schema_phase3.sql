-- StockPulse Phase 3 schema: Self-Checkout Monitoring
-- Run this in the Supabase SQL editor (after Phase 1 + Phase 2 schema).

create table checkout_stations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  station_number integer not null,
  status text not null default 'available' check (status in ('available', 'in_use', 'review', 'assistance', 'maintenance')),
  payment_type text not null default 'Cash & Card',
  items_scanned integer not null default 0,
  current_total numeric(10,2) not null default 0,
  session_started_at timestamptz,
  alert_type text check (alert_type in ('weight_mismatch', 'age_verification')),
  alert_expected numeric(10,2),
  alert_actual numeric(10,2),
  alert_item text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index checkout_stations_store_id_idx on checkout_stations(store_id);

alter table checkout_stations enable row level security;

-- Both Owner and Staff can view stations.
create policy "store members can view stations" on checkout_stations
  for select using (store_id = public.current_store_id());

-- Seeding stations is a store-member action (used by the demo seeder).
create policy "store members can insert stations" on checkout_stations
  for insert with check (store_id = public.current_store_id());

-- Only the Owner may clear/override alerts or change station state.
create policy "owner can update stations" on checkout_stations
  for update using (store_id = public.current_store_id() and public.current_role() = 'owner');
