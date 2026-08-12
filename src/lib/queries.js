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
 * Fetch featured products (for homepage hero section).
 */
export async function fetchFeaturedProducts(limit = 8) {
  const { data, error } = await supabase
    .from('products_with_meta')
    .select('*')
    .or('is_featured.eq.true,is_bestseller.eq.true')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

/**
 * Fetch products by brand slug.
 */
export async function fetchProductsByBrand(brandSlug, { limit = 50, offset = 0 } = {}) {
  const { data, error } = await supabase
    .from('products_with_meta')
    .select('*')
    .eq('brand_slug', brandSlug)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (error) throw error
  return data || []
}

/**
 * Fetch a single product by slug with all specs and images.
 */
export async function fetchProductBySlug(slug) {
  const { data: product, error } = await supabase
    .from('products_with_meta')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) throw error
  if (!product) return null

  const [{ data: specs }, { data: images }] = await Promise.all([
    supabase
      .from('product_specs')
      .select('id, spec_key, display_label, display_value, sort_order')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('product_images')
      .select('id, url, alt_text, position, is_primary')
      .eq('product_id', product.id)
      .order('position', { ascending: true }),
  ])

  return { ...product, specs: specs || [], images: images || [] }
}

/**
 * Full-text search by name/variant/short_desc.
 */
export async function searchProducts(query, { limit = 30 } = {}) {
  const { data, error } = await supabase
    .from('products_with_meta')
    .select('*')
    .or(
      `name.ilike.%${query}%,variant.ilike.%${query}%,short_desc.ilike.%${query}%`
    )
    .limit(limit)
  if (error) throw error
  return data || []
}

/**
 * Create an order + order items. Returns the order_number.
 * Caller provides: customer info, items [{ product_id, quantity }], delivery method.
 * Prices are snapshotted from the DB at insert time (don't trust client prices).
 * Payment is COD only. Shipping is free for pickup, 60 BDT for home delivery.
 */
export async function createOrder({ customer, items, deliveryMethod = 'home' }) {
  if (!items?.length) throw new Error('No items in order')

  // Fetch current prices to snapshot
  const productIds = items.map((i) => i.product_id)
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select('id, name, variant, price_bdt')
    .in('id', productIds)
  if (prodError) throw prodError

  const priceMap = new Map(products.map((p) => [p.id, p]))

  let subtotal = 0
  const orderItems = items.map((item) => {
    const product = priceMap.get(item.product_id)
    if (!product) throw new Error(`Product ${item.product_id} not found`)
    const unitPrice = product.price_bdt
    const lineTotal = unitPrice * item.quantity
    subtotal += lineTotal
    return {
      product_id: item.product_id,
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
 * Reads max sequence from existing orders for today.
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
