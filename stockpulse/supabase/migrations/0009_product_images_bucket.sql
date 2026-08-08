-- =====================================================================
-- 0009_product_images_bucket.sql — product photo storage
--
-- WHAT THIS ADDS:
--   A public `product-images` bucket and the four storage policies that
--   scope writes to the store a person belongs to.
--
--   No column is added: products.image_url already exists in schema.sql
--   and is already typed in types/index.ts. Nothing has ever written to
--   it, because there was no way to upload an image.
--
-- ---------------------------------------------------------------------
-- PATH SCHEME — this is what the policies key on.
--
--   <store_id>/<random-uuid>
--
--   The first segment is the store. Every write policy requires it to
--   equal public.current_store_id(), so a member of one shop cannot
--   write into another shop's folder even with a crafted request. That
--   is the "RLS scoped to the store" requirement, enforced at the only
--   layer that counts.
--
--   The second segment is a fresh uuid per upload, NOT the product id.
--   It cannot be the product id: an image can be chosen while creating a
--   product, before any id exists. The client deletes the previous object
--   after a successful replace, so this does not orphan files the way an
--   unmanaged unique filename would.
--
-- WHY PUBLIC READ:
--   Product photos render in the inventory list, the product detail, the
--   sales picker and purchase orders — many per page, on nearly every
--   screen. Signed URLs would mean minting one per image per page load,
--   and they expire, so next/image could not cache them. A tin of beans
--   is not a secret. Write access is still shut down below.
--
-- WHO MAY WRITE:
--   can_manage() — owners and managers. Staff can see products but do
--   not edit the catalogue, which mirrors the products table's own
--   policies rather than inventing a second, looser rule for images.
--
-- ROLLBACK:
--   delete from storage.objects where bucket_id = 'product-images';
--   delete from storage.buckets where id = 'product-images';
--   drop policy if exists "product images are publicly readable" on storage.objects;
--   drop policy if exists "managers upload product images" on storage.objects;
--   drop policy if exists "managers update product images" on storage.objects;
--   drop policy if exists "managers delete product images" on storage.objects;
-- =====================================================================

begin;

do $$
begin
  if to_regprocedure('public.can_manage()') is null then
    raise exception '0009: role helpers from 0002 are missing — apply 0002 first';
  end if;
end $$;

-- 2 MiB and three formats, matching the avatars bucket. The client re-encodes
-- to WebP well under this, but the bucket is the real boundary: a crafted
-- request bypasses the browser, not this.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product images are publicly readable" on storage.objects;
create policy "product images are publicly readable" on storage.objects
  for select
  using (bucket_id = 'product-images');

drop policy if exists "managers upload product images" on storage.objects;
create policy "managers upload product images" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and public.can_manage()
    and (storage.foldername(name))[1] = public.current_store_id()::text
  );

-- Update needs both USING and WITH CHECK: the first decides which rows may be
-- touched, the second what they may become. Without WITH CHECK an update could
-- rename a file out of this store's folder and into another's.
drop policy if exists "managers update product images" on storage.objects;
create policy "managers update product images" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.can_manage()
    and (storage.foldername(name))[1] = public.current_store_id()::text
  )
  with check (
    bucket_id = 'product-images'
    and public.can_manage()
    and (storage.foldername(name))[1] = public.current_store_id()::text
  );

drop policy if exists "managers delete product images" on storage.objects;
create policy "managers delete product images" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.can_manage()
    and (storage.foldername(name))[1] = public.current_store_id()::text
  );

commit;

-- ---------------------------------------------------------------------
-- Verify:
--   select id, public, file_size_limit from storage.buckets
--   where id = 'product-images';
--
--   select policyname, cmd from pg_policies
--   where schemaname = 'storage' and tablename = 'objects'
--     and policyname like '%product image%';      -- expect 4 rows
--
--   Then in the app: Inventory -> Add Product -> choose a photo, frame it,
--   save. The stored image_url should look like
--   https://<project>.supabase.co/storage/v1/object/public/product-images/<store>/<uuid>
--   which is the shape next.config.ts already allows.
-- ---------------------------------------------------------------------
