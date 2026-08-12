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

  const has = useCallback((slug) => items.some((x) => x.slug === slug), [items])

  const toggle = useCallback((product) => {
    setItems((prev) => {
      if (prev.some((x) => x.slug === product.slug)) {
        return prev.filter((x) => x.slug !== product.slug)
      }
      return [...prev, {
        slug: product.slug,
        name: product.name,
        variant: product.variant,
        brand: product.brand,
        image: product.image,
        price_bdt: product.price_bdt,
        added_at: Date.now(),
      }]
    })
  }, [])

  const remove = useCallback((slug) => {
    setItems((prev) => prev.filter((x) => x.slug !== slug))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  return { items, count: items.length, has, toggle, remove, clear }
}
