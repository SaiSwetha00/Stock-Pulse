-- ============================================================
-- 0019 — record the catalogue price alongside the charged price
-- ============================================================
-- Follow-up to 0018, written as its own migration rather than as an edit to
-- that file, because 0018 IS APPLIED. Editing an applied migration makes the
-- file disagree with the database it supposedly describes, and the next person
-- to read it is misled with no way to notice.
--
-- ------------------------------------------------------------
-- THIS MIGRATION REQUIRES 0018. IT WILL REFUSE TO RUN WITHOUT IT.
-- ------------------------------------------------------------
-- Two hard dependencies, both checked in Step 0 below:
--   1. `public.replay_sale` must already exist, because this migration
--      REPLACES it. Run alone on a database without 0018, the CREATE OR
--      REPLACE would happily create a function whose supporting table and
--      index are missing.
--   2. `sales.client_id` must exist, because the replaced body writes it.
--
-- The function signature below is byte-identical to 0018's. That matters more
-- than it looks: Postgres overloads on argument types, so a signature that
-- differed by even one default would create a SECOND replay_sale rather than
-- replacing the first, and callers would silently keep hitting the old one.
--
-- ------------------------------------------------------------
-- WHAT THIS IS FOR
-- ------------------------------------------------------------
-- `replay_sale` trusts the client's `unit_price`, and has to: the server
-- cannot reconstruct what a customer was charged last week, and validating
-- against today's price would reject legitimate sales made either side of a
-- price change.
--
-- That leaves one question unanswerable — did a line replay at a price that
-- never matched the catalogue? This records the answer without changing any
-- behaviour: `server_unit_price` is the product's own price at the moment of
-- replay, taken from the row the function has already fetched.
--
-- IT IS RECORDED, NEVER ENFORCED. Nothing compares the two, nothing rejects a
-- mismatch, and the total is still computed from the CHARGED price. A
-- divergence is a question for a human, not a reason to refuse a sale that has
-- already happened.
--
-- NULL for every online sale. `log_sale` is untouched and does not set it,
-- which is correct: for a sale made online the charged price came from the
-- catalogue, so a second copy would say nothing. Null therefore means "this
-- sale did not come through replay", and that is a useful distinction rather
-- than missing data.

begin;

-- ------------------------------------------------------------
-- Step 0. Refuse to run against the wrong database.
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.sale_items') is null then
    raise exception 'Aborted: public.sale_items does not exist. Apply schema.sql first.';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sales' and column_name = 'client_id'
  ) then
    raise exception 'Aborted: sales.client_id is missing. Apply 0018 first.';
  end if;
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'replay_sale'
  ) then
    raise exception 'Aborted: public.replay_sale does not exist. Apply 0018 first.';
  end if;
end $$;

-- ------------------------------------------------------------
-- Step 1. The column.
-- ------------------------------------------------------------
-- Nullable with no default and no backfill. Existing rows stay NULL, which is
-- the honest value: nobody knows what the catalogue said when they were
-- written, and inventing a number by copying today's price would manufacture
-- evidence.
alter table public.sale_items
  add column if not exists server_unit_price numeric(10,2);

comment on column public.sale_items.server_unit_price is
  'The product catalogue price at the moment an OFFLINE sale was replayed, '
  'recorded so a client-supplied unit_price can be compared against it. NULL '
  'for sales made online through log_sale. Recorded, never enforced - see 0019.';

-- ------------------------------------------------------------
-- Step 2. Replace replay_sale, signature unchanged.
-- ------------------------------------------------------------
create or replace function public.replay_sale(
  p_client_id uuid,
  -- [{product_id, quantity, unit_price}] - unit_price is the price CHARGED.
  p_items jsonb,
  p_payment_method text,
  -- Who made the sale, captured on the device at the time. Null falls back to
  -- the caller, which is right for an online sale replayed immediately.
  p_sold_by uuid default null,
  -- When the sale happened, not when it synced.
  p_created_at timestamptz default null
) returns jsonb as $$
declare
  v_store_id uuid := public.current_store_id();
  v_sale_id uuid;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_product products%rowtype;
  v_qty integer;
  v_price numeric(10,2);
  v_sold_by uuid;
  v_discrepancies jsonb := '[]'::jsonb;
  v_taken integer;
