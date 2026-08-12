-- Migration: Add restock_requests table
-- Users request notification when an out-of-stock phone is back in stock.
-- The shop admin views these in the admin panel and contacts the user.

CREATE TABLE IF NOT EXISTS public.restock_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL,
  product_name text,
  product_brand text,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'fulfilled', 'cancelled')),
  notified_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_restock_requests_product_slug ON public.restock_requests(product_slug);
CREATE INDEX IF NOT EXISTS idx_restock_requests_status ON public.restock_requests(status);
CREATE INDEX IF NOT EXISTS idx_restock_requests_created_at ON public.restock_requests(created_at DESC);

-- Disable RLS (admin-only data, public can insert their own requests)
ALTER TABLE public.restock_requests DISABLE ROW LEVEL SECURITY;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at_restock()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_restock_updated_at ON public.restock_requests;
CREATE TRIGGER trg_restock_updated_at
  BEFORE UPDATE ON public.restock_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_restock();
