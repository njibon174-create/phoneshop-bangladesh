import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronRight } from 'lucide-react'
import { PhoneCard } from '../components/ui/PhoneCard'
import { FilterSidebar } from '../components/ui/FilterSidebar'
import { useProductFilters } from '../lib/useFilters'
import { fetchBrands } from '../lib/queries'

function formatPrice(bdt) {
  if (bdt == null) return '—'
  return '৳' + Number(bdt).toLocaleString('en-IN')
}

export function BrandPage() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const [brand, setBrand] = useState(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Lock the brand filter to the URL slug
  const { products, loading, error, totalCount, filters, setFilter, clearAll } = useProductFilters()
  useEffect(() => {
    setFilter('brand', slug)
    return () => setFilter('brand', '')
  }, [slug, setFilter])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const brands = await fetchBrands().catch(() => [])
      if (cancelled) return
      const b = brands.find((x) => x.slug === slug)
      setBrand(b || null)
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  return (
    <main className="section-container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-textSubtle mb-4">
        <Link to="/" className="hover:text-accent">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to="/brands" className="hover:text-accent">Brands</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-text">{brand?.name || slug}</span>
      </nav>

      {/* Hero */}
      <div className="bg-gradient-to-br from-surface to-surfaceElevated border border-border rounded-2xl p-8 mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-text mb-2">
          {brand?.name || slug}
        </h1>
        <p className="text-textMuted max-w-2xl">
          {brand?.description || `Browse all ${brand?.name || slug} phones available at PhoneShop BD.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar
            filters={filters}
            setFilter={setFilter}
            clearAll={clearAll}
            totalCount={totalCount}
          />
        </div>

        {/* Main */}
        <div>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 bg-surface border border-border rounded-xl px-4 py-3">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden btn-secondary text-sm py-2 px-3 flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
            <span className="text-sm text-textMuted">
              {loading ? 'Loading...' : `${totalCount} ${totalCount === 1 ? 'phone' : 'phones'}`}
            </span>
            <select
              value={filters.sort}
              onChange={(e) => setFilter('sort', e.target.value)}
              className="bg-surfaceElevated border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <SkeletonGrid />
          ) : error ? (
            <ErrorState message={error} />
          ) : products.length === 0 ? (
            <EmptyState onClear={clearAll} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((p) => (
                <PhoneCard
                  key={p.id}
                  phone={{
                    id: p.id,
                    brand: p.brand_name,
                    name: p.name,
                    variant: p.variant,
                    price: formatPrice(p.price_bdt),
                    comparePrice: p.compare_price_bdt ? formatPrice(p.compare_price_bdt) : null,
                    image: p.primary_image_url,
                    slug: p.slug,
                    stockStatus: p.stock_status,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background shadow-2xl overflow-y-auto">
            <FilterSidebar
              filters={filters}
              setFilter={setFilter}
              clearAll={clearAll}
              totalCount={totalCount}
              onClose={() => setShowMobileFilters(false)}
            />
          </div>
        </div>
      )}
    </main>
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="aspect-square bg-surfaceElevated rounded-xl mb-4" />
          <div className="h-3 bg-surfaceElevated rounded w-1/3 mb-2" />
          <div className="h-4 bg-surfaceElevated rounded w-3/4 mb-2" />
          <div className="h-3 bg-surfaceElevated rounded w-1/2 mb-4" />
          <div className="h-6 bg-surfaceElevated rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onClear }) {
  return (
    <div className="text-center py-16 bg-surface border border-border rounded-2xl">
      <p className="text-5xl mb-4">📱</p>
      <h3 className="text-xl font-semibold text-text mb-2">No phones match your filters</h3>
      <p className="text-sm text-textMuted mb-6">Try widening your price range or removing some filters.</p>
      <button onClick={onClear} className="btn-primary">Clear all filters</button>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="text-center py-16 bg-surface border border-error/30 rounded-2xl">
      <p className="text-5xl mb-4">⚠️</p>
      <h3 className="text-xl font-semibold text-text mb-2">Couldn't load phones</h3>
      <p className="text-sm text-textMuted">{message}</p>
    </div>
  )
}
