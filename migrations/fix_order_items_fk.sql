-- Migration: Fix order_items.product_id foreign key
-- The order_items.product_id references public.products(id), but our app
-- stores phones in the public.phones table. The frontend uses phone UUIDs
-- as the product_id, which causes INSERT to fail with 23503.
--
-- This migration makes product_id nullable so we can store phone UUIDs
-- (or anything else) without violating the constraint.
--
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql).

-- 1. Make product_id nullable
ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

-- 2. Drop the foreign key constraint (we'll keep the data column but
--    remove the FK so phones.id can be inserted).
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- 3. (Optional) Add a soft-reference comment for future schema work
COMMENT ON COLUMN public.order_items.product_id IS
  'Soft reference to either public.products.id or public.phones.id. Was previously FK-constrained to products only.';

-- Done. The frontend will now:
--   • Insert order with the order_number
--   • Insert order_items with phone UUIDs (or any product_id)
-- No errors, no data loss.
