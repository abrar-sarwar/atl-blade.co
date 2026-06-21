-- =============================================================================
-- Row Level Security policies + admin helpers
-- Strategy:
--   * Anonymous/auth users get READ-ONLY access to active storefront content.
--   * All writes are admin-only, gated by public.is_admin().
--   * Orders are written server-side via the service-role key (bypasses RLS);
--     customers may read their own orders.
-- =============================================================================

-- ---- helper functions -------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

comment on function public.is_admin is 'True when the current auth user has role = admin.';

-- One-off helper to promote a user to admin by email (run after first login).
create or replace function public.make_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users set role = 'admin' where lower(email) = lower(target_email);
  insert into public.admin_emails (email)
  values (lower(target_email))
  on conflict (email) do nothing;
end;
$$;

-- ---- enable RLS -------------------------------------------------------------
alter table public.users enable row level security;
alter table public.admin_emails enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.discounts enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.homepage_settings enable row level security;
alter table public.site_settings enable row level security;

-- ---- users ------------------------------------------------------------------
create policy "users read own row" on public.users
  for select using (auth.uid() = id);
create policy "admins read all users" on public.users
  for select using (public.is_admin());
create policy "users update own profile" on public.users
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from public.users where id = auth.uid()));
create policy "admins manage users" on public.users
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- admin_emails (admin-only) ---------------------------------------------
create policy "admins manage admin_emails" on public.admin_emails
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- categories -------------------------------------------------------------
create policy "public reads active categories" on public.categories
  for select using (active or public.is_admin());
create policy "admins manage categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- products ---------------------------------------------------------------
create policy "public reads active products" on public.products
  for select using (active or public.is_admin());
create policy "admins manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- product_images ---------------------------------------------------------
create policy "public reads images of active products" on public.product_images
  for select using (
    public.is_admin() or exists (
      select 1 from public.products p
      where p.id = product_id and p.active
    )
  );
create policy "admins manage product_images" on public.product_images
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- discounts (admin-only; validated server-side at checkout later) --------
create policy "admins manage discounts" on public.discounts
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- orders -----------------------------------------------------------------
create policy "customers read own orders" on public.orders
  for select using (auth.uid() = user_id);
create policy "admins manage orders" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- order_items ------------------------------------------------------------
create policy "customers read own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );
create policy "admins manage order_items" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- homepage_settings ------------------------------------------------------
create policy "public reads homepage settings" on public.homepage_settings
  for select using (true);
create policy "admins manage homepage settings" on public.homepage_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- site_settings ----------------------------------------------------------
create policy "public reads site settings" on public.site_settings
  for select using (true);
create policy "admins manage site settings" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());
