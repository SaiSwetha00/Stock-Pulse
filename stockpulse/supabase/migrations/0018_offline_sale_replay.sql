-- ============================================================
-- 0018 — replaying offline sales, idempotently and honestly
-- ============================================================
-- PHASE 4 OF OFFLINE MODE. Schema + one function.
--
-- Phase 3 queues sales on the device. This is what lets them reach the
-- database exactly once, at the price they were actually sold for, without
-- silently rewriting history or silently hiding a shortfall.
--
-- WHY log_sale COULD NOT BE REUSED. Measured against the live schema before
-- this was written:
--   1. `sales` has no client-generated key, so a retried replay would insert a
--      SECOND sale. Idempotency is impossible without a column.
--   2. log_sale computes every line from `v_product.unit_price` - the price
--      TODAY. Replaying through it would re-price completed transactions: raise
--      a price on Tuesday and Monday's queued sales quietly increase.
--   3. log_sale RAISES `Insufficient stock` and aborts. For a replay that is
--      the wrong answer twice over: the goods already left the shop, and the
--      abort discards a real transaction.
--   4. It stamps `sold_by = auth.uid()` and `created_at = now()`, so a replay
--      would attribute a cashier's sale to whoever happened to sync it, dated
--      the wrong day.
--
-- log_sale is NOT modified. It is the function every online sale depends on,
-- and this migration deliberately does not touch it - a replay path with
-- different rules gets a different function.
--
-- ------------------------------------------------------------
-- DECISION 1 — idempotency is a UNIQUE INDEX, not a lookup
-- ------------------------------------------------------------
-- `replay_sale` could have checked "does a sale with this client_id exist?"
-- and inserted if not. Two devices syncing the same queue, or one device
-- retrying while the first request was still in flight, would both pass that
-- check and both insert. The unique index makes the database refuse the
-- second, and the function catches that refusal and reports `duplicate`.
-- The check is a fast path; the index is the guarantee.
--
-- Partial (`where client_id is not null`) so the 381 existing sales, which
-- have no client id, do not collide with each other.
--
-- ------------------------------------------------------------
-- DECISION 2 — an oversell is RECORDED, never raised and never hidden
-- ------------------------------------------------------------
-- If replay would push stock below zero, the sale still lands. The money was
-- taken and the goods are gone; refusing the row would make the takings wrong
-- to protect a stock number that is already wrong.
--
-- Stock floors at 0 - a negative on a shelf count is not a fact about anything
-- - but the floor is NOT silent. Every clamp writes a `stock_discrepancies`
-- row carrying how many units were sold, how many the server actually had, and
-- how many are unaccounted for, and the function RETURNS those rows so the
-- app can tell the cashier at the moment it happens.
--
-- This is the one place the owner's brief overrode the Phase 1 proposal, and
-- correctly: clamping quietly would hide a real inventory problem.
--
-- ------------------------------------------------------------
-- DECISION 3 — prices come from the CLIENT, and that needs saying
-- ------------------------------------------------------------
-- Every other write in this app distrusts client-supplied values. This one
-- must trust the per-line `unit_price`, because it is the only record of what
-- the customer was charged - the server cannot reconstruct a price from a week
-- ago.
--
-- The exposure is bounded deliberately: prices are used only to compute this
-- sale's own total, they are rounded to currency precision, and negatives are
-- refused. A caller who lies about a price falsifies their own shop's takings,
-- which they could already do through the ordinary UI by editing the product.
-- No other store is reachable, because store_id comes from the session.

begin;

do $$
begin
  if to_regclass('public.sales') is null then
    raise exception 'Aborted: public.sales does not exist. Apply schema.sql first.';
  end if;
end $$;

-- ------------------------------------------------------------
-- Step 1. The idempotency key.
-- ------------------------------------------------------------
alter table public.sales add column if not exists client_id uuid;

comment on column public.sales.client_id is
  'Client-generated id for a sale made offline. NULL for sales made online. '
  'The unique index below is what makes replay idempotent - see 0018.';

create unique index if not exists sales_store_client_id_key
  on public.sales (store_id, client_id)
  where client_id is not null;

-- ------------------------------------------------------------
-- Step 2. Where an oversell is recorded.
-- ------------------------------------------------------------
create table if not exists public.stock_discrepancies (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null,
  -- The sale that revealed it. Nullable so a discrepancy outlives a sale that
  -- is later deleted; the numbers stay true either way.
  sale_id uuid references public.sales(id) on delete set null,
  client_id uuid,
  -- Units this replayed sale asked for.
  units_sold integer not null check (units_sold > 0),
  -- Units the server actually held when the replay arrived.
  stock_available integer not null,
  -- Units that cannot be accounted for. Always positive.
  shortfall integer not null check (shortfall > 0),
  detected_at timestamptz not null default now(),
  -- Set when a human has counted the shelf and dealt with it. The app never
  -- sets this automatically: only a person can resolve a physical count.
  resolved_at timestamptz,
  note text,
  constraint stock_discrepancies_product_fkey
    foreign key (store_id, product_id)
    references public.products (store_id, id)
    on delete cascade
);

