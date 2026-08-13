import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'phoneshop_wishlist_v1'

function load() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function useWishlist() {
  const [items, setItems] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch {}
  }, [items])

  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY) {
        try { setItems(e.newValue ? JSON.parse(e.newValue) : []) } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Use variant_id || slug as unique key so different RAM/ROM combos are separate
  const has = useCallback((id) => items.some((x) => (x.variant_id || x.slug) === id), [items])

  const toggle = useCallback((product) => {
    const key = product.variant_id || product.slug
    setItems((prev) => {
      if (prev.some((x) => (x.variant_id || x.slug) === key)) {
        return prev.filter((x) => (x.variant_id || x.slug) !== key)
      }
      return [...prev, {
        slug: product.slug,
        variant_id: product.variant_id || null,
        name: product.name,
        variant: product.variant,
        brand: product.brand,
        image: product.image,
        price_bdt: product.price_bdt,
        added_at: Date.now(),
      }]
    })
  }, [])

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((x) => (x.variant_id || x.slug) !== id))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  return { items, count: items.length, has, toggle, remove, clear }
}
