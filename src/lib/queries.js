import { supabase } from './supabase'

/**
 * Fetch all active brands.
 * Returns: [{ id, name, slug, logo_url, ... }, ...]
 */
export async function fetchBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('id, name, slug, logo_url, description, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data || []
}

/**
 * Fetch featured products for homepage.
 * Uses products_with_variants view (aggregated from product_variants + inventory_units).
 */
export async function fetchFeaturedProducts(limit = 8) {
  const { data, error } = await supabase
    .from('products_with_variants')
    .select('*')
    .or('is_featured.eq.true,is_bestseller.eq.true')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

/**
 * Fetch all storefront products with optional brand filter.
 * Uses products_with_variants view.
 */
export async function fetchProducts({ brandSlug = null, limit = 100, offset = 0, inStockOnly = false } = {}) {
  let q = supabase
    .from('products_with_variants')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (brandSlug) q = q.eq('brand_slug', brandSlug)
  if (inStockOnly) q = q.gt('total_stock_count', 0)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

/**
 * Fetch products by brand slug.
 */
export async function fetchProductsByBrand(brandSlug, { limit = 50, offset = 0 } = {}) {
  return fetchProducts({ brandSlug, limit, offset })
}

/**
 * Fetch a single product by slug with all variants and specs.
 * Also fetches per-variant stock for the selector.
 */
export async function fetchProductBySlug(slug) {
  const { data: product, error } = await supabase
    .from('products_with_variants')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw error
  if (!product) return null

  // Fetch all active variants with stock info
  const { data: variants } = await supabase
    .from('variants_with_stock')
    .select('*')
    .eq('product_id', product.id)
    .eq('is_active', true)
    .order('mrp_bdt', { ascending: true })

  return {
    ...product,
    variants: variants || [],
    // Flatten full_specs from JSONB
    full_specs: product.full_specs || {},
    // Fallback image
    images: [],
  }
}

/**
 * Full-text search by name/variant/short_desc.
 */
export async function searchProducts(query, { limit = 30 } = {}) {
  const { data, error } = await supabase
    .from('products_with_variants')
    .select('*')
    .or(
      `name.ilike.%${query}%,short_desc.ilike.%${query}%`
    )
    .limit(limit)
  if (error) throw error
  return data || []
}

/**
 * Fetch deals (products with compare_at_price > price_bdt).
 */
export async function fetchDeals({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('products_with_variants')
    .select('*')
    .gt('min_price_bdt', 0)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []).filter((p) => (p.compare_price_bdt || 0) > (p.min_price_bdt || 0))
}

/**
 * Create an order from storefront. Each order item now references a specific
 * product_variant so we know exactly which RAM/ROM/color combo was ordered.
 */
export async function createOrder({ customer, items, deliveryMethod = 'home' }) {
  if (!items?.length) throw new Error('No items in order')

  // Drop invalid items first
  const validItems = items.filter((i) => i && (i.variant_id || i.slug))
  if (validItems.length !== items.length) {
    throw new Error(`${items.length - validItems.length} item(s) in your cart are no longer available. Please clear your cart and re-add the items.`)
  }

  // Fetch current prices from variants_with_stock using variant_id
  const variantIds = validItems.map((i) => i.variant_id).filter(Boolean)
  const productSlugs = validItems.filter((i) => !i.variant_id).map((i) => i.slug)

  let variantMap = new Map()
  if (variantIds.length) {
    const { data: variants, error: varErr } = await supabase
      .from('variants_with_stock')
      .select('id, product_id, variant_name, mrp_bdt, stock_count, product_name, ram_gb, rom_gb, color')
      .in('id', [...new Set(variantIds)])
    if (varErr) throw varErr
    for (const v of variants || []) variantMap.set(v.id, v)
  }

  // Also support slug lookup for legacy cart items
  if (productSlugs.length) {
    const { data: prods } = await supabase
      .from('products_with_variants')
      .select('id, slug, name')
      .in('slug', [...new Set(productSlugs)])
    for (const p of prods || []) variantMap.set(p.slug, { id: p.id, variant_name: p.name, mrp_bdt: 0, stock_count: 0 })
  }

  let subtotal = 0
  const orderItems = validItems.map((item) => {
    const variant = variantMap.get(item.variant_id || item.slug)
    if (!variant) {
      const name = item.name || item.slug || 'unknown'
      throw new Error(`"${name}" is not available. Please remove from cart and re-add.`)
    }

    const cartPrice = Number(item.unit_price_bdt != null ? item.unit_price_bdt : item.price_bdt)
    const storePrice = Number(variant.mrp_bdt)
    const unitPrice = Number.isFinite(storePrice) && storePrice > 0 ? storePrice
                     : Number.isFinite(cartPrice) && cartPrice > 0 ? cartPrice
                     : 0
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new Error(`Invalid price for "${item.name || item.slug || 'unknown'}". Please contact support.`)
    }

    if ((variant.stock_count || 0) <= 0) throw new Error(`${item.name} (${variant.variant_name}) is out of stock`)

    const lineTotal = unitPrice * item.quantity
    subtotal += lineTotal
    return {
      variant_id: variant.id || item.variant_id,
      product_name: item.name,
      product_variant: variant.variant_name || item.variant || '',
      unit_price_bdt: unitPrice,
      quantity: item.quantity,
      line_total_bdt: lineTotal,
    }
  })

  const shipping = deliveryMethod === 'pickup' ? 0 : 60
  const total = subtotal + shipping
  const orderNumber = await generateOrderNumber()

  const orderRow = {
    order_number: orderNumber,
    customer_name: customer.name,
    customer_phone: customer.phone,
    customer_email: customer.email || null,
    shipping_address: customer.address,
    shipping_city: customer.city,
    shipping_thana: customer.thana || null,
    shipping_postcode: customer.postcode || null,
    shipping_notes: customer.notes || null,
    subtotal_bdt: subtotal,
    shipping_bdt: shipping,
    total_bdt: total,
    payment_method: 'cod',
    payment_status: 'pending',
    payment_ref: null,
    delivery_method: deliveryMethod,
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderRow)
    .select()
    .single()
  if (orderError) throw orderError

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems.map((i) => ({ ...i, order_id: order.id })))
  if (itemsError) {
    console.warn('Order items insert failed:', itemsError.message)
  }

  return { order, orderItems }
}

/**
 * Generate order number like BD-20260812-0001
 */
async function generateOrderNumber() {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const { data, error } = await supabase
    .from('orders')
    .select('order_number')
    .like('order_number', `BD-${dateStr}-%`)
    .order('order_number', { ascending: false })
    .limit(1)
  if (error) throw error
  const lastSeq = data?.[0]?.order_number
    ? parseInt(data[0].order_number.split('-')[2], 10)
    : 0
  const nextSeq = String(lastSeq + 1).padStart(4, '0')
  return `BD-${dateStr}-${nextSeq}`
}
