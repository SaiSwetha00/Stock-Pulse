-- ============================================================
-- 0016 — product_batches, and products.stock becomes derived
-- ============================================================
-- PHASE 1 OF EXPIRY TRACKING. Schema only.
--
-- IN SCOPE
--   1. products gains `unique (store_id, id)` so batches can carry a COMPOSITE
--      foreign key (see DECISION 1).
--   2. A product_batches table: quantity + expiry per batch.
--   3. products.stock becomes a TRIGGER-MAINTAINED MIRROR of
--      sum(product_batches.quantity).
--   4. Backfill: one batch per product that currently holds stock, carrying
--      that stock and that product's existing expiry_date.
--
-- DELIBERATELY NOT IN SCOPE — do not add these here
--   - No UI change. ProductModal, InventoryClient and the CSV import are
--     untouched by this migration.
--   - No change to log_sale. FEFO deduction is a later phase, and log_sale is
--     the one function every sale depends on — it is not being rewritten in
--     the same change that introduces the table it would read.
--   - No shipment_items, and no column reserved for one. See D55.
--
-- ------------------------------------------------------------
-- WHAT THIS DOES NOT FIX, AND YOU SHOULD KNOW BEFORE APPLYING
-- ------------------------------------------------------------
-- saveProduct still writes products.stock directly (an absolute overwrite from
-- the Quantity field), and importProducts does the same per CSV row. After
-- this migration those writes make products.stock disagree with
-- sum(product_batches.quantity) until the next batch change re-syncs it.
--
-- That is a real, accepted consequence of phasing, not an oversight. It is
-- survivable now because NOTHING reads the batches yet — the mirror is being
-- established and proved before anything depends on it. Phase 2 closes it by
-- changing what the Quantity field means. Do not ship a batches UI on top of
-- 0016 without closing it first.
--
-- ------------------------------------------------------------
-- DECISION 1 — the FK is composite, (store_id, product_id)
-- ------------------------------------------------------------
-- D35 established this shape for products_category_fkey: carrying store_id
-- into the key makes it structurally impossible for one shop's row to
-- reference another shop's, rather than relying on every call site remembering
-- .eq('store_id'). A batch pointing at another store's product would be a
-- cross-tenant stock leak RLS would not catch, because the batch's own
-- store_id would look perfectly correct.
--
-- It needs `unique (store_id, id)` on products to reference. That is redundant
-- with the primary key by definition — id is already unique — so it costs an
-- index and changes no behaviour.
--
-- ------------------------------------------------------------
-- DECISION 2 — derived by trigger, never reconciled
-- ------------------------------------------------------------
-- products.stock stays a column rather than becoming a join, so InventoryClient
-- (5 sites), DashboardView, the CSV export, useTable sorting and the low-stock
-- notification in saveProduct keep reading `p.stock` unchanged. Removing the
-- column would have made this migration a rewrite of half the app.
--
-- Maintained by trigger, NOT by a periodic reconcile. This project has been
-- bitten twice by two sources of truth that drift — `stores.theme` vs
-- localStorage, and D5's notify_* columns — and a nightly reconcile means the
-- number on screen is knowably wrong between runs. A generated column cannot
-- do it: Postgres generated columns cannot reference another table.
--
-- ------------------------------------------------------------
-- DECISION 3 — the trigger is SECURITY DEFINER, and that is load-bearing
-- ------------------------------------------------------------
-- A trigger function runs as the invoking user unless it is definer, so its
-- UPDATE of products would be subject to that user's RLS. Since 0015 dropped
-- the blanket staff policy, a non-definer trigger would silently fail to
-- update stock for any caller who cannot write products — an RLS refusal is a
-- successful statement affecting zero rows, not an error (D24), so the mirror
-- would go quietly wrong rather than loudly.
--
-- Definer is the same mechanism log_sale already uses to decrement stock.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- Step 0. Refuse to run against the wrong database.
-- ------------------------------------------------------------
do $$
begin
  if to_regclass('public.products') is null then
    raise exception 'Aborted: public.products does not exist. Apply schema.sql first.';
  end if;
  if to_regclass('public.product_batches') is not null then
    raise notice 'public.product_batches already exists - statements below are guarded.';
  end if;
end $$;

-- ------------------------------------------------------------
-- Step 1. The composite key target on products.
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass and conname = 'products_store_id_id_key'
  ) then
    alter table public.products add constraint products_store_id_id_key unique (store_id, id);
  end if;
end $$;

-- ------------------------------------------------------------
-- Step 2. The table.
-- ------------------------------------------------------------
create table if not exists public.product_batches (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null,
  -- Zero is legitimate: a batch that has sold out but is kept for its expiry
  -- history until someone clears it. Negative never is.
  quantity integer not null default 0 check (quantity >= 0),
  -- Nullable on purpose. Not every line a grocer stocks perishes, and forcing
  -- a date would make people invent one - worse than no date, because an
  -- invented date warns wrongly.
  expiry_date date,
  received_on date not null default current_date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_batches_product_fkey
    foreign key (store_id, product_id)
    references public.products (store_id, id)
    on delete cascade
);

comment on table public.product_batches is
  'One delivery/lot of a product: how many, and when it expires. products.stock '
  'is a trigger-maintained mirror of sum(quantity) here. Created ad hoc at the '
  'product, not from shipment line items - see D55.';

create index if not exists product_batches_store_product_idx
  on public.product_batches (store_id, product_id);

-- The perishables query is "this store, expiring before X", so the index leads
-- with store_id and excludes rows that can never match.
create index if not exists product_batches_store_expiry_idx
  on public.product_batches (store_id, expiry_date)
  where expiry_date is not null;

