import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'phoneshop_cart_v1'

const SHIPPING_HOME = 60
const SHIPPING_PICKUP = 0

function loadCart() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Filter out invalid items (no slug, no name, no quantity) — these
    // can't be ordered and would otherwise break createOrder.
    const filtered = parsed.filter((it) => it && it.slug && it.name && it.quantity > 0)
    if (filtered.length !== parsed.length) {
      // Persist the cleaned cart so we don't trigger the error again.
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered)) } catch {}
      if (typeof console !== 'undefined') {
        console.warn(`[cart] Removed ${parsed.length - filtered.length} invalid item(s) from cart`)
      }
    }
    return filtered
  } catch {
    return []
  }
}

function saveCart(items) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  // Persist on every change
  useEffect(() => {
    saveCart(items)
  }, [items])

  // Cross-tab sync
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY) {
        try {
          setItems(e.newValue ? JSON.parse(e.newValue) : [])
        } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((product, qty = 1) => {
    // Guard: do not add items without a slug — they can't be ordered.
    if (!product || !product.slug) {
      if (typeof console !== 'undefined') {
        console.warn('[cart] add() rejected — product has no slug', product)
      }
      return false
    }
    setItems((prev) => {
      const i = prev.findIndex((x) => x.slug === product.slug)
      if (i >= 0) {
        const next = [...prev]
        next[i] = { ...next[i], quantity: next[i].quantity + qty }
        return next
      }
      return [
        ...prev,
        {
          id: product.id || product.slug,
          slug: product.slug,
          name: product.name,
          variant: product.variant,
          brand: product.brand,
          image: product.image,
          unit_price_bdt: product.unit_price_bdt != null ? product.unit_price_bdt : product.price_bdt,
          quantity: qty,
        },
      ]
    })
    return true
  }, [])

  const remove = useCallback((slug) => {
    setItems((prev) => prev.filter((x) => x.slug !== slug))
  }, [])

  const setQuantity = useCallback((slug, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((x) => x.slug !== slug))
      return
    }
    setItems((prev) => prev.map((x) => (x.slug === slug ? { ...x, quantity: qty } : x)))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const itemCount = items.reduce((n, it) => n + it.quantity, 0)
  const subtotal = items.reduce((n, it) => n + it.unit_price_bdt * it.quantity, 0)

  const value = {
    items,
    itemCount,
    subtotal,
    add,
    remove,
    setQuantity,
    clear,
    SHIPPING_HOME,
    SHIPPING_PICKUP,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

// Cart item shape:
// { id, slug, name, variant, brand, image, unit_price_bdt, quantity }
export function formatPrice(bdt) {
  if (bdt == null) return '—'
  return '৳' + Number(bdt).toLocaleString('en-IN')
}
