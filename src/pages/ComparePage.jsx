import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, X, GitCompare } from 'lucide-react'
import { fetchProductBySlug } from '../lib/queries'
import {
  remove as compareRemove,
  getItems as getCompareItems,
  subscribe as compareSubscribe,
  getMaxItems,
} from '../lib/compare'

function formatPrice(bdt) {
  if (bdt == null) return '—'
  return '৳' + Number(bdt).toLocaleString('en-IN')
}

const SPEC_ROWS = [
  { key: 'display', label: 'Display' },
  { key: 'chip', label: 'Processor' },
  { key: 'ram_gb', label: 'RAM', format: (v) => `${v} GB` },
  { key: 'storage_gb', label: 'Storage', format: (v) => `${v} GB` },
  { key: 'rear_camera', label: 'Main Camera' },
  { key: 'front_camera', label: 'Selfie Camera' },
  { key: 'battery_mah', label: 'Battery', format: (v) => `${v} mAh` },
  { key: 'charging_w', label: 'Charging', format: (v) => `${v}W` },
  { key: 'os', label: 'OS' },
  { key: 'weight_g', label: 'Weight', format: (v) => `${v} g` },
  { key: 'ip_rating', label: 'IP Rating' },
  { key: '5g', label: '5G', format: (v) => (v ? 'Yes' : 'No') },
]

