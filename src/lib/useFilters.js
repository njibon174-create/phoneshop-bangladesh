import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from './supabase'

/**
 * useProductFilters — fetches from storefront_products view with filters.
 * Filters: brand_slug, price_min, price_max, ram_gb (array), storage_gb (array), condition, sort.
 * Syncs to URL query params so filters are shareable.
 */
export function useProductFilters() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)

  const filters = useMemo(() => ({
    brand: params.get('brand') || '',
    priceMin: Number(params.get('price_min')) || 0,
    priceMax: Number(params.get('price_max')) || 0,
    ram: params.getAll('ram').map(Number).filter(Boolean),
    storage: params.getAll('storage').map(Number).filter(Boolean),
    condition: params.get('condition') || '',
    sort: params.get('sort') || 'newest',
    q: params.get('q') || '',
  }), [params])

  const setFilter = useCallback((key, value) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value === '' || value === 0 || (Array.isArray(value) && value.length === 0) || value == null) {
        next.delete(key)
      } else if (Array.isArray(value)) {
        next.delete(key)
        value.forEach((v) => next.append(key, v))
      } else {
        next.set(key, value)
      }
      return next
    }, { replace: true })
  }, [setParams])

  const clearAll = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true })
  }, [setParams])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('storefront_products')
          .select('*', { count: 'exact' })

        // Brand filter
        if (filters.brand) {
          query = query.eq('brand_slug', filters.brand)
        }
        // Price range
        if (filters.priceMin > 0) query = query.gte('price_bdt', filters.priceMin)
        if (filters.priceMax > 0) query = query.lte('price_bdt', filters.priceMax)
        // Condition
        if (filters.condition) query = query.eq('condition', filters.condition)
        // Search query
        if (filters.q) {
          query = query.or(
            `name.ilike.%${filters.q}%,variant.ilike.%${filters.q}%,short_desc.ilike.%${filters.q}%`
          )
        }

        // Sort
        switch (filters.sort) {
          case 'price_asc': query = query.order('price_bdt', { ascending: true }); break
          case 'price_desc': query = query.order('price_bdt', { ascending: false }); break
          case 'newest': query = query.order('created_at', { ascending: false }); break
          case 'oldest': query = query.order('created_at', { ascending: true }); break
          default: query = query.order('created_at', { ascending: false })
        }

        query = query.limit(60)

        const { data, count, error: qError } = await query
        if (qError) throw qError

        // RAM / storage filtering — done client-side because they're in product_specs.
        // (For production: denormalize ram_gb/storage_gb into products table for fast SQL filtering.)
        let filtered = data || []
        if (filters.ram.length) {
          filtered = filtered.filter((p) => filters.ram.some((r) => matchRam(p, r)))
        }
        if (filters.storage.length) {
          filtered = filtered.filter((p) => filters.storage.some((s) => matchStorage(p, s)))
        }

        if (!cancelled) {
          setProducts(filtered)
          setTotalCount(count || 0)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [filters])

  return { products, loading, error, totalCount, filters, setFilter, clearAll }
}

// Helpers — extract RAM/storage from full_specs JSONB
function matchRam(p, target) {
  const ram = p.full_specs?.ram_gb
  return Number(ram) === target
}
function matchStorage(p, target) {
  const storage = p.full_specs?.storage_gb
  return Number(storage) === target
}