-- ------------------------------------------------------------
-- Step 3. Backfill BEFORE the trigger exists.
-- ------------------------------------------------------------
-- Order matters only for clarity: with the trigger in place each insert would
-- recompute stock to the number it already holds. Doing it first keeps the
-- backfill a pure insert with nothing to reason about.
--
-- Only products that currently hold stock get a batch. A product with zero
-- stock gets ZERO batches, and the trigger's coalesce(...,0) gives it stock 0 -
-- so "no batches" is a valid state meaning "none on hand", and the backfill
-- does not litter the table with meaningless zero rows.
--
-- expiry_date is COPIED, not moved. products.expiry_date stays exactly as it
-- is, because ProductModal still reads and writes it and this phase changes no
-- UI. Phase 2 decides which one wins.
insert into public.product_batches (store_id, product_id, quantity, expiry_date, note)
select p.store_id, p.id, p.stock, p.expiry_date, 'Backfilled from products.stock by migration 0016'
from public.products p
where p.stock > 0
  and not exists (
    select 1 from public.product_batches b where b.product_id = p.id
  );

-- ------------------------------------------------------------
-- Step 4. The mirror.
-- ------------------------------------------------------------
create or replace function public.sync_product_stock_from_batches()
returns trigger as $$
declare
  v_product_id uuid;
  v_store_id uuid;
begin
  -- An UPDATE can move a batch between products, so BOTH sides are recomputed.
  -- Handling only NEW would leave the old product's stock overstated forever,
  -- and nothing would ever notice.
  if (tg_op = 'DELETE' or tg_op = 'UPDATE') then
    v_product_id := old.product_id;
    v_store_id := old.store_id;
    update public.products p
      set stock = coalesce((
            select sum(b.quantity) from public.product_batches b
            where b.product_id = v_product_id
          ), 0),
          updated_at = now()
      where p.id = v_product_id and p.store_id = v_store_id;
  end if;

  if (tg_op = 'INSERT' or tg_op = 'UPDATE') then
    if tg_op = 'INSERT'
       or new.product_id is distinct from old.product_id
       or new.quantity is distinct from old.quantity then
      v_product_id := new.product_id;
      v_store_id := new.store_id;
      update public.products p
        set stock = coalesce((
              select sum(b.quantity) from public.product_batches b
              where b.product_id = v_product_id
            ), 0),
            updated_at = now()
        where p.id = v_product_id and p.store_id = v_store_id;
    end if;
  end if;

  return null; -- AFTER trigger; the return value is ignored.
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists product_batches_sync_stock on public.product_batches;
create trigger product_batches_sync_stock
  after insert or update or delete on public.product_batches
  for each row execute function public.sync_product_stock_from_batches();

-- ------------------------------------------------------------
-- Step 5. RLS - mirrors products, WITHOUT the hole 0015 removed.
-- ------------------------------------------------------------
-- Note what is absent: there is no blanket store-member UPDATE policy. That is
-- exactly the shape 0015 had to drop from products, and repeating it here
-- would recreate the same hole on a new table on day one.
--
-- Staff therefore cannot write batches at all yet. Correct for this phase,
-- because log_sale does not touch batches yet either. When FEFO deduction
-- lands, staff must decrement through a SECURITY DEFINER function - never
-- through a widened policy.
alter table public.product_batches enable row level security;

drop policy if exists "store members can view batches" on public.product_batches;
create policy "store members can view batches" on public.product_batches
  for select using (store_id = public.current_store_id());

drop policy if exists "managers can insert batches" on public.product_batches;
create policy "managers can insert batches" on public.product_batches
  for insert with check (store_id = public.current_store_id() and public.can_manage());

drop policy if exists "managers can update batches" on public.product_batches;
create policy "managers can update batches" on public.product_batches
  for update using (store_id = public.current_store_id() and public.can_manage());

drop policy if exists "managers can delete batches" on public.product_batches;
create policy "managers can delete batches" on public.product_batches
  for delete using (store_id = public.current_store_id() and public.can_manage());

commit;

-- ============================================================
-- POST-APPLY CHECKS - run all of them, do not infer
-- ============================================================
--   1. The mirror agrees with reality everywhere. MUST return zero rows:
--
--      select p.id, p.name, p.stock, coalesce(sum(b.quantity), 0) as batch_sum
--      from public.products p
--      left join public.product_batches b on b.product_id = p.id
--      group by p.id, p.name, p.stock
--      having p.stock <> coalesce(sum(b.quantity), 0);
--
--   2. The trigger actually fires. Pick a product id, then:
--
--      insert into public.product_batches (store_id, product_id, quantity, expiry_date)
--      select store_id, id, 5, current_date + 7 from public.products where id = '<id>';
--      -- products.stock for <id> must have risen by exactly 5
--      delete from public.product_batches where product_id = '<id>' and quantity = 5;
--      -- and fallen back by exactly 5
--
--   3. Cross-tenant batches are impossible. MUST fail with 23503:
--
--      insert into public.product_batches (store_id, product_id, quantity)
--      values ('<store A>', '<a product in store B>', 1);
--
--   4. RLS, rows actually affected (D24) - as a real staff session with the
--      anon key, never the service role:
--        select from product_batches -> rows visible (store members may read)
--        insert into product_batches -> refused
--        update product_batches      -> 200 with 0 rows
--
-- ============================================================
-- DOWN
-- ============================================================
-- Reversible with no loss of products data. The batches themselves are lost,
-- which is acceptable only while nothing but the backfill has written them.
--
--   drop trigger if exists product_batches_sync_stock on public.product_batches;
--   drop function if exists public.sync_product_stock_from_batches();
--   drop table if exists public.product_batches;
--   alter table public.products drop constraint if exists products_store_id_id_key;
--
-- products.stock keeps whatever value the mirror last set, which equals the
-- batch sum, which equals what it held before this migration.
