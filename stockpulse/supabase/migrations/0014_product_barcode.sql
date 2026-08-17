-- ============================================================
-- 0014 — products.barcode
-- ============================================================
-- WHY
--   Phase 1 of barcode scanning: the column and manual entry only. Nothing in
--   this migration reads a camera, and nothing downstream of it does yet.
--
-- WHAT THIS ADDS
--   1. products.barcode  text  NULL           — nullable, because most shops
--      will fill it in over time and a NOT NULL column would make the feature
--      a blocker on every product form from the day it lands.
--   2. A CHECK on the shape, mirroring lib/validation/product.ts.
--   3. A UNIQUE index, PER STORE, over non-null values only.
--
-- ------------------------------------------------------------
-- DECISION 1 — uniqueness is (store_id, barcode), not (barcode)
-- ------------------------------------------------------------
--   A global unique index on barcode alone is wrong for this application, and
--   the failure is not subtle: EAN/UPC codes identify a PRODUCT, not a
--   product-in-a-shop. Two different grocers both stocking Amul Whole Milk 1L
--   scan the same 13 digits. Under a global index, whichever store typed it
--   first would permanently prevent every other store on the platform from
--   recording that product — a cross-tenant collision, surfaced to the second
--   shopkeeper as "already used by" a product they cannot see and cannot fix.
--
--   Carrying store_id into the key is the same multi-tenant invariant D35
--   established for products_category_fkey: one shop's row can never collide
--   with another shop's, enforced by the database rather than by remembering
--   to write .eq('store_id') at every call site.
--
--   It is also what the later scanning phases need. A scan resolves within the
--   current store — `where store_id = current_store_id() and barcode = $1` —
--   so the index that enforces uniqueness is the same index that serves the
--   lookup. A global index would not be usable for that query.
--
--   If a global namespace is ever genuinely wanted, it is one line:
--     create unique index products_barcode_key on public.products (barcode)
--       where barcode is not null;
--   Do not add it without first deciding what a second store stocking the
--   same product is supposed to do.
--
-- ------------------------------------------------------------
-- DECISION 2 — a PARTIAL index, so "multiple NULLs are allowed" is
--              true by construction rather than by default semantics
-- ------------------------------------------------------------
--   Postgres unique indexes do already permit multiple NULLs: two NULLs are
--   never equal, so they never conflict. Since PG15 that behaviour can be
--   inverted with NULLS NOT DISTINCT, which means the guarantee now depends
--   on a default rather than on the standard.
--
--   `where barcode is not null` sidesteps the question entirely: rows with no
--   barcode are not in the index AT ALL, so no amount of NULLS-handling
--   configuration can make them collide. It also keeps the index to only the
--   rows that can conflict.
--
--   Verify after applying — this is the check, do not infer it from the file
--   existing (D38):
--
--     -- (a) the column and its nullability
--     select column_name, data_type, is_nullable
--     from information_schema.columns
--     where table_schema = 'public' and table_name = 'products'
--       and column_name = 'barcode';
--     -- expect: barcode | text | YES
--
--     -- (b) the index, and that it is partial + per-store
--     select indexdef from pg_indexes
--     where schemaname = 'public' and tablename = 'products'
--       and indexname = 'products_store_barcode_key';
--     -- expect: CREATE UNIQUE INDEX ... ON public.products
--     --         USING btree (store_id, barcode) WHERE (barcode IS NOT NULL)
--
--     -- (c) multiple NULLs really are permitted, measured not assumed
--     select count(*) - count(barcode) as null_barcodes
--     from public.products;
--     -- any number > 1 here is the proof; the index above accepts it.
--
-- ------------------------------------------------------------
-- DECISION 3 — no new RLS policy, deliberately
-- ------------------------------------------------------------
--   A column inherits the row policies of its table. products already carries
--   its full set (schema.sql, rewritten by 0002 to use can_manage()):
--
--     "store members can view products"   SELECT  store_id = current_store_id()
--     "owner can insert products"         INSERT  ... and can_manage()
--     "owner can update products"         UPDATE  ... and can_manage()
--     "owner can delete products"         DELETE  ... and can_manage()
--     "staff can update stock on sale"    UPDATE  store_id = current_store_id()
--
--   Writing a barcode-specific policy would be actively harmful: Postgres OR's
--   permissive policies together, so an extra one can only ever WIDEN access,
--   never narrow it. There is nothing to add.
--
--   NOTE, and it is a pre-existing one this migration does NOT change: the
--   last policy above has no role test, no column list and no WITH CHECK, so
--   staff can already PATCH any products column in their own store directly
--   through PostgREST. barcode inherits exactly that — it opens no new path,
--   but it does not close the existing one either. The app-layer guard
--   (canManage in inventory/actions.ts) is what stops staff through the UI.
--   Narrowing that policy is its own change, with its own blast radius on the
--   sale path, and is out of scope here.
--
-- ------------------------------------------------------------
-- APPLYING
-- ------------------------------------------------------------
--   Supabase SQL editor. There is no migration CLI wired up and no DDL path
--   from an agent (no psql, no pg driver, service-role reaches PostgREST only).
--   Safe to re-run: every statement is guarded.
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
end $$;

