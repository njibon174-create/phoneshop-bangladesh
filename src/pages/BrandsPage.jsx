import { BackButton } from '../components/ui/BackButton'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Smartphone, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchBrands } from '../lib/queries'


export function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const data = await fetchBrands().catch(() => [])
      if (cancelled) return
      setBrands(data || [])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <main className="section-container py-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <nav className="flex items-center gap-1 text-sm text-textSubtle">
          <Link to="/" className="hover:text-accent">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-text">All Brands</span>
        </nav>
<BackButton />
      </div>
      <div className="mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-text mb-2">All Brands</h1>
        <p className="text-textMuted">Browse phones from all the brands we carry at PhoneShop BD.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {brands.map((b) => (
          <Link
            key={b.slug}
            to={`/brand/${b.slug}`}
            className="card p-6 flex flex-col items-center text-center hover:no-underline"
          >
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-3 text-accent">
              {b.logo_url ? (
                <img src={b.logo_url} alt={b.name} className="w-8 h-8 object-contain" />
              ) : (
                <Smartphone className="w-6 h-6" />
              )}
            </div>
            <h3 className="font-semibold text-text mb-1">{b.name}</h3>
            <p className="text-xs text-textMuted line-clamp-2">{b.description || 'Browse phones'}</p>
          </Link>
        ))}
      </div>


    </main>
  )
}
