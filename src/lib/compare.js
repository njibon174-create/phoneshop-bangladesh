const STORAGE_KEY = 'phoneshop_compare_v1'
const MAX_ITEMS = 3

function load() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : []
  } catch {
    return []
  }
}

function save(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
}

// Module-level state — compare list is shared across all components
let items = load()
const listeners = new Set()

function notify() {
  for (const l of listeners) l(items)
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getItems() {
  return items
}

export function has(slug) {
  return items.some((x) => x.slug === slug)
}

export function add(product) {
  if (items.length >= MAX_ITEMS) return false
  if (items.some((x) => x.slug === product.slug)) return true
  items = [...items, {
    slug: product.slug,
    name: product.name,
    variant: product.variant,
    brand: product.brand,
    image: product.image,
    price_bdt: product.price_bdt,
    full_specs: product.full_specs || {},
  }]
  save(items)
  notify()
  return true
}

export function remove(slug) {
  items = items.filter((x) => x.slug !== slug)
  save(items)
  notify()
}

export function clear() {
  items = []
  save(items)
  notify()
}

export function getMaxItems() {
  return MAX_ITEMS
}
