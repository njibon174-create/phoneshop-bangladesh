-- ============================================================
-- PhoneShop BD — Step 2: Core Schema
-- ============================================================
-- Run this in Supabase SQL Editor (Database → SQL Editor → New query).
-- RLS is disabled per project rules. Anon key from frontend can read all.
-- All edits go through admin tooling (Step 6) using the service key.
-- ============================================================

-- Extensions ----------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- for fuzzy text search

-- Clean re-runs -------------------------------------------------
drop table if exists public.order_items  cascade;
drop table if exists public.orders        cascade;
drop table if exists public.product_images cascade;
drop table if exists public.product_specs  cascade;
drop table if exists public.products      cascade;
drop table if exists public.brands        cascade;

-- ============================================================
-- BRANDS
-- ============================================================
create table public.brands (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null unique,
  slug            text not null unique,
  logo_url        text,                       -- host your own logo or use editorial brand mark
  description     text,
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index brands_slug_idx        on public.brands (slug);
create index brands_active_idx      on public.brands (is_active) where is_active = true;

-- ============================================================
-- PRODUCTS
-- ============================================================
-- A "product" is a specific SKU (e.g. iPhone 15 Pro Max 256GB Natural Titanium).
-- Per-brand specs go in `product_specs` (key/value) for indexable filtering,
-- plus a JSONB blob for full disclosure without needing a schema rewrite.
-- ============================================================
create table public.products (
  id              uuid primary key default uuid_generate_v4(),
  brand_id        uuid not null references public.brands(id) on delete restrict,
  slug            text not null unique,
  name            text not null,              -- "iPhone 15 Pro Max"
  variant         text,                       -- "256GB Natural Titanium"
  sku             text unique,                -- IMEI-less internal SKU
  price_bdt       integer not null,           -- Taka, stored as integer (no decimals)
  compare_price_bdt integer,                  -- strike-through price
  cost_bdt        integer,                    -- admin only
  condition       text not null default 'new' check (condition in ('new', 'refurbished', 'used')),
  warranty_months integer not null default 12,
  short_desc      text,
  long_desc       text,
  full_specs      jsonb not null default '{}'::jsonb,  -- arbitrary per-brand specs
  is_active       boolean not null default true,
  is_featured     boolean not null default false,
  is_bestseller   boolean not null default false,
  release_date    date,
  sort_order      integer not null default 0,
  search_text     tsvector
                   generated always as (
                     setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
                     setweight(to_tsvector('simple', coalesce(variant, '')), 'B') ||
                     setweight(to_tsvector('simple', coalesce(short_desc, '')), 'C')
                   ) stored,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index products_brand_idx       on public.products (brand_id);
create index products_slug_idx        on public.products (slug);
create index products_active_idx      on public.products (is_active) where is_active = true;
create index products_featured_idx    on public.products (is_featured) where is_featured = true;
create index products_bestseller_idx  on public.products (is_bestseller) where is_bestseller = true;
create index products_price_idx       on public.products (price_bdt) where is_active = true;
create index products_release_idx     on public.products (release_date desc nulls last);
create index products_search_idx      on public.products using gin (search_text);
create index products_full_specs_idx  on public.products using gin (full_specs);

-- ============================================================
-- PRODUCT_SPECS (indexable key/value for filtering)
-- ============================================================
-- Use this for filterable specs (RAM, storage, screen size, battery, 5G, etc).
-- Full disclosure can still read `full_specs` JSONB on the product row.
-- ============================================================
create table public.product_specs (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid not null references public.products(id) on delete cascade,
  spec_key        text not null,              -- "ram_gb", "storage_gb", "battery_mah", "display_in"
  spec_value_num  numeric,                    -- numeric form for range filters
  spec_value_text text,                       -- fallback for non-numeric
  display_label   text,                       -- "RAM", "Storage", "Battery"
  display_value   text,                       -- "8GB", "256GB", "4422mAh"
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now()
);

create index product_specs_product_idx on public.product_specs (product_id);
create index product_specs_key_idx     on public.product_specs (spec_key);
create index product_specs_num_idx      on public.product_specs (spec_key, spec_value_num)
  where spec_value_num is not null;

-- ============================================================
-- PRODUCT_IMAGES
-- ============================================================
-- One product → many images. `position` controls display order.
-- `is_primary` is the cover image shown in cards.
-- ============================================================
create table public.product_images (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid not null references public.products(id) on delete cascade,
  url             text not null,              -- prefer Supabase Storage URLs; will fall back to OEM press-kit URLs
  alt_text        text,
  position        integer not null default 0,
  is_primary      boolean not null default false,
  created_at      timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id);
create index product_images_primary_idx on public.product_images (product_id, is_primary) where is_primary = true;

-- ============================================================
-- INVENTORY (one row per product — simple stock count)
-- ============================================================
create table public.inventory (
  product_id      uuid primary key references public.products(id) on delete cascade,
  stock_count     integer not null default 0,
  low_stock_at    integer not null default 5,  -- threshold for "low stock" badge
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
-- Designed for the Bangladesh payment flow (Step 5):
-- COD + bKash/Nagad manual reference. No payment gateway in this step.
-- ============================================================
create table public.orders (
  id              uuid primary key default uuid_generate_v4(),
  order_number    text not null unique,                       -- human-readable e.g. "BD-20250812-0001"
  customer_name   text not null,
  customer_phone  text not null,                              -- BD format e.g. +8801XXXXXXXXX
  customer_email  text,
  shipping_address text not null,
  shipping_city   text not null,
  shipping_thana  text,
  shipping_postcode text,
  shipping_notes  text,
  subtotal_bdt    integer not null,
  shipping_bdt    integer not null default 60,
  total_bdt       integer not null,
  payment_method  text not null check (payment_method in ('cod', 'bkash', 'nagad')),
  payment_status  text not null default 'pending'
                    check (payment_status in ('pending', 'manual_confirmed', 'failed', 'refunded')),
  payment_ref     text,                                       -- bKash/Nagad txn id supplied by customer
  order_status    text not null default 'pending'
                    check (order_status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index orders_order_number_idx on public.orders (order_number);
create index orders_phone_idx        on public.orders (customer_phone);
create index orders_status_idx       on public.orders (order_status);
create index orders_payment_idx      on public.orders (payment_status);
create index orders_created_idx      on public.orders (created_at desc);

-- ============================================================
-- ORDER_ITEMS
-- ============================================================
-- Snapshot of price at time of purchase (don't live-link to products).
-- ============================================================
create table public.order_items (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete restrict,
  product_name    text not null,                              -- snapshot
  product_variant text,                                       -- snapshot
  unit_price_bdt  integer not null,                           -- snapshot
  quantity        integer not null default 1 check (quantity > 0),
  line_total_bdt  integer not null,
  created_at      timestamptz not null default now()
);

create index order_items_order_idx   on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- ============================================================
-- HELPER VIEW: products with brand + primary image + stock
-- ============================================================
-- This is the main "feed" view the frontend will query.
-- ============================================================
create or replace view public.products_with_meta as
  select
    p.id,
    p.slug,
    p.name,
    p.variant,
    p.price_bdt,
    p.compare_price_bdt,
    p.condition,
    p.warranty_months,
    p.short_desc,
    p.long_desc,
    p.full_specs,
    p.is_featured,
    p.is_bestseller,
    p.release_date,
    p.created_at,
    b.id as brand_id,
    b.name as brand_name,
    b.slug as brand_slug,
    b.logo_url as brand_logo_url,
    (
      select url from public.product_images pi
      where pi.product_id = p.id and pi.is_primary = true
      limit 1
    ) as primary_image_url,
    coalesce(i.stock_count, 0) as stock_count,
    coalesce(i.low_stock_at, 5) as low_stock_at,
    case
      when coalesce(i.stock_count, 0) = 0 then 'out_of_stock'
      when coalesce(i.stock_count, 0) <= coalesce(i.low_stock_at, 5) then 'low_stock'
      else 'in_stock'
    end as stock_status
  from public.products p
  join public.brands b on b.id = p.brand_id
  left join public.inventory i on i.product_id = p.id
  where p.is_active = true and b.is_active = true;

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger brands_touch_updated_at
  before update on public.brands
  for each row execute function public.touch_updated_at();

create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

create trigger inventory_touch_updated_at
  before update on public.inventory
  for each row execute function public.touch_updated_at();

create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ============================================================
-- DISABLE RLS (per project rule — admin runs through service key,
-- public reads go through anon key on tables/views explicitly granted)
-- ============================================================
alter table public.brands         disable row level security;
alter table public.products       disable row level security;
alter table public.product_specs  disable row level security;
alter table public.product_images disable row level security;
alter table public.inventory      disable row level security;
alter table public.orders         disable row level security;
alter table public.order_items    disable row level security;

-- ============================================================
-- GRANTS — anon key can read public data, only authenticated can write
-- ============================================================
-- (We don't gate by role; the backend will use the service key for writes
--  via admin endpoints. Anon key only reads public tables.)
grant usage on schema public to anon, authenticated;
grant select on public.brands, public.products, public.product_specs,
                public.product_images, public.inventory
            to anon, authenticated;
grant select on public.products_with_meta to anon, authenticated;

-- Orders / order_items: anon INSERT only (for checkout), no SELECT.
-- Admin uses service key for everything else.
grant insert on public.orders, public.order_items to anon, authenticated;
grant all on public.brands, public.products, public.product_specs,
             public.product_images, public.inventory, public.orders,
             public.order_items
      to authenticated;

-- Authenticated users can read their own orders via service key in app code,
-- or we can add a customer_id auth.users reference later. Out of scope for Step 2.

-- ============================================================
-- DONE
-- ============================================================
-- Tables created: 7
-- View created: 1
-- Indexes: 15+
-- RLS disabled on all tables
-- Grants set for anon (read-only) + authenticated (full)
-- ============================================================
