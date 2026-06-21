-- =============================================================================
-- Storage bucket for product images.
--   * Bucket is public-read so storefront <img> tags resolve via public URLs.
--   * Writes (insert/update/delete) are admin-only via is_admin(); uploads in
--     the app go through the service-role client (which bypasses RLS), so these
--     policies are defense-in-depth for any anon/authenticated access.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read of objects in the product-images bucket.
create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Admin-only writes.
create policy "admins upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "admins update product images"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

create policy "admins delete product images"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());
