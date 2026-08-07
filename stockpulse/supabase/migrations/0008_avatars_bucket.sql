-- =====================================================================
-- 0008_avatars_bucket.sql — profile photo storage
--
-- WHAT THIS ADDS:
--   A public `avatars` bucket, plus the four storage policies that let a
--   person manage their own photo and nobody else's.
--
--   Before this, "Photo URL" was a free-text box: the only way to have a
--   picture was to host it somewhere else and paste a link. Nobody does
--   that, so in practice every profile fell back to initials.
--
-- ---------------------------------------------------------------------
-- WHY THE BUCKET IS PUBLIC
--
--   Avatars render in the topbar, the staff table and the profile card —
--   on nearly every page, for every member of the store. Signed URLs would
--   mean minting one per image per page load, and they expire, so
--   next/image could not cache them. A profile photo is not a secret, the
--   path contains a uuid nobody can guess, and write access is still shut
--   down below.
--
--   READ is public. WRITE is not: every write policy requires the first
--   path segment to be the caller's own uid, so `<uid>/avatar.jpg` is the
--   only shape anyone can write, and only under their own uid.
-- ---------------------------------------------------------------------
--
-- ROLLBACK:
--   delete from storage.objects where bucket_id = 'avatars';
--   delete from storage.buckets where id = 'avatars';
--   drop policy if exists "avatar images are publicly readable" on storage.objects;
--   drop policy if exists "users upload their own avatar" on storage.objects;
--   drop policy if exists "users update their own avatar" on storage.objects;
--   drop policy if exists "users delete their own avatar" on storage.objects;
-- =====================================================================

begin;

-- 2 MiB and three formats. The client checks the same limits before
-- uploading so the user gets a readable message, but the bucket is the real
-- boundary — a crafted request bypasses the browser, not this.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------
-- Policies.
--
-- `(storage.foldername(name))[1]` is the first path segment. Requiring it
-- to equal the caller's uid is what stops one member of a store from
-- overwriting a colleague's photo — store membership is deliberately not
-- sufficient here, because an avatar belongs to a person, not to a shop.
-- ---------------------------------------------------------------------
drop policy if exists "avatar images are publicly readable" on storage.objects;
create policy "avatar images are publicly readable" on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists "users upload their own avatar" on storage.objects;
create policy "users upload their own avatar" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Update needs both USING and WITH CHECK: the first decides which rows may
-- be touched, the second what they may become. Without WITH CHECK an update
-- could rename a file out of your own folder and into somebody else's.
drop policy if exists "users update their own avatar" on storage.objects;
create policy "users update their own avatar" on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete their own avatar" on storage.objects;
create policy "users delete their own avatar" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;

-- ---------------------------------------------------------------------
-- Verify:
--   select id, public, file_size_limit from storage.buckets where id = 'avatars';
--
--   select policyname, cmd from pg_policies
--   where schemaname = 'storage' and tablename = 'objects'
--     and policyname like '%avatar%';        -- expect 4 rows
--
--   Then in the app: Profile -> Edit Profile -> choose a photo. The stored
--   avatar_url should look like
--   https://<project>.supabase.co/storage/v1/object/public/avatars/<uid>/...
--   which is the exact shape next.config.ts already allows.
-- ---------------------------------------------------------------------
