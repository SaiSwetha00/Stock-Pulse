-- =====================================================================
-- 0004_aggregates.sql — move page rollups out of Node and into Postgres
--
-- WHAT THIS REPLACES:
--   /dashboard, /sales and /suppliers each pulled whole result sets across
--   the wire only to reduce them to a handful of numbers — seven days of
--   sales rows for four totals, thirty days of sale_items for a top-four
--   list, every active shipment for a per-supplier count. Cost grew with
--   the store's history while the rendered output stayed the same size.
--
-- SECURITY MODEL:
--   Every function is SECURITY INVOKER (the default — deliberately NOT
--   `security definer`). RLS therefore still applies to the caller, so a
--   manager or staff member reaches exactly the rows their policies allow.
--   Each body also filters on public.current_store_id() so the store index
--   is used rather than relying on the policy alone to narrow the scan.
--
--   `set search_path = public, pg_temp` pins resolution: without it a
--   caller-controlled search_path could point `sales` at a shadowing table.
--
-- TIMEZONE:
--   Callers pass an explicit IANA zone. The pages previously bucketed days
--   with `new Date(...)` in the Node process, which means UTC on Vercel but
--   the developer's own zone locally — the same store could report
--   different daily figures depending on where the code ran. Making the
--   zone a parameter removes that ambiguity; see lib/reportingTimezone.ts.
--
-- ROLLBACK:
--   drop function if exists public.sales_daily_totals(date, date, text);
--   drop function if exists public.sales_category_breakdown(date, date, text);
--   drop function if exists public.sales_top_products(date, date, text, integer);
--   drop function if exists public.supplier_active_order_counts();
--   drop function if exists public.shipment_pallets_on(date);
--   drop function if exists public.low_stock_products();
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Step 0. Abort unless the helpers 0002 installed are present. Without
-- current_store_id() every function below would silently aggregate
-- nothing, which reads as "this store has no sales" rather than as an
-- error.
-- ---------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public.current_store_id()') is null then
    raise exception '0004: public.current_store_id() is missing — apply 0002 first';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Daily takings, zero-filled.
