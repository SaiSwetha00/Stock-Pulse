-- =====================================================================
-- 0023 — Link a sale to a customer, and update their spend, visits and
--        loyalty tier from it.
--
-- STATUS: NOT APPLIED. Written 2026-10-12, awaiting the owner's approval.
-- The app does not call anything here yet; wiring the till to it is the
-- follow-up AFTER this is applied and verified (see the end of this file).
--
-- WHAT IT CHANGES — additive only:
--   1. sales.customer_id: a NEW nullable column. Every existing sale keeps
--      customer_id = null, which means "not attributed" - no data rewritten.
--   2. loyalty_tier_for(spent): the tier a total spend earns.
--   3. record_customer_sale(sale, customer): attributes ONE existing sale to
--      ONE customer and updates that customer's total_spent, visits,
--      last_visit_at and (upward only) loyalty_tier.
--
-- WHAT IT DOES NOT TOUCH: log_sale, replay_sale, stock, lots, FEFO, any
-- existing row, any existing policy. A sale is still logged exactly as today;
-- attribution is a separate, second call made after the sale exists.
--
-- WHY A SECOND FUNCTION AND NOT A NEW log_sale PARAMETER: every online sale
-- depends on log_sale and every offline sale on replay_sale. Changing either
-- signature would break the deployed app until it was redeployed, and a
-- failed attribution must never be able to fail the sale itself.
--
-- TIER THRESHOLDS (BUSINESS RULE - CONFIRM BEFORE APPLYING):
--   bronze < ₹300 <= silver < ₹600 <= gold < ₹1000 <= platinum
-- Chosen to agree with every tier already stored in the demo store
-- (e.g. ₹341.80 silver, ₹601.90 gold, ₹1102.75 platinum). Change the three
-- numbers in loyalty_tier_for below if the shop wants different ones.
-- A tier is only ever RAISED automatically, never lowered: an owner who set
-- a customer to gold by hand keeps gold.
--
-- WHO MAY CALL IT: any member of the store (staff work the till), but staff
-- may attribute only sales they made themselves; owners and managers any
-- sale in their store. Idempotent: attributing an already-attributed sale
-- changes nothing and reports why.
--
-- HOW TO APPLY: Supabase Dashboard -> SQL Editor -> New query -> paste this
-- whole file -> Run. It runs in one transaction; an error rolls all of it
-- back. Then run the VERIFY block at the end.
-- =====================================================================

begin;

alter table public.sales
  add column if not exists customer_id uuid
  references public.customers(id) on delete set null;

create index if not exists sales_customer_id_idx
  on public.sales(customer_id)
  where customer_id is not null;

create or replace function public.loyalty_tier_for(p_spent numeric)
returns text
language sql
immutable
as $$
  select case
    when p_spent >= 1000 then 'platinum'
    when p_spent >= 600  then 'gold'
    when p_spent >= 300  then 'silver'
    else 'bronze'
  end
$$;

create or replace function public.record_customer_sale(
  p_sale_id uuid,
  p_customer_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_store_id uuid := public.current_store_id();
  v_sale public.sales%rowtype;
  v_customer public.customers%rowtype;
  v_order constant text[] := array['bronze', 'silver', 'gold', 'platinum'];
  v_earned text;
begin
  if v_store_id is null then
    raise exception 'Not signed in to a store' using errcode = '42501';
  end if;

  -- Both rows are read in the CALLER's store only, and locked so two tills
  -- attributing the same sale at once cannot both count it.
  select * into v_sale
    from public.sales
   where id = p_sale_id and store_id = v_store_id
   for update;
  if not found then
    raise exception 'Sale not found in this store' using errcode = 'P0002';
  end if;

  if not public.can_manage() and v_sale.sold_by is distinct from auth.uid() then
    raise exception 'Staff can attribute only their own sales' using errcode = '42501';
  end if;

  if v_sale.customer_id is not null then
    return jsonb_build_object(
      'status', case when v_sale.customer_id = p_customer_id then 'duplicate' else 'already_attributed' end
    );
  end if;

  select * into v_customer
    from public.customers
   where id = p_customer_id and store_id = v_store_id
   for update;
  if not found then
    raise exception 'Customer not found in this store' using errcode = 'P0002';
  end if;

  update public.sales set customer_id = p_customer_id where id = p_sale_id;

  v_earned := public.loyalty_tier_for(v_customer.total_spent + v_sale.total);

  update public.customers
     set total_spent   = total_spent + v_sale.total,
         visits        = visits + 1,
         last_visit_at = greatest(coalesce(last_visit_at, v_sale.created_at), v_sale.created_at),
         loyalty_tier  = case
                           when array_position(v_order, v_earned) > array_position(v_order, loyalty_tier)
                           then v_earned
                           else loyalty_tier
                         end
   where id = p_customer_id
   returning * into v_customer;

  return jsonb_build_object(
    'status', 'recorded',
    'total_spent', v_customer.total_spent,
    'visits', v_customer.visits,
    'loyalty_tier', v_customer.loyalty_tier
  );
end
$fn$;

revoke all on function public.record_customer_sale(uuid, uuid) from public, anon;
grant execute on function public.record_customer_sale(uuid, uuid) to authenticated;

commit;

-- =====================================================================
-- VERIFY (run after applying; read-only):
--
--   select column_name, is_nullable from information_schema.columns
--    where table_schema = 'public' and table_name = 'sales' and column_name = 'customer_id';
--   -- expect: customer_id | YES
--
--   select public.loyalty_tier_for(299.99), public.loyalty_tier_for(300),
--          public.loyalty_tier_for(600), public.loyalty_tier_for(1000);
--   -- expect: bronze | silver | gold | platinum
--
--   select count(*) from public.sales where customer_id is not null;
--   -- expect: 0 (no existing sale was rewritten)
--
-- ROLLBACK (only if needed; drops the new objects, touches nothing else):
--
--   begin;
--   drop function if exists public.record_customer_sale(uuid, uuid);
--   drop function if exists public.loyalty_tier_for(numeric);
--   drop index if exists public.sales_customer_id_idx;
--   alter table public.sales drop column if exists customer_id;
--   commit;
--
-- FOLLOW-UP IN THE APP (after this is applied and verified): an optional
-- customer picker in Log a Sale that, once log_sale returns the new sale id,
-- calls supabase.rpc('record_customer_sale', { p_sale_id, p_customer_id }).
-- The offline till would carry the chosen customer in the queued record and
-- call the same function after replay_sale succeeds.
-- =====================================================================
