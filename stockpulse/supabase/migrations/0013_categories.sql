-- =====================================================================
-- 0013_categories.sql — product categories become the shop's own data
--
-- WHAT THIS FIXES:
--   products.category was `text not null check (category in ('produce',
--   'dairy', 'packaged', 'beverages', 'household'))`. A shop that sells
--   frozen food, stationery or pet supplies had no way to say so, and the
--   only way to add one was a code change plus a migration — five hardcoded
--   copies of the same list in the app (types/index.ts twice,
--   lib/validation/product.ts, ProductModal.tsx, InventoryClient.tsx) and a
--   sixth here in the CHECK.
--
-- THE SHAPE, AND WHY IT IS NOT category_id:
--   products.category stays a TEXT column holding the slug, and gains a
--   composite foreign key (store_id, category) -> categories(store_id, slug).
--   The obvious alternative — a category_id uuid — was rejected because:
--
--     * public.sales_category_breakdown() (migration 0004) groups by
--       p.category and returns it as text. A uuid there would change that
--       function's contract and every caller of it.
--     * CSV import and export round-trip the category as a readable word.
--       Exporting uuids would make the file useless to a shopkeeper.
--     * Every existing products row stays valid with no data rewrite.
--
--   Carrying store_id INTO the foreign key is the part that matters for a
--   multi-tenant table: it makes it structurally impossible for one shop's
--   product to reference another shop's category. A plain FK on slug alone
--   could not express that, because slugs are only unique per store.
--
-- THE SLUG IS IMMUTABLE; RENAME CHANGES name ONLY:
--   `name` is what people read; `slug` is identity. Renaming "Frozen" to
--   "Frozen Foods" leaves slug 'frozen' and rewrites no products rows, so a
--   shop's history does not shift under a relabelling. ON UPDATE CASCADE is
--   set anyway as a safety net — the app never updates a slug, but if
--   something ever does, the products must follow rather than orphan.
--
-- ON DELETE RESTRICT is the belt; the Server Action is the braces:
--   deleteCategory counts the products using it first and refuses with a
--   sentence a shopkeeper can act on. RESTRICT is here because that check
--   can be raced or bypassed by a crafted request, and a category vanishing
--   out from under live product rows is not recoverable.
--
-- WHO MAY DO WHAT (mirrors lib/permissions.ts — change them together):
--   select  — every member of the store. Staff do not manage categories but
--             they DO read them: /inventory, /dashboard and /sales all render
--             the category's display name, and that name now lives here
--             rather than in a constant compiled into the bundle. A
--             select policy narrower than this would blank the label for
--             staff on three screens.
--   insert/update/delete — public.can_manage(), i.e. owner and manager.
--             Same authority as adding a product, which is the thing a
--             category exists to classify.
--
-- ROLLBACK: see the DOWN block at the foot of this file. It is not a
--   comment-only rollback like 0012's, because this migration creates data
--   as well as structure — read the guard in it before running it.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Step 0. Abort unless the things this depends on exist, and unless the
--         table is genuinely absent. Re-running must be a no-op rather
--         than a second attempt at a backfill — and, as 0002 spells out,
--         a duplicate permissive policy WIDENS access instead of
--         replacing it.
-- ---------------------------------------------------------------------
do $$
begin
  if to_regclass('public.products') is null then
    raise exception 'Aborted: public.products does not exist. Apply schema.sql first.';
  end if;
  if to_regclass('public.stores') is null then
    raise exception 'Aborted: public.stores does not exist. Apply schema.sql first.';
  end if;
  if to_regprocedure('public.current_store_id()') is null then
    raise exception 'Aborted: public.current_store_id() is missing. Apply the base schema first.';
  end if;
  if to_regprocedure('public.can_manage()') is null then
    raise exception 'Aborted: public.can_manage() is missing. Apply 0002_manager_role.sql first.';
  end if;
  if to_regclass('public.categories') is not null then
    raise exception 'Aborted: public.categories already exists. 0013 has been applied.';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Step 1. The table.
-- ---------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  store_id   uuid not null references public.stores(id) on delete cascade,
  name       text not null,
  slug       text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  -- `not null` is not `not blank` — the pattern FOUND-ISSUES logs against
  -- stores.name, where clearing the field wrote '' successfully and left the
  -- shop nameless everywhere it was printed. The app validates and trims
  -- before the write; these close it at the layer that cannot be bypassed.
  constraint categories_name_not_blank check (length(trim(name)) > 0),
  constraint categories_slug_shape     check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint categories_name_length    check (length(name) <= 40),

  -- The foreign key target below. Also what stops the same slug being
  -- created twice in one shop; other shops are unaffected.
  constraint categories_store_slug_key unique (store_id, slug)
);

-- Two shops may both have "Produce". One shop may not have it twice under
-- different capitalisation — "Frozen" and "frozen" in the same list is a
-- data-entry mistake, not a choice. The Server Action turns the resulting
-- 23505 into a readable field error.
create unique index categories_store_name_key
  on public.categories (store_id, lower(name));

-- Deliberately NOT unique on (store_id, sort_order): reordering swaps values
-- between two rows, and a unique constraint would make every swap need a
-- third temporary value or a deferred constraint to get through.
create index categories_store_sort_idx
  on public.categories (store_id, sort_order, name);

