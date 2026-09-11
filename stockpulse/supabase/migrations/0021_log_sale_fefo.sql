-- 0021_log_sale_fefo.sql — online sales consume batches, earliest expiry first
--
-- WHY
--   `products.stock` has been a trigger-maintained mirror of
--   sum(product_batches.quantity) since 0016, and 0016's own header says
--   nothing in the app may assign it. `log_sale` never got that message: it
--   decremented `products.stock` directly and never touched a lot. So every
--   online sale broke the mirror, and the two numbers diverged silently.
--
--   Measured on the demo store before this migration: 3 of 153 products had
--   drifted. Black salt read stock 0 against a lot still holding 10 - ten
--   units sold with the lot never debited. Re-check it the same way rather
--   than trusting this comment:
--
--     select p.name, p.stock, coalesce(sum(b.quantity), 0) as batch_sum
--     from products p
--     left join product_batches b
--       on b.product_id = p.id and b.store_id = p.store_id
--     group by p.id, p.name, p.stock
--     having p.stock <> coalesce(sum(b.quantity), 0);
--
--   That should return zero rows. It is the regression test for this
--   migration and it is worth keeping.
--
-- FEFO, AND WHY NULLS SORT LAST
--   Chosen by the owner on 2026-09-08. First Expired, First Out: the lot
--   closest to being written off is sold first, which is the only ordering
--   that agrees with what the expiry warnings already tell the shopkeeper to
--   worry about. FIFO by received date is the alternative and would happily
--   sell a fresh lot while a dated one expired behind it.
--
--   `expiry_date is null` means the lot never expires - most of what a kirana
--   shop sells does not perish. A lot that never expires is never the first to
--   expire, so it sorts LAST. `nulls last` is written explicitly even though
--   ASC would do it anyway, because a reader should not need to know that to
--   be sure which way it goes.
--
--   `received_on` breaks ties (FIFO within one expiry date) and `id` breaks
--   what is left, so the order is total and two runs cannot disagree.
--
-- THE MANUAL products.stock UPDATE IS GONE, AND THAT IS THE POINT
--   The old body ended each line with:
--
--     update products set stock = stock - qty ...
--
--   Keeping that alongside a lot debit would decrement TWICE: the lot update
--   fires 0016's AFTER trigger, which recomputes products.stock from the batch
--   sum, and the manual statement would then subtract from the already-correct
--   figure. Selling 1 of 10 would leave 8. The trigger is now the only writer
--   of products.stock, which is exactly what 0016 designed for.
--
-- WHAT DELIBERATELY DID NOT CHANGE
--   - The signature, the return value, and `security definer`. Staff work the
--     till and sell through this function; 0015 dropped the blanket staff
--     UPDATE policy precisely because this definer function is the sale path.
--     Callers are untouched.
--   - `raise exception 'Insufficient stock for %'` - same message, so anything
--     matching on it still matches.
--   - Zero-quantity lots are updated to 0, never deleted. 0016 keeps a sold-out
--     lot for its history.
--   - `replay_sale` (0018) is NOT touched here. It still adjusts products.stock
--     directly and does not debit lots, so the offline replay path can still
--     drift. That needs its own migration and it needs care: its floor-at-zero
--     and stock_discrepancies behaviour has to decide which lot absorbs a
--     shortfall. Doing that blind here would be worse than leaving it visible.
--
-- CONCURRENCY
--   The lot cursor takes `for update`, so two tills selling the same product
--   at once queue on the lot rows instead of both reading the same quantity and
--   each believing it may spend it. Without it FEFO would be right about order
--   and wrong about arithmetic under load.

