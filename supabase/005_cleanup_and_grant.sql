-- ===================================================================
-- Clean up leftover test orders + Grant DELETE permission for future
-- ===================================================================
-- Run this ONCE in Supabase SQL Editor to:
--   1. Delete all BD-TEST-*, BD-REAL-*, BD-20260812-*, BD-TEMP-* orders
--   2. Grant anon DELETE permission on orders, order_items, brands
--   3. Create a SECURITY DEFINER function for future use
-- ===================================================================

-- Step 1: Delete the test orders
DELETE FROM public.order_items WHERE order_id IN (
  SELECT id FROM public.orders
  WHERE order_number LIKE 'BD-TEST-%'
     OR order_number LIKE 'BD-REAL-%'
     OR order_number LIKE 'BD-20260812-%'
     OR order_number LIKE 'BD-TEMP-%'
);

DELETE FROM public.orders
WHERE order_number LIKE 'BD-TEST-%'
   OR order_number LIKE 'BD-REAL-%'
   OR order_number LIKE 'BD-20260812-%'
   OR order_number LIKE 'BD-TEMP-%';

-- Step 2: Create a SECURITY DEFINER function that anon can call to delete orders
CREATE OR REPLACE FUNCTION public.admin_delete_orders(pattern text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.order_items WHERE order_id IN (
    SELECT id FROM public.orders
    WHERE pattern IS NULL OR order_number LIKE pattern
  );
  DELETE FROM public.orders
  WHERE pattern IS NULL OR order_number LIKE pattern;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_orders(text) TO anon, authenticated;

-- Step 3: Grant anon DELETE permission on key tables so the admin UI works
GRANT DELETE ON public.orders TO anon;
GRANT DELETE ON public.order_items TO anon;
GRANT DELETE ON public.brands TO anon;
GRANT UPDATE ON public.orders TO anon;
GRANT UPDATE ON public.order_items TO anon;
GRANT UPDATE ON public.brands TO anon;

-- Verify
SELECT 'orders remaining' AS label, COUNT(*) AS count FROM public.orders;
SELECT 'order_items remaining' AS label, COUNT(*) AS count FROM public.order_items;
