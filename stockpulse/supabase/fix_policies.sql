-- Diagnostic: list existing policies
select schemaname, tablename, policyname, cmd from pg_policies where schemaname = 'public' order by tablename, policyname;

-- Re-create policies idempotently (safe even if they already exist)
drop policy if exists "store members can view store" on stores;
drop policy if exists "owner can update store" on stores;
drop policy if exists "authenticated can create store" on stores;
drop policy if exists "store members can view profiles" on profiles;
drop policy if exists "user can update own profile" on profiles;
drop policy if exists "owner can insert staff profiles" on profiles;
drop policy if exists "store members can view products" on products;
drop policy if exists "owner can insert products" on products;
drop policy if exists "owner can update products" on products;
drop policy if exists "owner can delete products" on products;
drop policy if exists "staff can update stock on sale" on products;
drop policy if exists "store members can view sales" on sales;
drop policy if exists "store members can create sales" on sales;
drop policy if exists "store members can view sale items" on sale_items;
drop policy if exists "store members can create sale items" on sale_items;

create or replace function public.current_store_id() returns uuid as $$
  select store_id from profiles where id = auth.uid()
$$ language sql security definer stable;

create or replace function public.current_role() returns text as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

create policy "store members can view store" on stores
  for select using (id = public.current_store_id());
create policy "owner can update store" on stores
  for update using (id = public.current_store_id() and public.current_role() = 'owner');
create policy "authenticated can create store" on stores
  for insert with check (auth.role() = 'authenticated');

create policy "store members can view profiles" on profiles
  for select using (store_id = public.current_store_id());
create policy "user can update own profile" on profiles
  for update using (id = auth.uid());
create policy "owner can insert staff profiles" on profiles
  for insert with check (
    store_id = public.current_store_id() or id = auth.uid()
  );

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

create policy "store members can view sales" on sales
  for select using (store_id = public.current_store_id());
create policy "store members can create sales" on sales
  for insert with check (store_id = public.current_store_id());

create policy "store members can view sale items" on sale_items
  for select using (
    sale_id in (select id from sales where store_id = public.current_store_id())
  );
create policy "store members can create sale items" on sale_items
  for insert with check (
    sale_id in (select id from sales where store_id = public.current_store_id())
  );

-- Re-list policies to confirm they now exist
select schemaname, tablename, policyname, cmd from pg_policies where schemaname = 'public' order by tablename, policyname;
