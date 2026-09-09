-- ============================================================================
-- Storage buckets
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false) -- private: signed URLs only
on conflict (id) do nothing;

-- products: public read, admin-only write
create policy "products_bucket_public_read" on storage.objects
  for select using (bucket_id = 'products');

create policy "products_bucket_admin_write" on storage.objects
  for insert with check (bucket_id = 'products' and public.is_admin());

create policy "products_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'products' and public.is_admin());

create policy "products_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'products' and public.is_admin());

-- profile-images: public read, owner-only write (path must start with the user's uid)
create policy "profile_images_public_read" on storage.objects
  for select using (bucket_id = 'profile-images');

create policy "profile_images_owner_write" on storage.objects
  for insert with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "profile_images_owner_update" on storage.objects
  for update using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- payment-proofs: private. Owner can upload/read their own; admin can read all.
-- Access for regular users should always go through a signed URL, never a
-- public URL.
create policy "payment_proofs_owner_write" on storage.objects
  for insert with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "payment_proofs_owner_or_admin_read" on storage.objects
  for select using (
    bucket_id = 'payment-proofs' and (
      (storage.foldername(name))[1] = auth.uid()::text or public.is_admin()
    )
  );
