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
 * Now uses the unified storefront_products view (aggregated from phones).
 */
export async function fetchFeaturedProducts(limit = 8) {
  const { data, error } = await supabase
    .from('storefront_products')
    .select('*')
    .or('is_featured.eq.true,is_bestseller.eq.true')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

/**
 * Fetch all storefront products with optional brand filter.
 */
export async function fetchProducts({ brandSlug = null, limit = 100, offset = 0, inStockOnly = false } = {}) {
  let q = supabase
    .from('storefront_products')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (brandSlug) q = q.eq('brand_slug', brandSlug)
  if (inStockOnly) q = q.eq('in_stock', true)
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
 * Fetch a single product by slug with all specs and inventory details.
 */
export async function fetchProductBySlug(slug) {
  const { data: product, error } = await supabase
    .from('storefront_products')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw error
  if (!product) return null

  // For storefront: get all in_stock units for "available" check
  const { data: units } = await supabase
    .from('phones')
    .select('id, imei, status, mrp, buy_price')
    .eq('brand', product.brand)
    .eq('model', product.model)
    .eq('variant', product.variant)
    .order('created_at', { ascending: false })

  return {
    ...product,
    units: units || [],
    // Flatten specs into a 'full_specs' object for compatibility with existing UI
    full_specs: product.specs || {},
    images: product.image_url ? [{ id: '1', url: product.image_url, alt_text: product.name, position: 1, is_primary: true }] : [],
    specs: Object.entries(product.specs || {}).map(([k, v], i) => ({ spec_key: k, display_value: String(v), sort_order: i })),
  }
}

/**
 * Full-text search by name/variant/short_desc.
 */
export async function searchProducts(query, { limit = 30 } = {}) {
  const { data, error } = await supabase
    .from('storefront_products')
    .select('*')
    .or(
      `name.ilike.%${query}%,model.ilike.%${query}%,variant.ilike.%${query}%,short_desc.ilike.%${query}%`
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
    .from('storefront_products')
    .select('*')
    .gt('compare_at_price', 0)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data || []).filter((p) => p.compare_at_price > (p.price_bdt || 0))
}

/**
 * Create an order from storefront. Each order item now references a specific
 * phone unit (cheapest in_stock unit) so we know exactly which IMEI was sold.
 */
export async function createOrder({ customer, items, deliveryMethod = 'home' }) {
  if (!items?.length) throw new Error('No items in order')

  // Fetch current prices from storefront_products view
  const slugs = items.map((i) => i.slug)
  const { data: products, error: prodError } = await supabase
    .from('storefront_products')
    .select('id, name, model, variant, price_bdt, brand, slug, stock_count, cheapest_unit_id')
    .in('slug', slugs)
  if (prodError) throw prodError

  const priceMap = new Map(products.map((p) => [p.slug, p]))

  let subtotal = 0
  const orderItems = items.map((item) => {
    const product = priceMap.get(item.slug)
    if (!product) throw new Error(`Product not found`)
    if (product.stock_count <= 0) throw new Error(`${product.name} is out of stock`)
    if (item.quantity > product.stock_count) throw new Error(`Only ${product.stock_count} units of ${product.name} available`)
    const unitPrice = product.price_bdt
    const lineTotal = unitPrice * item.quantity
    subtotal += lineTotal
    return {
      product_id: product.cheapest_unit_id || product.id,
      product_name: product.name,
      product_variant: product.variant,
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
  if (itemsError) throw itemsError

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
