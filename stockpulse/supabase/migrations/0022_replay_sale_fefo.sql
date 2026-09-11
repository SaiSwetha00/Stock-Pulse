-- 0022_replay_sale_fefo.sql — offline replay consumes batches, FEFO
--
-- WHY
--   0021 taught `log_sale` to debit lots. `replay_sale` was left alone there,
--   deliberately and with a note, because its floor-at-zero and
--   stock_discrepancies behaviour needed a decision first: when a replayed sale
--   is short, WHICH lot absorbs the shortfall? This migration answers that.
--
--   Until now `replay_sale` did:
--
--     v_taken := least(v_qty, greatest(v_product.stock, 0));
--     update products set stock = greatest(stock - v_qty, 0) ...
--
--   which never touched a lot. That leaves two defects, the second worse than
--   the first:
--
--     1. Any synced offline sale re-opened the products.stock / batch-sum drift
--        that 0016 declared impossible and 0021 closed for online sales.
--     2. The decrement was liable to be SILENTLY REVERTED. products.stock is a
--        trigger-maintained mirror of sum(product_batches.quantity); now that
--        `log_sale` touches lots on every online sale, the next such sale of
--        the same product fires that trigger, which recomputes stock from the
--        batch sum and erases the replay's decrement - restoring stock the shop
--        had already sold. Before 0021 this needed a manual lot edit to happen;
--        afterwards an ordinary sale does it.
--
-- THE SHORTFALL DECISION
--   Drain FEFO until the lots are empty, then record the remainder. Take from
--   the earliest-expiring lot with stock, move to the next, stop when the line
--   is satisfied or nothing is left. Whatever could not be taken is the
--   shortfall.
--
--   This is the SAME policy 0018 argued for, moved down one level - from "floor
--   products.stock at zero" to "floor every lot at zero". The money was taken
--   and the sale stands; what the software must not do is invent stock to cover
--   it, or hide the gap. `least(v_lot.quantity, v_remaining)` is what makes a
--   lot unable to go negative, so no CHECK constraint is relied on to catch it.
--
--   No lot is singled out to "absorb" the difference, because there is no
--   honest way to choose one: the units left a shelf, not a record. Emptying in
--   FEFO order and reporting the remainder is the only version of this that
--   does not fabricate an allocation.
--
-- stock_available NOW MEANS THE LOT SUM
--   The discrepancy row previously recorded `v_product.stock` as
--   `stock_available`. It now records the sum of the product's non-empty lots,
--   read BEFORE any debit. Post-0021 those two agree, so this is less a change
--   of value than a change of source - and the lots are what this function
--   actually spent, so they are what the record should describe.
--
-- WHAT DELIBERATELY DID NOT CHANGE
--   - The signature, `returns jsonb`, `security definer`, `set search_path`,
--     and the grant to `authenticated`. `lib/offline/sync.ts` is untouched.
--   - Idempotency: the duplicate fast path, and the `unique_violation` handler
--     that reports a concurrent replay as a duplicate rather than an error. The
--     unique index on (store_id, client_id) is still the real guarantee.
--   - `sold_by` must be a member of this store. A definer function taking a
--     user id must not let one shop attribute a sale to another's staff.
--   - The total is still recomputed in SQL from the snapshotted per-line
--     prices, never taken from the client's stored figure.
--   - `server_unit_price` (0019) is still recorded and still never enforced.
--   - The returned JSON shape: {status, sale_id, total, discrepancies}, each
--     discrepancy carrying product_id, product_name, units_sold,
--     stock_available, shortfall. `sync.ts` reads these keys.
--
-- A PRODUCT WITH NO LOTS
--   Debits nothing, so the trigger never fires and products.stock is left
--   alone - which is correct, because by the 0016 mirror a product with no lots
--   already reads 0. If one ever reads non-zero with no lots, that is
--   pre-existing drift and not this function's to repair; the invariant query
--   in 0021's header is what surfaces it.
--
-- NO begin/commit AND NO GUARD BLOCK HERE, ON PURPOSE
--   0021's first two attempts reported success and changed nothing: a script
--   carrying a do-block and a function body with identical anonymous dollar
--   delimiters was mis-split by the client, and a fragment ran. What finally
--   worked was the bare function statement on its own. So this file is kept to
--   the two statements it needs, with a named tag on the body, and this header
--   contains no literal dollar-quote sequence to unbalance.
--
--   Verify afterwards rather than trusting the editor's success message:
--
--     select pg_get_functiondef('public.replay_sale(uuid, jsonb, text, uuid, timestamptz)'::regprocedure)
--              like '%product_batches%' as debits_lots,
--            pg_get_functiondef('public.replay_sale(uuid, jsonb, text, uuid, timestamptz)'::regprocedure)
--              like '%update products set stock%' as still_has_old_manual_update;
--
--   Want debits_lots = true, still_has_old_manual_update = false.

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
) returns jsonb as $fn$
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
  v_available integer;
  v_remaining integer;
  v_take integer;
  v_lot record;
begin
  if v_store_id is null then
    raise exception 'No store associated with current user';
  end if;
  if p_client_id is null then
    raise exception 'replay_sale requires a client_id';
  end if;

  -- Fast path. The unique index is the actual guarantee; this only avoids
  -- doing the work twice in the common case.
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

    -- What the lots hold BEFORE this line spends any of them. Recorded on the
    -- discrepancy row, so the gap is described against real availability.
    select coalesce(sum(quantity), 0) into v_available
      from product_batches
      where product_id = v_product.id and store_id = v_store_id and quantity > 0;

    -- The reconciliation, at lot level: take what is there in FEFO order,
    -- never below zero, and record the gap rather than swallowing it.
    v_remaining := v_qty;

    for v_lot in
      select id, quantity
        from product_batches
        where product_id = v_product.id
          and store_id = v_store_id
          and quantity > 0
        order by expiry_date asc nulls last, received_on asc, id asc
        for update
    loop
      exit when v_remaining <= 0;

      v_take := least(v_lot.quantity, v_remaining);

      update product_batches
        set quantity = quantity - v_take,
            updated_at = now()
        where id = v_lot.id;

      v_remaining := v_remaining - v_take;
    end loop;

    -- products.stock is NOT written here. The 0016 trigger recomputed it from
    -- the batch sum on each update above; assigning it as well would subtract
    -- twice, which is the bug 0021's header records in full.

    if v_remaining > 0 then
      insert into stock_discrepancies
        (store_id, product_id, sale_id, client_id, units_sold, stock_available, shortfall)
      values (v_store_id, v_product.id, v_sale_id, p_client_id,
              v_qty, v_available, v_remaining);

      v_discrepancies := v_discrepancies || jsonb_build_object(
        'product_id', v_product.id,
        'product_name', v_product.name,
        'units_sold', v_qty,
        'stock_available', v_available,
        'shortfall', v_remaining
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
$fn$ language plpgsql security definer set search_path = public;

grant execute on function public.replay_sale(uuid, jsonb, text, uuid, timestamptz) to authenticated;
