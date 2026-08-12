import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Smartphone, ChevronRight, Smartphone as PhoneIcon } from 'lucide-react'
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
    <main className="min-h-screen" style={{ backgroundColor: '#0A0E1A' }}>
      {/* Hero */}
      <section
        className="border-b"
        style={{
          background: 'linear-gradient(180deg, rgba(0,255,136,0.05), transparent)',
          borderColor: '#13161F',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <nav className="flex items-center gap-1.5 text-xs mb-4" style={{ color: '#7EB8DA' }}>
            <Link to="/" className="hover:text-[#00FF88] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span style={{ color: '#F0F8FF' }}>All Brands</span>
          </nav>
          <h1 className="text-4xl sm:text-5xl font-black mb-3" style={{ color: '#F0F8FF' }}>All Brands</h1>
          <p className="text-base max-w-2xl" style={{ color: '#7EB8DA' }}>
            Browse phones from {brands.length || 'every'} top brand — authorized dealer with official warranty.
          </p>
        </div>
      </section>

      {/* Brand grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 h-44 animate-pulse"
                style={{ backgroundColor: '#111827', border: '1px solid #1E3A5F' }}
              />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#111827', border: '1px solid #1E3A5F' }}>
            <PhoneIcon className="w-16 h-16 mx-auto mb-4" style={{ color: '#4A7A9B' }} />
            <p className="text-lg mb-2" style={{ color: '#F0F8FF' }}>No brands yet</p>
            <p className="text-sm" style={{ color: '#7EB8DA' }}>Brands added from the admin will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {brands.map(b => (
              <Link
                key={b.slug || b.name}
                to={`/brand/${b.slug || (b.name || b).toLowerCase()}`}
                className="group flex flex-col items-center justify-center p-8 rounded-2xl text-center transition-all"
                style={{
                  backgroundColor: '#111827',
                  border: '1px solid #1E3A5F',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#00FF88'
                  e.currentTarget.style.backgroundColor = '#1E2A3A'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#1E3A5F'
                  e.currentTarget.style.backgroundColor = '#111827'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {b.logo_url ? (
                  <img src={b.logo_url} alt={b.name} className="h-14 w-auto max-w-full object-contain mb-4" />
                ) : (
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,212,255,0.15))',
                      border: '1px solid rgba(0,255,136,0.2)',
                    }}
                  >
                    <Smartphone className="w-7 h-7" style={{ color: '#00FF88' }} />
                  </div>
                )}
                <p className="font-semibold text-base" style={{ color: '#F0F8FF' }}>{b.name}</p>
                {b.description && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: '#7EB8DA' }}>{b.description}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
