-- ============================================================
-- PhoneShop BD — Migration 007: Product Architecture Redesign
-- ============================================================
-- What this migration does:
-- 1. Creates product_variants (color+RAM+ROM combos per product)
-- 2. Creates inventory_units (individual IMEI-level inventory)
-- 3. Migrates existing phones data into the new tables
-- 4. Creates aggregated view for the storefront
-- 5. Grants permissions
--
-- Run in Supabase SQL Editor: Database → SQL Editor → New query → paste → Run
-- ============================================================

-- ============================================================
-- STEP 1: Create new tables
-- ============================================================

-- Product Variants: each color+RAM+ROM combo for a product
-- Example: Apple iPhone 16 Pro Max | 256GB | Natural Titanium | MRP 194999
create table public.product_variants (
  id              uuid primary key default uuid_generate_v4(),
  product_id      uuid not null,                    -- references products(id) added after products table exists
  variant_name    text not null,                    -- "256GB Natural Titanium"
  color           text,
  ram_gb          integer,
  rom_gb          integer,
  sku             text unique,
  mrp_bdt         integer not null,
  buy_price_bdt   integer,
  compare_price_bdt integer,
  image_url       text,
  is_active       boolean not null default true,
  is_default      boolean not null default false,   -- the "main" variant shown in cards
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Inventory Units: each physical phone (IMEI-level)
-- Links to a product_variant (not directly to product)
create table public.inventory_units (
  id              uuid primary key default uuid_generate_v4(),
  variant_id      uuid not null,                    -- references product_variants(id)
  imei            text unique,
  buy_price_bdt   integer,
  mrp_bdt         integer,
  status          text not null default 'in_stock'
                    check (status in ('in_stock', 'sold', 'reserved', 'returned', 'damaged')),
  sold_at         timestamptz,
  sold_to         text,
  sold_price_bdt  integer,
  condition       text not null default 'new'
                    check (condition in ('new', 'refurbished', 'used')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- STEP 2: Add FK constraints now that both tables exist
-- ============================================================
alter table public.product_variants
  add constraint fk_product_variants_product
  foreign key (product_id) references public.products(id) on delete cascade;

alter table public.inventory_units
  add constraint fk_inventory_units_variant
  foreign key (variant_id) references public.product_variants(id) on delete restrict;

-- ============================================================
-- STEP 3: Indexes
-- ============================================================
create index product_variants_product_idx on public.product_variants (product_id);
create index product_variants_active_idx  on public.product_variants (product_id) where is_active = true;
create index product_variants_color_idx   on public.product_variants (product_id, color) where color is not null;
create index product_variants_ram_idx      on public.product_variants (product_id, ram_gb) where ram_gb is not null;
create index product_variants_rom_idx      on public.product_variants (product_id, rom_gb) where rom_gb is not null;
create index inventory_units_variant_idx   on public.inventory_units (variant_id);
create index inventory_units_status_idx   on public.inventory_units (status) where status = 'in_stock';
create index inventory_units_imei_idx     on public.inventory_units (imei);

-- ============================================================
-- STEP 4: Migrate data from phones → product_variants + inventory_units
-- ============================================================

-- 4a. Seed brands (from existing brands table — no change)
-- Brands already exist and are fine. We'll use them as-is.

-- 4b. For each unique (brand, model) in phones, ensure a product exists
-- Products: brand_id, name=model, variant=variant, price_bdt=mrp
insert into public.products (brand_id, slug, name, variant, price_bdt, is_active, created_at)
select
  coalesce(
    (select id from public.brands where lower(name) = lower(phones.brand) limit 1),
    (select id from public.brands where name = 'Other' limit 1)
  ) as brand_id,
  lower(replace(replace(replace(
    trim(concat(phones.brand, '-', phones.model, '-', phones.variant)),
    ' ', '-'), '/', '-'), '&', '')) || '-' || substr(md5(random()::text), 1, 6) as slug,
  phones.model as name,
  phones.variant as variant,
  phones.mrp as price_bdt,
  true as is_active,
  min(phones.created_at) as created_at
from public.phones
where phones.mrp is not null and phones.mrp > 0
group by phones.brand, phones.model, phones.variant, phones.mrp
on conflict (slug) do nothing;

-- 4c. Create one product_variant per unique (brand+model+variant+mrp) combo
-- This groups phones by their spec combo
insert into public.product_variants (product_id, variant_name, mrp_bdt, buy_price_bdt, is_default, created_at, updated_at)
select
  p.id as product_id,
  coalesce(pv.variant_name, p.variant, p.name) as variant_name,
  coalesce(pv.mrp, p.price_bdt) as mrp_bdt,
  coalesce(pv.buy_price_bdt, p.cost_bdt) as buy_price_bdt,
  true as is_default,
  min(phones.created_at) as created_at,
  now() as updated_at
from public.phones
join public.products p on lower(p.name) = lower(phones.model)
  and p.variant = phones.variant
left join public.product_variants pv on pv.product_id = p.id
where phones.mrp is not null
group by p.id, pv.variant_name, pv.mrp, p.price_bdt, p.cost_bdt, p.variant, p.name
on conflict do nothing;

-- 4d. Create inventory_units for each phone (one per IMEI row)
-- Link each phone to a product_variant by matching product_id + variant_name
insert into public.inventory_units (variant_id, imei, buy_price_bdt, mrp_bdt, status, condition, created_at, updated_at)
select
  pv.id as variant_id,
  phones.imei,
  phones.buy_price as buy_price_bdt,
  phones.mrp as mrp_bdt,
  phones.status,
  coalesce(phones.condition, 'new'),
  phones.created_at,
  phones.updated_at
from public.phones
join public.products p on lower(p.name) = lower(phones.model)
  and (p.variant = phones.variant or p.variant is null)
join lateral (
  select pv2.id, pv2.variant_name
  from public.product_variants pv2
  where pv2.product_id = p.id
  order by pv2.is_default desc
  limit 1
) pv on true
where phones.imei is not null and phones.imei != ''
on conflict (imei) do nothing;

-- ============================================================
-- STEP 5: Storefront view: products_with_variants
-- ============================================================
-- This replaces products_with_meta for the storefront.
-- Each row = one product with an aggregated stock count across all variants.
-- Frontend queries this for listings and product cards.
create or replace view public.products_with_variants as
  select
    p.id,
    p.slug,
    p.name,
    p.variant         as base_variant,
    p.price_bdt       as base_price_bdt,
    p.compare_price_bdt,
    p.short_desc,
    p.long_desc,
    p.full_specs,
    p.is_featured,
    p.is_bestseller,
    p.condition,
    p.warranty_months,
    p.release_date,
    p.created_at,
    b.id    as brand_id,
    b.name  as brand_name,
    b.slug  as brand_slug,
    b.logo_url as brand_logo_url,

    -- Primary image from product_images (old path) or variant images
    coalesce(
      (select url from public.product_images pi where pi.product_id = p.id and pi.is_primary = true limit 1),
      (select image_url from public.product_variants pv2 where pv2.product_id = p.id and pv2.image_url is not null and pv2.is_active = true limit 1)
    ) as primary_image_url,

    -- All distinct colors across variants
    array_agg(distinct pv.color) filter (where pv.color is not null) as available_colors,
    -- All distinct RAM options
    array_agg(distinct pv.ram_gb) filter (where pv.ram_gb is not null) as available_ram,
    -- All distinct ROM options
    array_agg(distinct pv.rom_gb) filter (where pv.rom_gb is not null) as available_rom,

    -- Aggregated stock across all variants
    (
      select count(*)
      from public.inventory_units iu
      join public.product_variants pv2 on pv2.id = iu.variant_id
      where pv2.product_id = p.id and iu.status = 'in_stock'
    ) as total_stock_count,

    -- Cheapest MRP across variants
    (
      select min(pv2.mrp_bdt)
      from public.product_variants pv2
      where pv2.product_id = p.id and pv2.is_active = true
    ) as min_price_bdt,

    -- Highest MRP across variants
    (
      select max(pv2.mrp_bdt)
      from public.product_variants pv2
      where pv2.product_id = p.id and pv2.is_active = true
    ) as max_price_bdt,

    -- Cheapest in-stock unit
    (
      select pv2.mrp_bdt
      from public.product_variants pv2
      join public.inventory_units iu on iu.variant_id = pv2.id
      where pv2.product_id = p.id and pv2.is_active = true and iu.status = 'in_stock'
      order by pv2.mrp_bdt asc
      limit 1
    ) as in_stock_price_bdt

  from public.products p
  join public.brands b on b.id = p.brand_id
  left join public.product_variants pv on pv.product_id = p.id and pv.is_active = true
  where p.is_active = true and b.is_active = true
  group by p.id, b.id;

-- ============================================================
-- STEP 6: Variant detail view (per variant with stock per IMEI count)
-- ============================================================
create or replace view public.variants_with_stock as
  select
    pv.id,
    pv.product_id,
    pv.variant_name,
    pv.color,
    pv.ram_gb,
    pv.rom_gb,
    pv.sku,
    pv.mrp_bdt,
    pv.buy_price_bdt,
    pv.compare_price_bdt,
    pv.image_url,
    pv.is_default,
    pv.is_active,
    pv.created_at,
    p.name  as product_name,
    p.slug  as product_slug,
    b.name  as brand_name,
    b.slug  as brand_slug,
    p.full_specs,
    p.warranty_months,
    (
      select count(*)
      from public.inventory_units iu
      where iu.variant_id = pv.id and iu.status = 'in_stock'
    ) as stock_count,
    (
      select count(*)
      from public.inventory_units iu
      where iu.variant_id = pv.id
    ) as total_units
  from public.product_variants pv
  join public.products p on p.id = pv.product_id
  join public.brands b on b.id = p.brand_id;

-- ============================================================
-- STEP 7: updated_at triggers for new tables
-- ============================================================
create trigger product_variants_touch_updated_at
  before update on public.product_variants
  for each row execute function public.touch_updated_at();

create trigger inventory_units_touch_updated_at
  before update on public.inventory_units
  for each row execute function public.touch_updated_at();

-- ============================================================
-- STEP 8: Disable RLS on new tables
-- ============================================================
alter table public.product_variants disable row level security;
alter table public.inventory_units  disable row level security;

-- ============================================================
-- STEP 9: Grants
-- ============================================================
grant select on public.product_variants to anon, authenticated;
grant select on public.inventory_units  to anon, authenticated;
grant select on public.products_with_variants to anon, authenticated;
grant select on public.variants_with_stock  to anon, authenticated;

grant all on public.product_variants to authenticated;
grant all on public.inventory_units  to authenticated;

-- Also ensure old tables have correct grants
grant select on public.products_with_meta to anon, authenticated;

-- ============================================================
-- STEP 10: Mark migration complete
-- ============================================================
-- You now have:
--   brands           ← unchanged (Apple, Samsung, etc.)
--   products         ← the model-level product (iPhone 16 Pro Max)
--   product_variants ← color+RAM+ROM combos with pricing (256GB Black, 512GB Blue, etc.)
--   inventory_units  ← individual IMEI-level inventory
--   products_with_variants ← storefront view with aggregated stock + price range
--   variants_with_stock    ← per-variant stock count
--
-- Frontend changes needed (in subsequent files):
--   ProductPage.jsx        → variant selector (color → RAM → ROM → buy)
--   queries.js             → fetch from products_with_variants + variants_with_stock
--   ProductsPage.jsx       → list from products_with_variants
--   AdminProductsPage.jsx  ← NEW: create/edit product + manage variants
--   AdminInventoryPage.jsx ← updated: select product+variant, add IMEIs
-- ============================================================