-- ------------------------------------------------------------
-- Step 1. The column.
-- ------------------------------------------------------------
alter table public.products
  add column if not exists barcode text;

comment on column public.products.barcode is
  'EAN/UPC/ITF barcode, digits only, 8-14 chars. Nullable. Unique per store '
  '(products_store_barcode_key). Manual entry only as of migration 0014 - no '
  'scanner reads this column yet.';

-- ------------------------------------------------------------
-- Step 2. Shape, mirroring lib/validation/product.ts.
-- ------------------------------------------------------------
--   8..14 digits covers every retail symbology a grocery meets: EAN-8 (8),
--   UPC-E expanded (8), UPC-A (12), EAN-13 (13), ITF-14 / GTIN-14 (14).
--   Digits only, because a leading apostrophe or a stray space is the
--   difference between a scan matching and a scan silently not matching, and
--   the second failure looks like broken hardware.
--
--   Enforced here as well as in the validator on purpose. This project has
--   already been bitten by `not null` not meaning `not blank` (Phase 7A), and
--   by app-layer and database-layer rules drifting apart (CLAUDE.md). The
--   validator gives a readable message; this makes the bad row impossible.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass
      and conname = 'products_barcode_format_check'
  ) then
    alter table public.products
      add constraint products_barcode_format_check
      check (barcode is null or barcode ~ '^[0-9]{8,14}$');
  end if;
end $$;

-- ------------------------------------------------------------
-- Step 3. The unique index. Per store, non-null rows only.
-- ------------------------------------------------------------
create unique index if not exists products_store_barcode_key
  on public.products (store_id, barcode)
  where barcode is not null;

commit;

-- ============================================================
-- POST-APPLY CHECK — run this, do not assume
-- ============================================================
--   select
--     (select count(*) from information_schema.columns
--       where table_schema='public' and table_name='products'
--         and column_name='barcode' and is_nullable='YES')          as column_ok,
--     (select count(*) from pg_indexes
--       where schemaname='public' and tablename='products'
--         and indexname='products_store_barcode_key')               as index_ok,
--     (select count(*) from pg_constraint
--       where conrelid='public.products'::regclass
--         and conname='products_barcode_format_check')              as check_ok;
--   -- expect 1 | 1 | 1
--
-- ============================================================
-- DOWN
-- ============================================================
--   Reversible with no data loss beyond the column's own contents. Stated
--   explicitly because that is NOT true of most migrations here (0013 needs a
--   guard that aborts rather than half-reversing); this one genuinely is.
--
--   drop index if exists public.products_store_barcode_key;
--   alter table public.products
--     drop constraint if exists products_barcode_format_check;
--   alter table public.products drop column if exists barcode;