-- ON THE NAMED DOLLAR-QUOTE TAGS BELOW, which are not decoration.
--
-- The first attempt at this migration used the bare anonymous delimiter for
-- BOTH the guard block and the function body - four identical delimiters in
-- one script. It reported no error and changed nothing: pg_get_functiondef
-- still returned the old body afterwards. A client that splits a script into
-- statements has to pair dollar quotes to know where a body ends, and
-- identical tags make that ambiguous, so a fragment runs instead of the whole
-- script.
--
-- Named tags remove the ambiguity. Note also that this header deliberately
-- contains NO literal dollar-quote sequences: an odd one left in a comment
-- would reintroduce exactly the imbalance the tags are here to prevent.
--
-- Verify with the pair below rather than trusting that the editor said
-- "success" - the first attempt said that too:
--
--   select pg_get_functiondef('public.log_sale(jsonb, text)'::regprocedure)
--            like '%product_batches%' as debits_lots,
--          pg_get_functiondef('public.log_sale(jsonb, text)'::regprocedure)
--            like '%update products set stock%' as still_has_old_manual_update;
--
-- Want debits_lots = true, still_has_old_manual_update = false.

begin;

do $guard$
begin
  if to_regclass('public.product_batches') is null then
    raise exception
      'Aborted: public.product_batches does not exist. Apply 0016_product_batches.sql first.';
  end if;
  if to_regprocedure('public.log_sale(jsonb, text)') is null then
    raise exception
      'Aborted: public.log_sale(jsonb, text) does not exist. Apply schema.sql first.';
  end if;
  if to_regprocedure('public.current_store_id()') is null then
    raise exception 'Aborted: public.current_store_id() is missing. Apply the base schema first.';
  end if;
end $guard$;

create or replace function public.log_sale(
  p_items jsonb,
  p_payment_method text
) returns uuid as $fn$
declare
  v_store_id uuid := public.current_store_id();
  v_sale_id uuid;
  v_total numeric(10,2) := 0;
  v_item jsonb;
  v_product products%rowtype;
  v_qty int;
  v_available int;
  v_remaining int;
  v_take int;
  v_lot record;
begin
  if v_store_id is null then
    raise exception 'No store associated with current user';
  end if;

  -- Pass 1 - validate and total before writing anything, so an unsellable
  -- line rejects the whole basket rather than leaving half a sale on the books.
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from products
      where id = (v_item->>'product_id')::uuid and store_id = v_store_id;

    if v_product.id is null then
      raise exception 'Product not found: %', v_item->>'product_id';
    end if;

    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity for %', v_product.name;
    end if;

    -- Availability comes from the LOTS now, not from products.stock. The two
    -- agree - the trigger keeps them agreeing - but the lots are what this
    -- function is about to spend, so the lots are what it should ask.
    select coalesce(sum(quantity), 0) into v_available
      from product_batches
      where product_id = v_product.id and store_id = v_store_id and quantity > 0;

    if v_available < v_qty then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_total := v_total + (v_product.unit_price * v_qty);
  end loop;

  insert into sales (store_id, sold_by, total, payment_method)
  values (v_store_id, auth.uid(), v_total, p_payment_method)
  returning id into v_sale_id;

  -- Pass 2 - record the lines and spend the lots.
  for v_item in select * from jsonb_array_elements(p_items) loop
    select * into v_product from products
      where id = (v_item->>'product_id')::uuid and store_id = v_store_id;

    v_qty := (v_item->>'quantity')::int;

    insert into sale_items (sale_id, product_id, product_name, quantity, unit_price, line_total)
    values (
      v_sale_id,
      v_product.id,
      v_product.name,
      v_qty,
      v_product.unit_price,
      v_product.unit_price * v_qty
    );

    -- FEFO. One line may span several lots: take what the earliest-expiring
    -- lot holds, then move to the next.
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

    -- Pass 1 proved there was enough, but another till may have spent a lot
    -- between the two passes. Raising here rolls the whole sale back rather
    -- than recording a sale the shelves cannot support.
    if v_remaining > 0 then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;
  end loop;

  return v_sale_id;
end;
$fn$ language plpgsql security definer;

comment on function public.log_sale(jsonb, text) is
  'Records an online sale and consumes product_batches FEFO (earliest expiry '
  'first, undated lots last). Does NOT write products.stock - 0016''s trigger '
  'derives that from the batch sum.';

commit;
