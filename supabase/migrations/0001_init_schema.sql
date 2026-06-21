-- =============================================================================
-- ATL Blade Co. — Phase 1 schema
-- Normalized tables for users, catalog, orders, discounts, and site content.
-- =============================================================================

-- ---- Enums ------------------------------------------------------------------
create type public.user_role as enum ('admin', 'customer');
create type public.payment_status as enum ('pending', 'paid', 'refunded', 'failed');
create type public.fulfillment_status as enum ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
create type public.discount_type as enum ('percentage', 'fixed');

-- ---- updated_at trigger helper ---------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---- users ------------------------------------------------------------------
-- Mirrors auth.users with an app-level role. One row per authenticated user.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

comment on table public.users is 'Application profile + role for each auth user.';

-- Auto-create a public.users row when an auth user is created.
-- Promotes to admin when the email is listed in the seeded admin_emails table.
create table public.admin_emails (
  email text primary key
);
comment on table public.admin_emails is 'Bootstrap allow-list: these emails become admin on signup.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_role public.user_role := 'customer';
begin
  if exists (select 1 from public.admin_emails ae where lower(ae.email) = lower(new.email)) then
    resolved_role := 'admin';
  end if;

  insert into public.users (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    resolved_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- categories -------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ---- products ---------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  price numeric(10, 2),
  sale_price numeric(10, 2),
  inventory int not null default 0,
  featured boolean not null default false,
  active boolean not null default true,
  tags text[] not null default '{}',
  badge text,
  specs jsonb not null default '[]'::jsonb,
  features text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.products.active is 'false = archived (hidden from storefront).';
comment on column public.products.specs is 'Array of [label, value] pairs for the spec table.';

create index products_category_id_idx on public.products (category_id);
create index products_active_idx on public.products (active);
create index products_featured_idx on public.products (featured);

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---- product_images ---------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);

-- ---- discounts --------------------------------------------------------------
create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type public.discount_type not null,
  value numeric(10, 2) not null,
  starts_at timestamptz,
  expires_at timestamptz,
  usage_limit int,
  usage_count int not null default 0,
  min_subtotal numeric(10, 2),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index discounts_code_idx on public.discounts (code);

create trigger discounts_updated_at
  before update on public.discounts
  for each row execute function public.set_updated_at();

-- ---- orders -----------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references public.users (id) on delete set null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb,
  subtotal numeric(10, 2) not null default 0,
  discount_total numeric(10, 2) not null default 0,
  shipping_total numeric(10, 2) not null default 0,
  tax_total numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  discount_id uuid references public.discounts (id) on delete set null,
  payment_status public.payment_status not null default 'pending',
  fulfillment_status public.fulfillment_status not null default 'pending',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_user_id_idx on public.orders (user_id);
create index orders_payment_status_idx on public.orders (payment_status);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---- order_items ------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  product_slug text,
  unit_price numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);

-- ---- homepage_settings (singleton) -----------------------------------------
create table public.homepage_settings (
  id boolean primary key default true check (id),
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  hero_cta_text text,
  hero_cta_link text,
  hero_gallery jsonb not null default '[]'::jsonb,
  featured_product_ids uuid[] not null default '{}',
  banners jsonb not null default '[]'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.homepage_settings is 'Single-row table (id is always true) holding editable homepage content.';

create trigger homepage_settings_updated_at
  before update on public.homepage_settings
  for each row execute function public.set_updated_at();

-- ---- site_settings (singleton) ---------------------------------------------
create table public.site_settings (
  id boolean primary key default true check (id),
  company_name text,
  contact_email text,
  phone text,
  address jsonb,
  shipping_policy text,
  return_policy text,
  social_links jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.site_settings is 'Single-row table (id is always true) holding global site settings.';

create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();
