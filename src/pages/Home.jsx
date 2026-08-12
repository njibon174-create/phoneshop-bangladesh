import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PhoneCard } from '../components/ui/PhoneCard'
import { fetchBrands, fetchFeaturedProducts } from '../lib/queries'
import { Sparkles, Zap, Shield, Truck, BadgeCheck, ChevronRight, ArrowRight, MessageCircle, Phone } from 'lucide-react'

function formatPrice(bdt) {
  if (bdt == null) return '—'
  return '৳' + Number(bdt).toLocaleString('en-IN')
}

export function Home() {
  const [brands, setBrands] = useState([])
  const [phones, setPhones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [brandsData, phonesData] = await Promise.all([
          fetchBrands().catch(() => []),
          fetchFeaturedProducts(8).catch(() => []),
        ])
        if (cancelled) return
        if (brandsData?.length) setBrands(brandsData)
        if (phonesData?.length) setPhones(phonesData)
      } catch (e) {
        console.warn('Home data fetch failed:', e.message)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <main className="overflow-hidden" style={{ backgroundColor: '#0A0E1A' }}>
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section
        className="relative min-h-[85vh] flex items-center overflow-hidden"
        style={{ backgroundColor: '#0A0E1A' }}
      >
        {/* Background grid + glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 30% 20%, rgba(0,255,136,0.12), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(0,212,255,0.1), transparent 50%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(0,255,136,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid md:grid-cols-2 gap-12 items-center pt-12 md:pt-0">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                backgroundColor: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid rgba(0, 255, 136, 0.3)',
                color: '#00FF88',
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#00FF88' }} />
              New Season Collection 2026
            </div>
            <h1
              className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.05] mb-6"
              style={{ color: '#F0F8FF' }}
            >
              Bangladesh's<br />
              <span style={{
                background: 'linear-gradient(135deg, #00FF88, #00D4FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Premium Phone
              </span>
              <br />
              Destination
            </h1>
            <p className="text-lg sm:text-xl mb-8 max-w-xl" style={{ color: '#7EB8DA' }}>
              From the latest iPhone to budget-friendly smartphones — authentic products, official warranty, and fast delivery across Bangladesh.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/brands"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-black"
                style={{
                  background: 'linear-gradient(135deg, #00FF88, #00D4FF)',
                  boxShadow: '0 0 30px rgba(0, 255, 136, 0.35)',
                }}
              >
                Shop All Phones
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/deals"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold"
                style={{
                  backgroundColor: '#1E2A3A',
                  color: '#F0F8FF',
                  border: '1px solid #1E3A5F',
                }}
              >
                <Zap className="w-5 h-5" style={{ color: '#00FF88' }} />
                See Deals
              </Link>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-4 mt-10 max-w-md">
              {[
                { num: '10+', label: 'Top brands' },
                { num: '5000+', label: 'Phones sold' },
                { num: '4.9★', label: 'Customer rating' },
              ].map((s, i) => (
                <div key={i}>
                  <p className="text-2xl font-bold" style={{ color: '#00FF88' }}>{s.num}</p>
                  <p className="text-xs" style={{ color: '#7EB8DA' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero device mockup */}
          <div className="relative hidden md:flex items-center justify-center">
            <div
              className="absolute w-96 h-96 rounded-full blur-3xl"
              style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.3), rgba(0,212,255,0.3))' }}
            />
            <div
              className="relative w-72 h-[480px] rounded-[3rem] p-3"
              style={{
                background: 'linear-gradient(135deg, #1E2A3A, #111827)',
                border: '2px solid #1E3A5F',
                boxShadow: '0 30px 60px -10px rgba(0, 255, 136, 0.25)',
              }}
            >
              <div
                className="w-full h-full rounded-[2.5rem] overflow-hidden flex items-center justify-center"
                style={{ backgroundColor: '#0A0E1A' }}
              >
                <div className="text-center p-6">
                  <Phone className="w-16 h-16 mx-auto mb-4" style={{ color: '#00FF88' }} />
                  <p className="text-2xl font-bold mb-2" style={{ color: '#F0F8FF' }}>iPhone 15 Pro</p>
                  <p className="text-sm mb-4" style={{ color: '#7EB8DA' }}>Titanium. So strong. So light.</p>
                  <p className="text-3xl font-black" style={{ color: '#00FF88' }}>৳1,99,999</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST STRIP ─────────────────────────────────────── */}
      <section
        className="border-y"
        style={{ backgroundColor: '#111827', borderColor: '#1E3A5F' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Shield, label: 'Official Warranty', sub: 'All products' },
            { icon: Zap, label: 'Fast Delivery', sub: 'All over BD' },
            { icon: BadgeCheck, label: '100% Authentic', sub: 'Genuine products' },
            { icon: MessageCircle, label: '24/7 Support', sub: 'WhatsApp & phone' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(0, 255, 136, 0.1)' }}
              >
                <t.icon className="w-5 h-5" style={{ color: '#00FF88' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F0F8FF' }}>{t.label}</p>
                <p className="text-xs" style={{ color: '#7EB8DA' }}>{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BRAND STRIP ─────────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#00FF88' }}>Authorized dealer</p>
              <h2 className="text-2xl font-bold" style={{ color: '#F0F8FF' }}>Shop by Brand</h2>
            </div>
            <Link
              to="/brands"
              className="inline-flex items-center gap-1 text-sm font-medium"
              style={{ color: '#7EB8DA' }}
            >
              All brands <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {brands.length === 0 ? (
            <p className="text-center py-4 text-sm" style={{ color: '#7EB8DA' }}>Loading brands…</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-4">
              {brands.map(b => (
                <Link
                  key={b.slug || b.name}
                  to={`/brand/${b.slug || (b.name || b).toLowerCase()}`}
                  className="group flex flex-col items-center justify-center p-4 rounded-2xl transition-all hover:-translate-y-1"
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid #1E3A5F',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#00FF88'
                    e.currentTarget.style.backgroundColor = '#1E2A3A'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#1E3A5F'
                    e.currentTarget.style.backgroundColor = '#111827'
                  }}
                >
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="h-10 w-auto max-w-full object-contain" />
                  ) : (
                    <span className="text-sm font-bold" style={{ color: '#F0F8FF' }}>{b.name}</span>
                  )}
                  <span className="text-[10px] mt-1 opacity-0 group-hover:opacity-100 transition" style={{ color: '#00FF88' }}>{b.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── FEATURED PHONES ────────────────────────────────── */}
      <section
        className="py-16"
        style={{ backgroundColor: '#0A0E1A', borderTop: '1px solid #13161F', borderBottom: '1px solid #13161F' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: '#00FF88' }} />
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#00FF88' }}>Featured</p>
              </div>
              <h2 className="text-3xl font-bold" style={{ color: '#F0F8FF' }}>Trending Phones</h2>
            </div>
            <Link
              to="/brands"
              className="inline-flex items-center gap-1 text-sm font-medium"
              style={{ color: '#7EB8DA' }}
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ backgroundColor: '#111827', border: '1px solid #1E3A5F' }}>
                  <div className="aspect-square rounded-xl mb-4" style={{ backgroundColor: '#1E2A3A' }} />
                  <div className="h-3 w-1/3 rounded mb-2" style={{ backgroundColor: '#1E2A3A' }} />
                  <div className="h-4 w-3/4 rounded mb-2" style={{ backgroundColor: '#1E2A3A' }} />
                  <div className="h-2 w-full rounded mb-3" style={{ backgroundColor: '#1E2A3A' }} />
                  <div className="h-5 w-1/2 rounded" style={{ backgroundColor: '#1E2A3A' }} />
                </div>
              ))}
            </div>
          ) : phones.length === 0 ? (
            <div className="text-center py-16 rounded-2xl" style={{ backgroundColor: '#111827', border: '1px solid #1E3A5F' }}>
              <p className="text-5xl mb-3">📱</p>
              <p className="text-lg mb-1" style={{ color: '#F0F8FF' }}>No phones yet</p>
              <p className="text-sm" style={{ color: '#7EB8DA' }}>Phones added from the admin will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {phones.map(p => (
                <PhoneCard
                  key={p.id}
                  phone={{
                    id: p.id,
                    brand: p.brand_name,
                    name: p.name,
                    variant: p.variant,
                    price: formatPrice(p.price_bdt),
                    image: p.primary_image_url,
                    slug: p.slug,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── CTA STRIP ───────────────────────────────────────── */}
      <section
        className="py-16"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,212,255,0.08))',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#F0F8FF' }}>
            Visit our flagship store
          </h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto" style={{ color: '#7EB8DA' }}>
            See, feel, and try every phone in person. Get expert advice from our team in Gulshan, Dhaka.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #00FF88, #00D4FF)',
                color: '#0A0E1A',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
              }}
            >
              <MapPin className="w-4 h-4" /> Visit Store
            </Link>
            <a
              href="tel:+8801700000000"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold"
              style={{
                backgroundColor: '#1E2A3A',
                color: '#F0F8FF',
                border: '1px solid #1E3A5F',
              }}
            >
              <Phone className="w-4 h-4" /> Call Us
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

