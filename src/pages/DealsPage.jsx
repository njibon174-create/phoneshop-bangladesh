import { BackButton } from '../components/ui/BackButton'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tag, ArrowRight, Sparkles } from 'lucide-react'
import { PhoneCard } from '../components/ui/PhoneCard'
import { supabase } from '../lib/supabase'

function formatPrice(bdt) {
  if (bdt == null) return '—'
  return '৳' + Number(bdt).toLocaleString('en-IN')
}

export function DealsPage() {
  const [phones, setPhones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      // phones with a compare_price_bdt set (i.e., on sale)
      const { data } = await supabase
        .from('storefront_products')
        .select('*')
        .not('compare_price_bdt', 'is', null)
        .gt('compare_price_bdt', 0)
        .order('created_at', { ascending: false })
      if (!cancelled) {
        setPhones(data || [])
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <main className="section-container py-8"><div className="mb-4"><BackButton /></div>
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-5 h-5 text-neon-green" />
          <p className="text-xs text-neon-green font-semibold uppercase tracking-widest">Deals</p>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-main-text mb-2">Today's best phone deals</h1>
        <p className="text-sec-text">Discounted phones with official warranty. Limited time.</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="aspect-square bg-surfaceElevated rounded-xl mb-4" />
              <div className="h-3 bg-surfaceElevated rounded w-1/3 mb-2" />
              <div className="h-4 bg-surfaceElevated rounded w-3/4 mb-2" />
              <div className="h-6 bg-surfaceElevated rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : phones.length === 0 ? (
        <div className="text-center py-16 bg-surface border border-border rounded-2xl">
          <p className="text-5xl mb-4">🏷️</p>
          <h3 className="text-xl font-semibold text-main-text mb-2">No deals right now</h3>
          <p className="text-sm text-sec-text mb-6">Check back soon — we run deals every week.</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            Browse all phones <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {phones.map((p) => (
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
                badge: 'Sale',
              }}
            />
          ))}
        </div>
      )}
    </main>
  )
}
