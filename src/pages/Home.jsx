import { useEffect, useState } from 'react'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { PhoneCard } from '../components/ui/PhoneCard'
import { fetchBrands, fetchFeaturedProducts } from '../lib/queries'

const FALLBACK_BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'Realme', 'Infinix', 'Symphony', 'Walton', 'itel']

const FALLBACK_HERO_IMAGE = 'https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=1920'

const FALLBACK_PHONES = [
  {
    id: '1', brand_name: 'Apple', name: 'iPhone 15 Pro Max', variant: '256GB Natural Titanium',
    price_bdt: 189999, slug: 'iphone-15-pro-max-256gb-natural-titanium',
    primary_image_url: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: '2', brand_name: 'Samsung', name: 'Galaxy S24 Ultra', variant: '512GB Titanium Black',
    price_bdt: 179999, slug: 'samsung-galaxy-s24-ultra-512gb-titanium-black',
    primary_image_url: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: '3', brand_name: 'Xiaomi', name: 'Xiaomi 14 Ultra', variant: '512GB Titanium',
    price_bdt: 129999, slug: 'xiaomi-14-ultra-512gb-titanium',
    primary_image_url: 'https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
  {
    id: '4', brand_name: 'Walton', name: 'Walton Primo H10', variant: '128GB Ocean Blue',
    price_bdt: 18999, slug: 'walton-primo-h10-128gb',
    primary_image_url: 'https://images.pexels.com/photos/214487/pexels-photo-214487.jpeg?auto=compress&cs=tinysrgb&w=600',
  },
]

function formatPrice(bdt) {
  if (bdt == null) return '—'
  return '৳' + Number(bdt).toLocaleString('en-IN')
}

export function Home() {
  const [brands, setBrands] = useState(FALLBACK_BRANDS)
  const [phones, setPhones] = useState(FALLBACK_PHONES)
  const [usingFallback, setUsingFallback] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [brandsData, phonesData] = await Promise.all([
          fetchBrands().catch(() => null),
          fetchFeaturedProducts(8).catch(() => null),
        ])
        if (cancelled) return
        if (brandsData?.length) {
          setBrands(brandsData.map((b) => b.name))
        }
        if (phonesData?.length) {
          setPhones(phonesData)
          setUsingFallback(false)
        }
      } catch (e) {
        console.warn('Home data fetch failed, using fallback:', e.message)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <main>
      {/* HERO */}
      <section className="relative h-[80vh] min-h-[560px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={FALLBACK_HERO_IMAGE} alt="" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/90 to-surface" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(99,102,241,0.2),transparent_60%)]" />
        </div>
        <div className="relative z-10 section-container">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              New Season Collection 2025
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-text leading-[1.05] mb-6">
              Bangladesh's
              <br />
              <span className="gradient-text">Premium Phone</span>
              <br />
              Destination
            </h1>
            <p className="text-lg sm:text-xl text-textMuted max-w-xl mb-8">
              From the latest iPhone to budget-friendly smartphones — authentic products, official warranty, and fast delivery across Bangladesh.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="btn-primary flex items-center gap-2 text-base px-8 py-3.5">
                Shop Now <ArrowRight className="w-5 h-5" />
              </button>
              <button className="btn-secondary flex items-center gap-2 text-base px-8 py-3.5">
                Compare Phones
              </button>
            </div>
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { label: 'Official Warranty', sub: 'All products' },
                { label: 'Fast Delivery', sub: 'All over BD' },
                { label: '100% Authentic', sub: 'Genuine products' },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                  <div>
                    <p className="text-xs font-semibold text-text">{b.label}</p>
                    <p className="text-[10px] text-textSubtle">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BRAND STRIP */}
      <section className="py-12 border-y border-border bg-surface/50">
        <div className="section-container">
          <p className="text-center text-xs text-textSubtle font-medium uppercase tracking-widest mb-8">Trusted by All Major Brands</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {brands.map((b) => (
              <a key={b.slug || b.name || b} href={`/brand/${b.slug || (b.name || b).toLowerCase()}`} className="text-sm font-bold text-textMuted hover:text-text transition-colors">
                {b.name || b}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PHONES */}
      <section className="py-20">
        <div className="section-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs text-accent font-semibold uppercase tracking-widest mb-2">Featured</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-text">Trending Phones</h2>
            </div>
            <a href="/brands" className="hidden sm:flex items-center gap-1 text-sm text-textMuted hover:text-accent">
              View All <ChevronRight className="w-4 h-4" />
            </a>
          </div>
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
                  image: p.primary_image_url,
                  slug: p.slug,
                }}
              />
            ))}
          </div>
          {usingFallback && (
            <p className="text-xs text-textSubtle text-center mt-6">
              ℹ Showing placeholder data. Connect to Supabase to see real products.
            </p>
          )}
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="py-16 bg-surface border-y border-border">
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🛡️', title: 'Official Warranty', desc: 'Every phone comes with manufacturer warranty' },
              { icon: '🚚', title: 'Fast Delivery', desc: 'Delivery all over Bangladesh within 2-5 days' },
              { icon: '✅', title: '100% Authentic', desc: 'Only genuine products, verified source' },
              { icon: '💬', title: '24/7 Support', desc: 'WhatsApp & phone support in Bangla & English' },
            ].map((it, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-surfaceElevated border border-border">
                <span className="text-3xl mb-3">{it.icon}</span>
                <h3 className="font-semibold text-text mb-1">{it.title}</h3>
                <p className="text-xs text-textMuted">{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
