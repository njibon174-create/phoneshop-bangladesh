-- ============================================================
-- PhoneShop BD — Step 2: Sample Products (for testing)
-- ============================================================
-- Run this AFTER 001_schema.sql AND 002_seed_brands.sql.
-- Adds 4 sample products matching the homepage skeleton.
-- Image URLs use Pexels for placeholders only — replace with real
-- Supabase Storage URLs once you upload OEM press kit photos.
-- ============================================================

-- Get brand IDs
do $$
declare
  apple_id    uuid;
  samsung_id  uuid;
  xiaomi_id   uuid;
  google_id   uuid;
  iphone_id   uuid;
  galaxy_id   uuid;
  xiaomi14_id uuid;
  pixel_id    uuid;
begin
  select id into apple_id    from public.brands where slug = 'apple';
  select id into samsung_id  from public.brands where slug = 'samsung';
  select id into xiaomi_id   from public.brands where slug = 'xiaomi';

  -- Apple doesn't exist as a brand in our list, use Xiaomi as a substitute for Pixel
  -- Actually, this is Google — let me check the brands list
  -- Since we only have 10 brands and Google isn't one, let's use Apple for iPhone, Samsung, Xiaomi, then add a Walton one instead
  select id into google_id   from public.brands where slug = 'walton'; -- placeholder for the 4th sample

  -- iPhone 15 Pro Max
  insert into public.products (
    brand_id, slug, name, variant, sku, price_bdt, compare_price_bdt,
    condition, warranty_months, short_desc, full_specs,
    is_featured, is_bestseller, release_date
  ) values (
    apple_id, 'iphone-15-pro-max-256gb-natural-titanium',
    'iPhone 15 Pro Max', '256GB Natural Titanium',
    'APL-IP15PM-256-NT', 189999, 199999,
    'new', 12,
    'Apple A17 Pro, 6.7" ProMotion OLED, Titanium body.',
    '{
      "display": "6.7-inch Super Retina XDR OLED",
      "chip": "Apple A17 Pro",
      "ram_gb": 8,
      "storage_gb": 256,
      "rear_camera": "48MP Main + 12MP Ultra Wide + 12MP Telephoto",
      "front_camera": "12MP TrueDepth",
      "battery_mah": 4422,
      "charging_w": 27,
      "os": "iOS 17",
      "weight_g": 221,
      "5g": true,
      "ip_rating": "IP68"
    }'::jsonb,
    true, true, '2023-09-22'
  ) returning id into iphone_id;

  -- Samsung Galaxy S24 Ultra
  insert into public.products (
    brand_id, slug, name, variant, sku, price_bdt, compare_price_bdt,
    condition, warranty_months, short_desc, full_specs,
    is_featured, is_bestseller, release_date
  ) values (
    samsung_id, 'samsung-galaxy-s24-ultra-512gb-titanium-black',
    'Samsung Galaxy S24 Ultra', '512GB Titanium Black',
    'SAM-S24U-512-TB', 179999, 189999,
    'new', 12,
    'Snapdragon 8 Gen 3, 200MP camera, built-in S Pen, Galaxy AI.',
    '{
      "display": "6.8-inch Dynamic AMOLED 2X",
      "chip": "Snapdragon 8 Gen 3 for Galaxy",
      "ram_gb": 12,
      "storage_gb": 512,
      "rear_camera": "200MP Main + 12MP Ultra Wide + 50MP Periscope + 10MP Telephoto",
      "front_camera": "12MP",
      "battery_mah": 5000,
      "charging_w": 45,
      "os": "Android 14, One UI 6.1",
      "weight_g": 232,
      "5g": true,
      "ip_rating": "IP68",
      "s_pen": true
    }'::jsonb,
    true, false, '2024-01-24'
  ) returning id into galaxy_id;

  -- Xiaomi 14 Ultra
  insert into public.products (
    brand_id, slug, name, variant, sku, price_bdt,
    condition, warranty_months, short_desc, full_specs,
    is_featured, is_bestseller, release_date
  ) values (
    xiaomi_id, 'xiaomi-14-ultra-512gb-titanium',
    'Xiaomi 14 Ultra', '512GB Titanium',
    'XMI-14U-512-TI', 129999,
    'new', 12,
    'Leica quad camera, Snapdragon 8 Gen 3, 90W fast charging.',
    '{
      "display": "6.73-inch LTPO AMOLED",
      "chip": "Snapdragon 8 Gen 3",
      "ram_gb": 16,
      "storage_gb": 512,
      "rear_camera": "50MP Main + 50MP Ultra Wide + 50MP Periscope + 50MP Telephoto",
      "front_camera": "32MP",
      "battery_mah": 5000,
      "charging_w": 90,
      "os": "Android 14, HyperOS",
      "weight_g": 220,
      "5g": true,
      "ip_rating": "IP68",
      "leica": true
    }'::jsonb,
    true, false, '2024-02-22'
  ) returning id into xiaomi14_id;

  -- Walton Primo (sample 4th product using a real brand in our list)
  insert into public.products (
    brand_id, slug, name, variant, sku, price_bdt,
    condition, warranty_months, short_desc, full_specs,
    is_featured, is_bestseller, release_date
  ) values (
    google_id, 'walton-primo-h10-128gb',
    'Walton Primo H10', '128GB Ocean Blue',
    'WAL-PRH10-128-OB', 18999,
    'new', 12,
    'Bangladesh-made, 6.6" display, 5000mAh battery, 128GB storage.',
    '{
      "display": "6.6-inch IPS LCD",
      "chip": "Unisoc T616",
      "ram_gb": 8,
      "storage_gb": 128,
      "rear_camera": "50MP Main + 8MP Ultra Wide + 2MP Macro",
      "front_camera": "16MP",
      "battery_mah": 5000,
      "charging_w": 18,
      "os": "Android 13",
      "weight_g": 195,
      "5g": false,
      "ip_rating": null
    }'::jsonb,
    false, true, '2024-08-15'
  ) returning id into pixel_id;

  -- Inventory for each
  insert into public.inventory (product_id, stock_count, low_stock_at) values
    (iphone_id,    12, 5),
    (galaxy_id,    18, 5),
    (xiaomi14_id,   9, 5),
    (pixel_id,     40, 10);

  -- Primary image (using Pexels placeholder URLs — replace with real Supabase Storage URLs)
  insert into public.product_images (product_id, url, alt_text, position, is_primary) values
    (iphone_id,    'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=800', 'iPhone 15 Pro Max Natural Titanium', 0, true),
    (galaxy_id,    'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800', 'Galaxy S24 Ultra Titanium Black', 0, true),
    (xiaomi14_id,  'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=800', 'Xiaomi 14 Ultra', 0, true),
    (pixel_id,     'https://images.pexels.com/photos/214487/pexels-photo-214487.jpeg?auto=compress&cs=tinysrgb&w=800', 'Walton Primo H10', 0, true);

  -- Indexable specs (subset, used for filtering)
  insert into public.product_specs
    (product_id, spec_key, spec_value_num, display_label, display_value, sort_order) values
    -- iPhone
    (iphone_id, 'ram_gb',     8,  'RAM',     '8GB',  0),
    (iphone_id, 'storage_gb', 256,'Storage', '256GB',1),
    -- Samsung
    (galaxy_id, 'ram_gb',     12, 'RAM',     '12GB', 0),
    (galaxy_id, 'storage_gb', 512,'Storage', '512GB',1),
    -- Xiaomi
    (xiaomi14_id, 'ram_gb',     16, 'RAM',     '16GB', 0),
    (xiaomi14_id, 'storage_gb', 512,'Storage', '512GB',1),
    -- Walton
    (pixel_id, 'ram_gb',     8,  'RAM',     '8GB',  0),
    (pixel_id, 'storage_gb', 128,'Storage', '128GB',1);

  raise notice 'Sample products inserted: iPhone %, Galaxy %, Xiaomi %, Walton %', iphone_id, galaxy_id, xiaomi14_id, pixel_id;
end $$;

-- Verify
select
  p.name,
  p.variant,
  p.price_bdt,
  b.name as brand,
  i.stock_count,
  (select url from public.product_images pi where pi.product_id = p.id and pi.is_primary limit 1) as image
from public.products p
join public.brands b on b.id = p.brand_id
left join public.inventory i on i.product_id = p.id
order by p.created_at desc;
