-- StockPulse database schema
-- Run this in the Supabase SQL editor.

-- ============================================================
-- STORES
-- ============================================================
create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  address text,
  contact_phone text,
  low_stock_threshold_units integer not null default 15,
  perishables_warning_hours integer not null default 48,
  critical_stock_alerts boolean not null default true,
  daily_digest boolean not null default true,
  supplier_updates boolean not null default false,
  theme text not null default 'light',
  created_at timestamptz not null default now()
);

-- ============================================================
-- PROFILES  (mirrors auth.users, adds app-level fields)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('owner', 'staff')),
  job_title text,
  phone text,
  location text,
  avatar_url text,
  invited boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  brand text,
  sku text,
  category text not null check (category in ('produce', 'dairy', 'packaged', 'beverages', 'household')),
  unit_price numeric(10,2) not null default 0,
  unit text not null default 'ea',
  stock integer not null default 0,
  low_stock_threshold integer not null default 10,
  expiry_date date,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_store_id_idx on products(store_id);
create index products_category_idx on products(category);

-- ============================================================
-- SALES
-- ============================================================
create table sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  sold_by uuid not null references profiles(id),
  total numeric(10,2) not null default 0,
  payment_method text not null default 'cash' check (payment_method in ('cash', 'card', 'nfc')),
  created_at timestamptz not null default now()
);

create index sales_store_id_idx on sales(store_id);
create index sales_created_at_idx on sales(created_at);

-- ============================================================
-- SALE ITEMS
-- ============================================================
create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  product_name text not null,
  quantity integer not null,
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null
);

create index sale_items_sale_id_idx on sale_items(sale_id);

-- ============================================================
-- RLS
-- ============================================================
alter table stores enable row level security;
alter table profiles enable row level security;
alter table products enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;

create function public.current_store_id() returns uuid as $$
  select store_id from profiles where id = auth.uid()
$$ language sql security definer stable;

create function public.current_role() returns text as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Stores: members can read/update their own store
create policy "store members can view store" on stores
  for select using (id = public.current_store_id());
create policy "owner can update store" on stores
  for update using (id = public.current_store_id() and public.current_role() = 'owner');
create policy "authenticated can create store" on stores
  for insert with check (auth.role() = 'authenticated');

-- Profiles
create policy "store members can view profiles" on profiles
  for select using (store_id = public.current_store_id());
create policy "user can update own profile" on profiles
  for update using (id = auth.uid());
create policy "owner can insert staff profiles" on profiles
  for insert with check (
    store_id = public.current_store_id() or id = auth.uid()
  );

-- Products
create policy "store members can view products" on products
  for select using (store_id = public.current_store_id());
create policy "owner can insert products" on products
  for insert with check (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "owner can update products" on products
  for update using (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "owner can delete products" on products
  for delete using (store_id = public.current_store_id() and public.current_role() = 'owner');
create policy "staff can update stock on sale" on products
  for update using (store_id = public.current_store_id());

-- Sales
create policy "store members can view sales" on sales
  for select using (store_id = public.current_store_id());
create policy "store members can create sales" on sales
  for insert with check (store_id = public.current_store_id());

-- Sale items
create policy "store members can view sale items" on sale_items
  for select using (
    sale_id in (select id from sales where store_id = public.current_store_id())
  );
create policy "store members can create sale items" on sale_items
  for insert with check (
    sale_id in (select id from sales where store_id = public.current_store_id())
  );

-- ============================================================
-- LOG SALE (atomic: creates sale + sale_items, decrements stock)
-- ============================================================
create or replace function public.log_sale(
  p_items jsonb,
  p_payment_method text
) returns uuid as $$
declare
  v_store_id uuid := public.current_store_id();
  v_sale_id uuid;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_product products%rowtype;
begin
  if v_store_id is null then
    raise exception 'No store associated with current user';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from products
      where id = (v_item->>'product_id')::uuid and store_id = v_store_id;

    if v_product.id is null then
      raise exception 'Product not found: %', v_item->>'product_id';
    end if;

    if v_product.stock < (v_item->>'quantity')::int then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_total := v_total + (v_product.unit_price * (v_item->>'quantity')::int);
  end loop;

  insert into sales (store_id, sold_by, total, payment_method)
  values (v_store_id, auth.uid(), v_total, p_payment_method)
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from products
      where id = (v_item->>'product_id')::uuid and store_id = v_store_id;

    insert into sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total)
    values (
      v_sale_id,
      v_product.id,
      v_product.name,
      (v_item->>'quantity')::int,
      v_product.unit_price,
      v_product.unit_price * (v_item->>'quantity')::int
    );

    update products set stock = stock - (v_item->>'quantity')::int, updated_at = now()
      where id = v_product.id;
  end loop;

  return v_sale_id;
end;
$$ language plpgsql security definer;