-- ---------------------------------------------------------------------
-- Step 2. RLS. Mirrors lib/permissions.ts#canManage.
-- ---------------------------------------------------------------------
alter table public.categories enable row level security;

create policy "store members can view categories" on public.categories
  for select using (store_id = public.current_store_id());

create policy "managers can insert categories" on public.categories
  for insert with check (store_id = public.current_store_id() and public.can_manage());

create policy "managers can update categories" on public.categories
  for update using (store_id = public.current_store_id() and public.can_manage());

create policy "managers can delete categories" on public.categories
  for delete using (store_id = public.current_store_id() and public.can_manage());

-- ---------------------------------------------------------------------
-- Step 3. Backfill, BEFORE the foreign key exists — the FK cannot be
--         added while products reference rows that are not there yet.
--
--         Every store gets the five values the CHECK constraint used to
--         allow, in the order the product form listed them. That is not a
--         new opinion about what a shop sells; it is exactly what the app
--         offered yesterday, so nobody's list changes on the day this runs.
-- ---------------------------------------------------------------------
insert into public.categories (store_id, name, slug, sort_order)
select s.id, d.name, d.slug, d.sort_order
from public.stores s
cross join (values
  ('Produce',        'produce',    1),
  ('Dairy & Eggs',   'dairy',      2),
  ('Packaged Goods', 'packaged',   3),
  ('Beverages',      'beverages',  4),
  ('Household',      'household',  5)
) as d(name, slug, sort_order)
on conflict (store_id, slug) do nothing;

-- Defensive: any value actually in use that the five above do not cover.
-- The CHECK constraint should have made this impossible, but the FK in
-- step 5 will fail loudly on a single stray row and take the whole
-- migration with it, so it is cheaper to catch them here. The name is the
-- slug title-cased, which the owner can rename afterwards.
insert into public.categories (store_id, name, slug, sort_order)
select p.store_id,
       initcap(replace(p.category, '-', ' ')),
       p.category,
       99
from (select distinct store_id, category from public.products) p
on conflict (store_id, slug) do nothing;

-- ---------------------------------------------------------------------
-- Step 4. Drop the CHECK. Looked up by definition rather than assumed by
--         name, the way 0002 handles profiles_role_check — the constraint
--         may have been created unnamed.
-- ---------------------------------------------------------------------
do $$
declare c text;
begin
  select conname into c
  from pg_constraint
  where conrelid = 'public.products'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%category%';
  if c is not null then
    execute format('alter table public.products drop constraint %I', c);
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Step 5. The foreign key. Composite, so a product can only ever name a
--         category belonging to its OWN store.
--
--         RESTRICT, not CASCADE and not SET NULL: cascading would delete a
--         shop's products because somebody tidied a list, and SET NULL is
--         not available — products.category is `not null`.
-- ---------------------------------------------------------------------
alter table public.products
  add constraint products_category_fkey
  foreign key (store_id, category)
  references public.categories (store_id, slug)
  on update cascade
  on delete restrict;

-- The FK needs an index on the referencing side or every category delete
-- (and every check that one is safe) sequentially scans products. The
-- existing products_category_idx is on (category) alone, which does not
-- serve a composite lookup.
create index if not exists products_store_category_idx
  on public.products (store_id, category);

commit;

-- =====================================================================
-- VERIFY (run after; each should return what the comment says)
-- =====================================================================
--   -- 5 rows per store, ordered:
--   select store_id, slug, name, sort_order from public.categories
--     order by store_id, sort_order;
--
--   -- 4 policies: select for members, insert/update/delete via can_manage():
--   select policyname, cmd, qual, with_check from pg_policies
--     where schemaname = 'public' and tablename = 'categories';
--
--   -- the CHECK is gone and the FK is present:
--   select conname, contype, pg_get_constraintdef(oid)
--     from pg_constraint where conrelid = 'public.products'::regclass;
--
--   -- zero rows: every product's category resolves to one of its own
--   -- store's categories.
--   select p.id from public.products p
--     where not exists (
--       select 1 from public.categories c
--       where c.store_id = p.store_id and c.slug = p.category);

-- =====================================================================
-- DOWN — reverses this migration.
--
-- READ THIS FIRST: restoring the CHECK constraint can only succeed if every
-- product still uses one of the original five slugs. If the shop has added
-- its own categories and put products in them, the guard below aborts and
-- names the offending rows rather than half-reversing. Move those products
-- to an original category first, or drop the CHECK restore from the down
-- path and accept an unconstrained text column.
--
--   begin;
--
--   do $$
--   declare stray text[];
--   begin
--     select array_agg(distinct category) into stray
--     from public.products
--     where category not in ('produce','dairy','packaged','beverages','household');
--     if stray is not null then
--       raise exception
--         'Aborted: products use categories the old CHECK did not allow: %. Reassign them before reversing.',
--         stray;
--     end if;
--   end $$;
--
--   alter table public.products drop constraint if exists products_category_fkey;
--   drop index if exists public.products_store_category_idx;
--
--   alter table public.products
--     add constraint products_category_check
--     check (category in ('produce','dairy','packaged','beverages','household'));
--
--   drop policy if exists "store members can view categories" on public.categories;
--   drop policy if exists "managers can insert categories"    on public.categories;
--   drop policy if exists "managers can update categories"    on public.categories;
--   drop policy if exists "managers can delete categories"    on public.categories;
--   drop table if exists public.categories;
--
--   commit;
-- =====================================================================
