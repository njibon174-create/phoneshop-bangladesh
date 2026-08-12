import { BackButton } from '../components/ui/BackButton'
import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search as SearchIcon, ChevronRight } from 'lucide-react'
import { PhoneCard } from '../components/ui/PhoneCard'
import { useProductFilters } from '../lib/useFilters'

function formatPrice(bdt) {
  if (bdt == null) return '—'
  return '৳' + Number(bdt).toLocaleString('en-IN')
}

export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const initialQ = params.get('q') || ''
  const [input, setInput] = useState(initialQ)

  const { products, loading, totalCount, filters, setFilter } = useProductFilters()

  useEffect(() => {
    setFilter('q', initialQ)
  }, [initialQ, setFilter])

  function submit(e) {
    e.preventDefault()
    const next = new URLSearchParams(params)
    if (input.trim()) next.set('q', input.trim())
    else next.delete('q')
    setParams(next, { replace: true })
  }

  return (
    <main className="section-container py-8"><div className="mb-4"><BackButton /></div>
      <nav className="flex items-center gap-1 text-sm text-textSubtle mb-4">
        <Link to="/" className="hover:text-accent">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-text">Search</span>
      </nav>

      <form onSubmit={submit} className="mb-6">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-2xl px-4 py-3 focus-within:border-accent transition-colors">
          <SearchIcon className="w-5 h-5 text-textSubtle shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search by phone name, variant, or keyword..."
            className="flex-1 bg-transparent text-text text-base outline-none placeholder:text-textSubtle"
            autoFocus
          />
          {input && (
            <button type="button" onClick={() => { setInput(''); setParams({}) }} className="text-xs text-textSubtle hover:text-text">
              Clear
            </button>
          )}
          <button type="submit" className="btn-primary text-sm py-2 px-4">Search</button>
        </div>
      </form>

      {filters.q && (
        <p className="text-sm text-textMuted mb-5">
          {loading ? 'Searching...' : `Showing ${totalCount} results for "${filters.q}"`}
        </p>
      )}

      {!filters.q ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-xl font-semibold text-text mb-2">Search for a phone</h3>
          <p className="text-sm text-textMuted">Try "iPhone", "Samsung Galaxy", "Xiaomi 14"...</p>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="aspect-square bg-surfaceElevated rounded-xl mb-4" />
              <div className="h-3 bg-surfaceElevated rounded w-1/3 mb-2" />
              <div className="h-4 bg-surfaceElevated rounded w-3/4 mb-2" />
              <div className="h-6 bg-surfaceElevated rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl">
          <p className="text-5xl mb-4">🤷</p>
          <h3 className="text-xl font-semibold text-text mb-2">No results found</h3>
          <p className="text-sm text-textMuted">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((p) => (
            <PhoneCard
              key={p.id}
              phone={{
                id: p.id,
                brand: p.brand_name,
                name: p.name,
                variant: p.variant,
                price: formatPrice(p.price_bdt),
                image: p.primary_image_url,
                slug: p.slug, inStock: p.in_stock,
              }}
            />
          ))}
        </div>
      )}
    </main>
  )
}
