-- ============================================================
-- PhoneShop BD — Step 2: Brand Seed
-- ============================================================
-- Run this AFTER 001_schema.sql
-- Inserts the 10 brands we currently carry.
-- `logo_url` left empty — add real URLs in admin (Step 6) or
-- by uploading to Supabase Storage and updating here.
-- ============================================================

insert into public.brands (name, slug, description, sort_order) values
  ('Apple',      'apple',      'iPhone lineup — new and certified refurbished.', 1),
  ('Samsung',    'samsung',    'Galaxy S, Z, A, M series — official Bangladesh stock.', 2),
  ('Xiaomi',     'xiaomi',     'Mi, Redmi, Poco flagship and mid-range smartphones.', 3),
  ('Vivo',       'vivo',       'Vivo Y, V, X series — camera-focused smartphones.', 4),
  ('Oppo',       'oppo',       'Oppo A, F, Reno series — sleek and reliable.', 5),
  ('Realme',     'realme',     'Realme C, Narzo, GT series — performance budget.', 6),
  ('Infinix',    'infinix',    'Infinix Hot, Note, Zero — big battery, low price.', 7),
  ('Symphony',   'symphony',   'Bangladesh-built smartphones, full local warranty.', 8),
  ('Walton',     'walton',     'Primo, Nexg, Tecra series — local brand.', 9),
  ('itel',       'itel',       'itel A, S, Vision series — entry-level and feature phones.', 10)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Verify
select slug, name, sort_order from public.brands order by sort_order;
