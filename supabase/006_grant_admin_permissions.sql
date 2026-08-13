-- ===================================================================
-- Grant full admin permissions to anon role
-- ===================================================================
-- This migration enables the admin panel (which uses the anon key)
-- to perform ALL CRUD operations on every table.
-- Run this ONCE in Supabase SQL Editor.
-- ===================================================================

-- Grant CRUD on the admin tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brands          TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products        TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_specs   TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images  TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phones          TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales           TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credits         TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.credit_payments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_transactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_transaction_edits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders          TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items     TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings   TO anon;

-- Verify
SELECT grantee, table_name, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
  AND table_schema = 'public'
GROUP BY grantee, table_name
ORDER BY table_name;