comment on table public.stock_discrepancies is
  'An offline sale replayed for more units than the server still had. The sale '
  'is kept - the money was taken - and stock floors at 0, but the gap is '
  'recorded here rather than hidden. See 0018 DECISION 2.';

create index if not exists stock_discrepancies_store_unresolved_idx
  on public.stock_discrepancies (store_id, detected_at desc)
  where resolved_at is null;

-- ------------------------------------------------------------
-- Step 3. RLS - the post-0015 shape, exactly as 0016 established.
-- ------------------------------------------------------------
-- Note what is absent: no blanket store-member UPDATE policy. That is the hole
-- 0015 had to drop from products, and repeating it here would recreate it.
-- Staff can SEE a discrepancy their own sale caused; only a manager can
-- resolve one, because resolving is a claim about a physical count.
alter table public.stock_discrepancies enable row level security;

drop policy if exists "store members can view discrepancies" on public.stock_discrepancies;
create policy "store members can view discrepancies" on public.stock_discrepancies
  for select using (store_id = public.current_store_id());

drop policy if exists "managers can update discrepancies" on public.stock_discrepancies;
create policy "managers can update discrepancies" on public.stock_discrepancies
  for update using (store_id = public.current_store_id() and public.can_manage());

drop policy if exists "managers can delete discrepancies" on public.stock_discrepancies;
create policy "managers can delete discrepancies" on public.stock_discrepancies
  for delete using (store_id = public.current_store_id() and public.can_manage());

-- Deliberately NO insert policy. Rows are written only by replay_sale, which
-- is SECURITY DEFINER and therefore bypasses RLS. A staff member at a till
-- must be able to cause one without being able to forge one.

-- ------------------------------------------------------------
-- Step 4. The replay function.
-- ------------------------------------------------------------
-- Returns jsonb rather than a scalar, because the caller has to be able to
-- tell a cashier what happened - D24's rule applied to a whole operation, not
-- just to a row count. Shape:
--   { "status": "created" | "duplicate",
--     "sale_id": uuid,
--     "total": numeric,
--     "discrepancies": [ {product_id, product_name, units_sold, stock_available, shortfall} ] }
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

    insert into sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total)
    values (v_sale_id, v_product.id, v_product.name, v_qty, v_price,
            round(v_price * v_qty, 2));

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

-- Staff work the till, so staff must be able to replay their own queue. This
-- mirrors log_sale, which staff already execute.
grant execute on function public.replay_sale(uuid, jsonb, text, uuid, timestamptz) to authenticated;

commit;

-- ============================================================
-- POST-APPLY CHECKS — run all of them, do not infer
-- ============================================================
--   1. The column and the index exist:
--
--      select column_name from information_schema.columns
--       where table_name='sales' and column_name='client_id';
--      select indexname from pg_indexes where indexname='sales_store_client_id_key';
--
--   2. Existing sales are untouched. MUST return 381 (or your current count)
--      and zero non-null client_ids:
--
--      select count(*) total, count(client_id) with_client_id from public.sales;
--
--   3. IDEMPOTENCY, the check this migration exists for. Call replay_sale
--      twice with the SAME client_id and confirm one sale, one decrement:
--        first  -> {"status":"created",   ...}
--        second -> {"status":"duplicate", ...} with the SAME sale_id
--      and `select count(*) from sales where client_id = '<id>'` = 1.
--
--   4. OVERSELL. Set a product's stock to 1, replay a sale of 3:
--        - the sale row exists, total = 3 x the price sent
--        - products.stock = 0, NOT -2
--        - one stock_discrepancies row: units_sold 3, stock_available 1,
--          shortfall 2
--        - the returned jsonb carries that discrepancy
--
--   5. TOTAL PRECISION. Replay 1 x 12.90 + 1 x 0.55 and confirm
--      sales.total = 13.45 exactly - not 13.450000000000001.
--
--   6. RLS on stock_discrepancies, rows actually affected (D24), with real
--      sessions and the anon key:
--        staff   select -> rows visible | update -> 200 with 0 rows
--        manager select -> rows visible | update -> 200 with 1 row
--        owner   select -> rows visible | update -> 200 with 1 row
--      and INSERT must be refused for every role - only the definer writes.
--
--   7. Cross-store: replay_sale with a p_sold_by from another store MUST
--      raise 'is not a member of this store'.
--
-- ============================================================
-- DOWN
-- ============================================================
--   drop function if exists public.replay_sale(uuid, jsonb, text, uuid, timestamptz);
--   drop table if exists public.stock_discrepancies;
--   drop index if exists public.sales_store_client_id_key;
--   alter table public.sales drop column if exists client_id;
--
-- Lossless for anything that existed before 0018: log_sale is not modified,
-- and no existing sale carries a client_id.