function pickSpec(specs, key) {
  if (!specs) return null
  const v = specs[key]
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

function highlightDifferences(rows) {
  // For each spec row, mark whether all values are equal (highlight if not)
  return rows.map((row) => {
    const values = rows.reduce((acc, r) => ({ ...acc, [r.key]: r.value }), {})
    return row
  })
}

function bestPerRow(specsList, key) {
  // For numeric specs, mark which phone has best value (for battery/storage/ram)
  const NUMERIC_HIGHER_BETTER = ['ram_gb', 'storage_gb', 'battery_mah', 'charging_w']
  if (!NUMERIC_HIGHER_BETTER.includes(key)) return null
  const nums = specsList.map((s) => Number(s?.[key])).filter((n) => !isNaN(n))
  if (nums.length < 2) return null
  return Math.max(...nums)
}

export function ComparePage() {
  const [params, setParams] = useSearchParams()
  const compareItems = useSyncExternalStore(compareSubscribe, getCompareItems, getCompareItems)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  // Derive active slugs: URL > localStorage
  const urlSlugs = params.getAll('p')
  const localSlugs = compareItems.map((it) => it.slug)
  const slugs = urlSlugs.length ? urlSlugs : localSlugs

  // If URL has no params but localStorage does, sync URL
  useEffect(() => {
    if (urlSlugs.length === 0 && localSlugs.length > 0) {
      const next = new URLSearchParams()
      localSlugs.forEach((s) => next.append('p', s))
      setParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load product details whenever slugs change
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!slugs.length) { setProducts([]); setLoading(false); return }
      setLoading(true)
      try {
        const rows = await Promise.all(
          slugs.map((s) => fetchProductBySlug(s).catch(() => null))
        )
        if (cancelled) return
        const valid = rows.filter(Boolean)
        setProducts(valid)
        // If any slugs failed (deleted products), also remove from localStorage
        const validSlugs = new Set(valid.map((p) => p.slug))
        localSlugs.forEach((s) => {
          if (!validSlugs.has(s)) compareRemove(s)
        })
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugs.join(',')])

  function syncUrl(newSlugs) {
    const next = new URLSearchParams()
    newSlugs.forEach((s) => next.append('p', s))
    setParams(next, { replace: true })
  }

  function removeFromCompare(slug) {
    compareRemove(slug)
    syncUrl(slugs.filter((s) => s !== slug))
  }

  function removeAll() {
    localSlugs.forEach((s) => compareRemove(s))
    setParams(new URLSearchParams(), { replace: true })
  }

  if (loading && products.length === 0) {
    return (
      <main className="section-container py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="aspect-square bg-surfaceElevated rounded-xl mb-3" />
              <div className="h-3 bg-surfaceElevated rounded w-1/3 mb-2" />
              <div className="h-4 bg-surfaceElevated rounded w-3/4" />
            </div>
          ))}
        </div>
      </main>
    )
  }

  if (products.length === 0) {
    return (
      <main className="section-container py-8">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <GitCompare className="w-5 h-5 text-neon-green" />
            <p className="text-xs text-neon-green font-semibold uppercase tracking-widest">Compare</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-main-text mb-2">Compare phones side-by-side</h1>
          <p className="text-sec-text">Add up to {getMaxItems()} phones to compare specs, prices, and features.</p>
        </header>

        <div className="text-center py-16 bg-surface border border-border rounded-2xl">
          <p className="text-5xl mb-4">📊</p>
          <h3 className="text-xl font-semibold text-main-text mb-2">No phones to compare yet</h3>
          <p className="text-sm text-sec-text mb-6">Browse our phones and click the Compare icon on any product to add it here.</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            Browse Phones
          </Link>
        </div>

        {compareItems.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-muted-text mb-2">Recently added to compare:</p>
            <div className="flex gap-2 flex-wrap">
              {compareItems.map((it) => (
                <button
                  key={it.slug}
                  onClick={() => removeFromCompare(it.slug)}
                  className="badge badge-info"
                >
                  {it.name} <X className="w-3 h-3 ml-1" />
                </button>
              ))}
              <button onClick={removeAll} className="text-xs text-muted-text hover:text-danger">Clear all</button>
            </div>
          </div>
        )}
      </main>
    )
  }

  return (
    <main className="section-container py-8">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <GitCompare className="w-5 h-5 text-neon-green" />
            <p className="text-xs text-neon-green font-semibold uppercase tracking-widest">Compare</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-main-text">
            Comparing {products.length} phone{products.length > 1 ? 's' : ''}
          </h1>
        </div>
        <button onClick={removeAll} className="text-sm text-muted-text hover:text-danger">Clear all</button>
      </header>

      <div className="overflow-x-auto -mx-4 px-4 pb-4">
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background text-left text-xs uppercase tracking-wider text-muted-text font-medium w-32 align-bottom pb-4">
                Phone
              </th>
              {products.map((p) => (
                <th key={p.id} className="text-left p-2 align-top" style={{ minWidth: 240 }}>
                  <div className="card p-3">
                    <div className="aspect-square bg-elev-bg rounded-lg overflow-hidden mb-3 relative">
                      <img src={p.primary_image_url} alt={p.name} className="w-full h-full object-contain p-2" loading="lazy" />
                      <button
                        onClick={() => removeFromCompare(p.slug)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-surfaceElevated/90 backdrop-blur text-muted-text hover:text-danger flex items-center justify-center border border-border"
                        aria-label="Remove from compare"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-neon-green font-bold">{p.brand_name}</span>
                    <h3 className="font-semibold text-main-text text-sm line-clamp-2 leading-tight">{p.name}</h3>
                    <p className="text-xs text-sec-text line-clamp-1">{p.variant}</p>
                    <p className="font-bold text-main-text mt-2 text-lg">{formatPrice(p.price_bdt)}</p>
                    {p.compare_price_bdt && p.compare_price_bdt > p.price_bdt && (
                      <p className="text-xs text-textSubtle line-through">{formatPrice(p.compare_price_bdt)}</p>
                    )}
                    <Link to={`/product/${p.slug}`} className="btn-primary w-full text-xs py-1.5 text-center mt-3">View product</Link>
                  </div>
                </th>
              ))}
              {products.length < getMaxItems() && (
                <th className="p-2 align-top" style={{ minWidth: 240 }}>
                  <Link
                    to="/"
                    className="card p-6 flex flex-col items-center justify-center text-center h-full border-dashed hover:border-neon-green/40 hover:no-underline"
                  >
                    <div className="w-12 h-12 bg-neon-green/10 border border-neon-green/30 rounded-xl flex items-center justify-center text-neon-green mb-3">
                      <Plus className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-main-text">Add another phone</p>
                    <p className="text-xs text-sec-text mt-1">Up to {getMaxItems()} phones</p>
                  </Link>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {/* SPEC_ROWS rows */}
            {SPEC_ROWS.map((row) => {
              const bestVal = bestPerRow(products.map((p) => p.full_specs || {}), row.key)
              return (
                <tr key={row.key} className="border-t border-border">
                  <td className="sticky left-0 bg-background text-xs font-semibold text-sec-text uppercase tracking-wider py-3 pr-3 align-top">
                    {row.label}
                  </td>
                  {products.map((p) => {
                    const raw = p.full_specs?.[row.key]
                    const value = pickSpec(p.full_specs || {}, row.key)
                    const formatted = value == null ? null : (row.format ? row.format(raw) : value)
                    const isBest = bestVal != null && Number(raw) === bestVal && products.length > 1
                    return (
                      <td
                        key={p.id}
                        className={`text-sm py-3 px-2 align-top ${isBest ? 'bg-neon-green/10 text-neon-green font-semibold rounded-md' : 'text-main-text'}`}
                      >
                        {formatted ?? <span className="text-muted-text">—</span>}
                      </td>
                    )
                  })}
                  {products.length < getMaxItems() && <td className="py-3 px-2" />}
                </tr>
              )
            })}

            {/* Stock row */}
            <tr className="border-t border-border">
              <td className="sticky left-0 bg-background text-xs font-semibold text-sec-text uppercase tracking-wider py-3 pr-3 align-top">
                Stock
              </td>
              {products.map((p) => (
                <td key={p.id} className="text-sm py-3 px-2 align-top">
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                    p.stock_status === 'out_of_stock' ? 'bg-error/20 text-error' :
                    p.stock_status === 'low_stock' ? 'bg-warning/20 text-warning' :
                    'bg-success/20 text-success'
                  }`}>
                    {p.stock_status === 'out_of_stock' ? 'Out of stock' :
                     p.stock_status === 'low_stock' ? `Only ${p.stock_count} left` :
                     `${p.stock_count} in stock`}
                  </span>
                </td>
              ))}
              {products.length < getMaxItems() && <td className="py-3 px-2" />}
            </tr>

            {/* Warranty row */}
            <tr className="border-t border-border">
              <td className="sticky left-0 bg-background text-xs font-semibold text-sec-text uppercase tracking-wider py-3 pr-3 align-top">
                Warranty
              </td>
              {products.map((p) => (
                <td key={p.id} className="text-sm py-3 px-2 align-top text-main-text">
                  {p.warranty_months || 12} months
                </td>
              ))}
              {products.length < getMaxItems() && <td className="py-3 px-2" />}
            </tr>

            {/* Condition row */}
            <tr className="border-t border-border">
              <td className="sticky left-0 bg-background text-xs font-semibold text-sec-text uppercase tracking-wider py-3 pr-3 align-top">
                Condition
              </td>
              {products.map((p) => (
                <td key={p.id} className="text-sm py-3 px-2 align-top text-main-text capitalize">
                  {p.condition || 'new'}
                </td>
              ))}
              {products.length < getMaxItems() && <td className="py-3 px-2" />}
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  )
}