begin
  if v_store_id is null then
    raise exception 'No store associated with current user';
  end if;
  if p_client_id is null then
    raise exception 'replay_sale requires a client_id';
  end if;

  -- Fast path. The unique index below is the actual guarantee; this only
  -- avoids doing the work twice in the common case.
  select id into v_sale_id from sales
    where store_id = v_store_id and client_id = p_client_id;
  if v_sale_id is not null then
    return jsonb_build_object('status', 'duplicate', 'sale_id', v_sale_id,
                              'total', (select total from sales where id = v_sale_id),
                              'discrepancies', '[]'::jsonb);
  end if;

  -- `sold_by` must belong to THIS store. Without this a definer function that
  -- accepts a user id would let one shop attribute sales to another's staff.
  v_sold_by := coalesce(p_sold_by, auth.uid());
  if not exists (select 1 from profiles where id = v_sold_by and store_id = v_store_id) then
    raise exception 'sold_by % is not a member of this store', v_sold_by;
  end if;

  -- TOTAL IS RECOMPUTED HERE, from the snapshotted per-line prices, and never
  -- taken from the client's stored figure. Phase 3 observed a queued float of
  -- 13.450000000000001; numeric(10,2) is what a shop is actually paid.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    v_price := round((v_item->>'unit_price')::numeric, 2);
    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity in replayed sale';
    end if;
    if v_price is null or v_price < 0 then
      raise exception 'Invalid unit_price in replayed sale';
    end if;
    v_total := v_total + round(v_price * v_qty, 2);
  end loop;

  insert into sales (store_id, sold_by, total, payment_method, client_id, created_at)
  values (v_store_id, v_sold_by, v_total, p_payment_method, p_client_id,
          coalesce(p_created_at, now()))
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    v_price := round((v_item->>'unit_price')::numeric, 2);

    select * into v_product from products
      where id = (v_item->>'product_id')::uuid and store_id = v_store_id;
    if v_product.id is null then
      raise exception 'Product not found: %', v_item->>'product_id';
    end if;

    insert into sale_items (sale_id, product_id, product_name, quantity, unit_price,
                           line_total, server_unit_price)
    values (v_sale_id, v_product.id, v_product.name, v_qty, v_price,
            round(v_price * v_qty, 2),
            -- 0019: the catalogue price AT REPLAY TIME, from the row this
            -- function has already fetched. Recorded, never enforced.
            v_product.unit_price);

    -- The reconciliation. Take what is there, never below zero, and record the
    -- gap rather than swallowing it.
    v_taken := least(v_qty, greatest(v_product.stock, 0));

    update products set stock = greatest(stock - v_qty, 0), updated_at = now()
      where id = v_product.id;

    if v_qty > v_taken then
      insert into stock_discrepancies
        (store_id, product_id, sale_id, client_id, units_sold, stock_available, shortfall)
      values (v_store_id, v_product.id, v_sale_id, p_client_id,
              v_qty, v_product.stock, v_qty - v_taken);

      v_discrepancies := v_discrepancies || jsonb_build_object(
        'product_id', v_product.id,
        'product_name', v_product.name,
        'units_sold', v_qty,
        'stock_available', v_product.stock,
        'shortfall', v_qty - v_taken
      );
    end if;
  end loop;

  return jsonb_build_object('status', 'created', 'sale_id', v_sale_id,
                            'total', v_total, 'discrepancies', v_discrepancies);

exception
  -- The index refused a concurrent duplicate. Report it as one rather than as
  -- an error: the other request already recorded this sale.
  when unique_violation then
    select id into v_sale_id from sales
      where store_id = v_store_id and client_id = p_client_id;
    return jsonb_build_object('status', 'duplicate', 'sale_id', v_sale_id,
                              'total', (select total from sales where id = v_sale_id),
                              'discrepancies', '[]'::jsonb);
end;
$$ language plpgsql security definer set search_path = public;
-- The grant is re-stated because CREATE OR REPLACE preserves privileges, but
-- restating it costs nothing and makes this file runnable on its own terms.
grant execute on function public.replay_sale(uuid, jsonb, text, uuid, timestamptz) to authenticated;

commit;

-- ============================================================
-- POST-APPLY CHECKS
-- ============================================================
--   1. The column exists and is nullable:
--
--      select column_name, data_type, is_nullable
--        from information_schema.columns
--       where table_name = 'sale_items' and column_name = 'server_unit_price';
--
--   2. OLD ROWS STAY NULL AND STILL READ. Must return the full count with
--      zero errors, and with_server_price = 0:
--
--      select count(*) total, count(server_unit_price) with_server_price
--        from public.sale_items;
--
--   3. A REPLAYED sale sets it. Call replay_sale with a unit_price that is
--      deliberately NOT the catalogue price, then:
--
--      select unit_price, server_unit_price from public.sale_items
--       where sale_id = '<the new sale>';
--
--      unit_price must be what was sent; server_unit_price must be the
--      product's own price; and sales.total must still be computed from
--      unit_price, NOT from server_unit_price.
--
--   4. There is exactly ONE replay_sale, not two overloads:
--
--      select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--       where n.nspname = 'public' and p.proname = 'replay_sale';
--
-- ============================================================
-- DOWN
-- ============================================================
--   alter table public.sale_items drop column if exists server_unit_price;
--   -- and re-run 0018's Step 4 to restore the previous function body.
