import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, X, GitCompare, Check, Minus, ShoppingCart } from 'lucide-react'
import { PhoneCard } from '../components/ui/PhoneCard'
import { fetchProductBySlug } from '../lib/queries'
import { add as compareAdd, remove as compareRemove, getItems as getCompareItems, subscribe as compareSubscribe, getMaxItems } from '../lib/compare'

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
  { key: '5g', label: '5G', format: (v) => v ? 'Yes' : 'No' },
]

export function ComparePage() {
  const [params, setParams] = useSearchParams()
  const slugs = params.getAll('p')
  const compareItems = useSyncExternalStore(compareSubscribe, getCompareItems, getCompareItems)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!slugs.length) { setProducts([]); return }
      setLoading(true)
      try {
        const rows = await Promise.all(slugs.map((s) => fetchProductBySlug(s).catch(() => null)))
        if (cancelled) return
        setProducts(rows.filter(Boolean))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slugs.join(',')])

  function removeAll() {
    compareItems.forEach((it) => compareRemove(it.slug))
    setParams(new URLSearchParams(), { replace: true })
  }

  function removeFromCompare(slug) {
    compareRemove(slug)
    const next = new URLSearchParams(params)
    next.delete('p')
    slugs.filter((s) => s !== slug).forEach((s) => next.append('p', s))
    setParams(next, { replace: true })
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
          <p className="text-sm text-sec-text mb-6">Browse our phones and click the "Compare" button on any product.</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            Browse Phones
          </Link>
        </div>

        {compareItems.length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-muted-text mb-2">Recently added to compare:</p>
            <div className="flex gap-2 flex-wrap">
              {compareItems.map((it) => (
                <button key={it.slug} onClick={() => removeFromCompare(it.slug)} className="badge badge-info">
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
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <GitCompare className="w-5 h-5 text-neon-green" />
          <p className="text-xs text-neon-green font-semibold uppercase tracking-widest">Compare</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-main-text mb-2">Comparing {products.length} phones</h1>
        <button onClick={removeAll} className="text-sm text-muted-text hover:text-danger">Clear all</button>
      </header>

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-background text-left text-xs uppercase tracking-wider text-muted-text font-medium w-32 align-bottom pb-4">Spec</th>
              {products.map((p) => (
                <th key={p.id} className="text-left p-2 align-top" style={{ minWidth: 220 }}>
                  <div className="card p-3">
                    <div className="aspect-square bg-elev-bg rounded-lg overflow-hidden mb-3">
                      <img src={p.primary_image_url} alt={p.name} className="w-full h-full object-contain p-2" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-neon-green font-bold">{p.brand_name}</span>
                    <h3 className="font-semibold text-main-text text-sm line-clamp-1">{p.name}</h3>
                    <p className="text-xs text-sec-text line-clamp-1">{p.variant}</p>
                    <p className="font-bold text-main-text mt-2">{formatPrice(p.price_bdt)}</p>
                    <div className="flex gap-1 mt-3">
                      <Link to={`/product/${p.slug}`} className="btn-secondary flex-1 text-xs py-1.5 text-center">View</Link>
                      <button onClick={() => removeFromCompare(p.slug)} className="btn-ghost p-1.5 text-muted-text hover:text-danger" aria-label="Remove">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
              {products.length < getMaxItems() && (
                <th className="p-2 align-top" style={{ minWidth: 220 }}>
                  <Link to="/" className="card p-6 flex flex-col items-center justify-center text-center h-full border-dashed hover:border-neon-green/40">
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
            {SPEC_ROWS.map((row) => (
              <tr key={row.key} className="border-t border-border">
                <td className="sticky left-0 bg-background text-xs font-semibold text-sec-text uppercase tracking-wider py-3 pr-3 align-top">{row.label}</td>
                {products.map((p) => {
                  const raw = p.full_specs?.[row.key]
                  const value = raw === null || raw === undefined || raw === '' ? null : (row.format ? row.format(raw) : String(raw))
                  return (
                    <td key={p.id} className="text-sm text-main-text py-3 px-2 align-top">
                      {value || <span className="text-muted-text">—</span>}
                    </td>
                  )
                })}
                {products.length < getMaxItems() && <td className="py-3 px-2" />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
