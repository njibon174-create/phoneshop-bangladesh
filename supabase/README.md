# Supabase Setup — PhoneShop BD

> Schema, seed, and operational notes for the backend. **Run via SQL Editor manually** — never run via the frontend.

## Files

Run in this order:

| File | Purpose |
|---|---|
| `001_schema.sql` | Creates all tables, indexes, view, triggers, RLS-off, grants |
| `002_seed_brands.sql` | Inserts the 10 brands we currently carry |
| `003_seed_products_sample.sql` | Inserts 4 sample products (Apple, Samsung, Xiaomi, Walton) for testing |

## How to run

1. Open Supabase dashboard → **SQL Editor** → **New query**
2. Paste contents of `001_schema.sql` → **Run** (or press Cmd/Ctrl + Enter)
3. New query → paste `002_seed_brands.sql` → **Run**
4. New query → paste `003_seed_products_sample.sql` → **Run**

If you re-run, the schema drops all tables first (safe for development).

## Tables

| Table | Purpose |
|---|---|
| `brands` | Phone brands (Apple, Samsung, ...) |
| `products` | SKU-level products (iPhone 15 Pro Max 256GB NT) |
| `product_specs` | Indexable key/value specs for filtering (RAM, storage, ...) |
| `product_images` | Multiple images per product with primary flag |
| `inventory` | Stock count per product |
| `orders` | Customer orders (COD / bKash / Nagad) |
| `order_items` | Line items, price snapshotted at purchase |

## View

`products_with_meta` — joins products + brand + primary image + stock status. **This is what the frontend queries.**

```sql
-- Sample query
select * from products_with_meta
where is_featured = true
order by created_at desc
limit 12;
```

## RLS / Access

- **RLS is disabled** on all tables (per project rule)
- **`anon` role** can `SELECT` from public read tables + view, and `INSERT` into orders/order_items (for checkout)
- **`authenticated` role** has full access (will be used by the admin panel in Step 6 via the service key)
- **Service key** is used by the backend for sensitive operations — never expose in frontend

## Filterable specs

Use `product_specs` for fast range filters:

```sql
-- Find phones with RAM >= 8GB, storage >= 128GB, under 50000 BDT
select p.*
from products p
where p.price_bdt < 50000
  and exists (select 1 from product_specs where product_id = p.id and spec_key='ram_gb' and spec_value_num >= 8)
  and exists (select 1 from product_specs where product_id = p.id and spec_key='storage_gb' and spec_value_num >= 128)
order by p.price_bdt;
```

## Full-text search

`products.search_text` is a generated tsvector column. Use Postgres full-text:

```sql
select * from products
where search_text @@ plainto_tsquery('simple', 'iphone pro');
```

## Adding new products

Once the admin panel (Step 6) is ready, most products will be added through there. For now, use a SQL snippet like:

```sql
insert into products (brand_id, slug, name, price_bdt, full_specs)
select id, 'pixel-9-pro-256', 'Pixel 9 Pro', 119999, '{"ram_gb": 16}'::jsonb
from brands where slug = 'walton'; -- adjust brand
```

## Image storage

Production images should go in **Supabase Storage** (bucket `product-images`):

```sql
-- After uploading to Storage, get URL and insert:
update product_images
set url = 'https://<project>.supabase.co/storage/v1/object/public/product-images/iphone-15-pro-max.webp'
where product_id = '...';
```

For the placeholder images currently in seed data, we're using Pexels URLs — replace these with real OEM press kit images uploaded to Supabase Storage.

## Conventions

- Money stored as integer `bdt` (no decimals — BDT is small enough)
- All timestamps are `timestamptz` in UTC
- Slugs are URL-safe (`iphone-15-pro-max-256gb-natural-titanium`)
- `is_active` flag instead of soft-delete (faster, reversible)
- `condition` is one of `new` / `refurbished` / `used`
- Specs stored two ways: `product_specs` for filters, `full_specs` JSONB for display
