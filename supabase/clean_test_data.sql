-- ===================================================================
-- Cleanup leftover test orders from BD-TEST-*, BD-REAL-*, BD-20260812-*
-- Run this once to remove any leftover test data before running the seed.
-- ===================================================================

DELETE FROM public.order_items WHERE order_id IN (
  SELECT id FROM public.orders
  WHERE order_number LIKE 'BD-TEST-%'
     OR order_number LIKE 'BD-REAL-%'
);

DELETE FROM public.orders
WHERE order_number LIKE 'BD-TEST-%'
   OR order_number LIKE 'BD-REAL-%';

-- Verify
SELECT 'orders remaining' as label, COUNT(*) as count FROM public.orders;
