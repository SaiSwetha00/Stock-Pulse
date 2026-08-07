-- StockPulse Phase 4 schema: Customer Records + Loyalty
-- Run this in the Supabase SQL editor (after Phase 1 + Phase 2 + Phase 3 schema).

create table customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  loyalty_tier text not null default 'bronze'
    check (loyalty_tier in ('bronze', 'silver', 'gold', 'platinum')),
  total_spent numeric(10,2) not null default 0,
  visits integer not null default 0,
  notes text,
  last_visit_at timestamptz,
  created_at timestamptz not null default now()
);

create index customers_store_id_idx on customers(store_id);

-- The list view sorts by created_at within a store.
create index customers_store_created_idx on customers(store_id, created_at desc);

-- Stop the same person being added twice, without blocking the many customers
-- who never give an email (multiple NULLs stay allowed under a partial index).
create unique index customers_store_email_idx
  on customers(store_id, lower(email))
  where email is not null;

alter table customers enable row level security;

-- Customer records are owner-only. This mirrors the nav role filter in
-- lib/nav.ts and the redirect guard in app/(dashboard)/customers/page.tsx —
-- without these policies a staff member could still reach the rows via the API.
create policy "owner can view customers" on customers
  for select using (
    store_id = public.current_store_id() and public.current_role() = 'owner'
  );

create policy "owner can insert customers" on customers
  for insert with check (
    store_id = public.current_store_id() and public.current_role() = 'owner'
  );

create policy "owner can update customers" on customers
  for update using (
    store_id = public.current_store_id() and public.current_role() = 'owner'
  );

create policy "owner can delete customers" on customers
  for delete using (
    store_id = public.current_store_id() and public.current_role() = 'owner'
  );