--
-- The generate_series LEFT JOIN is what makes a day with no sales come
-- back as 0 instead of missing. The callers render a fixed-width bar
-- chart, so a gap would shift every later day into the wrong column.
--
-- The two created_at bounds look redundant next to the per-day equality
-- but are not: the equality wraps created_at in a function call and so
-- cannot use sales_created_at_idx, while the bounds can, which keeps the
-- scan to the requested window instead of the store's whole history.
-- ---------------------------------------------------------------------
create or replace function public.sales_daily_totals(
  p_from date,
  p_to   date,
  p_tz   text
)
returns table (day date, total numeric, sale_count bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    d::date                        as day,
    coalesce(sum(s.total), 0)      as total,
    count(s.id)                    as sale_count
  from generate_series(p_from, p_to, interval '1 day') as d
  left join public.sales s
    on  s.store_id    = public.current_store_id()
    and s.created_at >= (p_from::timestamp at time zone p_tz)
    and s.created_at <  ((p_to + 1)::timestamp at time zone p_tz)
    and (s.created_at at time zone p_tz)::date = d::date
  group by d
  order by d;
$$;

-- ---------------------------------------------------------------------
-- Revenue split by product category.
--
-- Joins sale_items to products on product_id. The pages this replaces
-- matched on product_name against a name->category map built in Node,
-- which mis-filed every line item whose product had since been renamed
-- (falling through to a hardcoded 'packaged') and merged two distinct
-- products that happened to share a name. product_id is `not null
-- references products(id)`, so the join is total and neither fault
-- survives.
--
-- Categories with no sales in the window are omitted rather than
-- returned as zero: the callers render a share-of-total breakdown, and a
-- 0% slice is noise.
-- ---------------------------------------------------------------------
create or replace function public.sales_category_breakdown(
  p_from date,
  p_to   date,
  p_tz   text
)
returns table (category text, total numeric)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    p.category                  as category,
    sum(si.line_total)          as total
  from public.sale_items si
  join public.sales    s on s.id = si.sale_id
  join public.products p on p.id = si.product_id
  where s.store_id    = public.current_store_id()
    and s.created_at >= (p_from::timestamp at time zone p_tz)
    and s.created_at <  ((p_to + 1)::timestamp at time zone p_tz)
  group by p.category
  order by sum(si.line_total) desc;
$$;

-- ---------------------------------------------------------------------
-- Best sellers by unit volume.
--
-- Grouped on the sale_items.product_name snapshot, not on the live
-- products row, because the figure describes what was sold at the time.
-- Renaming a product afterwards should not silently rewrite last
-- month's leaderboard.
-- ---------------------------------------------------------------------
create or replace function public.sales_top_products(
  p_from  date,
  p_to    date,
  p_tz    text,
  p_limit integer default 4
)
returns table (product_name text, units bigint, revenue numeric)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    si.product_name          as product_name,
    sum(si.quantity)::bigint as units,
    sum(si.line_total)       as revenue
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  where s.store_id    = public.current_store_id()
    and s.created_at >= (p_from::timestamp at time zone p_tz)
    and s.created_at <  ((p_to + 1)::timestamp at time zone p_tz)
  group by si.product_name
  order by sum(si.quantity) desc, si.product_name asc
  limit greatest(p_limit, 0);
$$;

-- ---------------------------------------------------------------------
-- Open shipments per supplier, for the "active orders" column.
--
-- 'dock' means delivered, so it is excluded — matching the .neq('status',
-- 'dock') filter the suppliers page used. Suppliers with nothing open are
-- absent; the caller defaults a missing supplier to 0.
-- ---------------------------------------------------------------------
create or replace function public.supplier_active_order_counts()
returns table (supplier_id uuid, active_orders bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select sh.supplier_id, count(*)::bigint
  from public.shipments sh
  where sh.store_id = public.current_store_id()
    and sh.status <> 'dock'
    and sh.supplier_id is not null
  group by sh.supplier_id;
$$;

-- ---------------------------------------------------------------------
-- Pallets expected and already received for one delivery date.
--
-- Always returns exactly one row: the coalesce turns "no shipments due"
-- into 0/0 rather than an empty result the caller would have to special-
-- case. eta is a plain `date` column, so no timezone conversion applies
-- and the caller passes the store's local calendar date.
-- ---------------------------------------------------------------------
create or replace function public.shipment_pallets_on(p_date date)
returns table (total_pallets bigint, received_pallets bigint)
language sql
stable
set search_path = public, pg_temp
as $$
  select
    coalesce(sum(sh.pallets), 0)::bigint,
    coalesce(sum(sh.pallets) filter (where sh.status = 'dock'), 0)::bigint
  from public.shipments sh
  where sh.store_id = public.current_store_id()
    and sh.eta = p_date;
$$;

-- ---------------------------------------------------------------------
-- Products at or below their own reorder threshold.
--
-- This has to be a function: the comparison is column-to-column
-- (stock <= low_stock_threshold), which PostgREST's query syntax cannot
-- express, so /dashboard fetched every product and filtered in Node.
-- Ordered scarcest-first, the order the dashboard renders.
-- ---------------------------------------------------------------------
create or replace function public.low_stock_products()
returns setof public.products
language sql
stable
set search_path = public, pg_temp
as $$
  select *
  from public.products p
  where p.store_id = public.current_store_id()
    and p.stock <= p.low_stock_threshold
  order by p.stock asc, p.name asc;
$$;

-- ---------------------------------------------------------------------
-- Grants.
--
-- `authenticated` only. anon has no store context — current_store_id()
-- would return null and every function would return empty — so exposing
-- them to it would only add confusing surface.
-- ---------------------------------------------------------------------
grant execute on function public.sales_daily_totals(date, date, text)          to authenticated;
grant execute on function public.sales_category_breakdown(date, date, text)    to authenticated;
grant execute on function public.sales_top_products(date, date, text, integer) to authenticated;
grant execute on function public.supplier_active_order_counts()                to authenticated;
grant execute on function public.shipment_pallets_on(date)                     to authenticated;
grant execute on function public.low_stock_products()                          to authenticated;

commit;

-- ---------------------------------------------------------------------
-- Verify (run after committing, signed in as a store user):
--
--   select * from public.sales_daily_totals(
--     (current_date - 6), current_date, 'UTC');
--   -- expect exactly 7 rows, oldest first, zeroes where there were no sales
--
--   select * from public.sales_category_breakdown(
--     (current_date - 29), current_date, 'UTC');
--
--   select * from public.sales_top_products(
--     (current_date - 29), current_date, 'UTC', 4);
--
--   select * from public.supplier_active_order_counts();
--   select * from public.shipment_pallets_on(current_date);
--   select count(*) from public.low_stock_products();
--
-- Cross-check one against the old path — this must match the `total`
-- for today's row above:
--
--   select coalesce(sum(total), 0) from public.sales
--   where store_id = public.current_store_id()
--     and (created_at at time zone 'UTC')::date = current_date;
-- ---------------------------------------------------------------------
