import { useEffect, useState } from 'react'
import { ArrowRight, ChevronRight, Sparkles, Zap, Shield, Truck, BadgeCheck, MessageCircle } from 'lucide-react'
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
        if (brandsData?.length) setBrands(brandsData)
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
        {/* Background */}
        <div className="absolute inset-0">
          <img src={FALLBACK_HERO_IMAGE} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-dark-bg via-dark-bg/95 to-sec-bg" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(0,255,136,0.15),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_70%,rgba(0,212,255,0.12),transparent_50%)]" />
          {/* Tech grid overlay */}
          <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage: 'linear-gradient(rgba(0,255,136,.4) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,.4) 1px,transparent 1px)', backgroundSize: '60px 60px'}} />
          {/* Top neon divider */}
          <div className="absolute top-0 left-0 right-0 h-px neon-divider" />
        </div>

        <div className="relative z-10 section-container">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-neon-green" />
              New Season Collection 2026
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-main-text leading-[1.05] mb-6">
              Bangladesh's
              <br />
              <span className="gradient-text">Premium Phone</span>
              <br />
              Destination
            </h1>
            <p className="text-lg sm:text-xl text-sec-text max-w-xl mb-8">
              From the latest iPhone to budget-friendly smartphones — authentic products, official warranty, and fast delivery across Bangladesh.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="/brands" className="btn-primary text-base px-8 py-3.5 animate-pulse-glow flex items-center gap-2">
                Shop Now <ArrowRight className="w-5 h-5" />
              </a>
              <a href="/compare" className="btn-secondary text-base px-8 py-3.5 inline-flex items-center justify-center">
                Compare Phones
              </a>
            </div>
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { icon: Shield, label: 'Official Warranty', sub: 'All products' },
                { icon: Zap, label: 'Fast Delivery', sub: 'All over BD' },
                { icon: BadgeCheck, label: '100% Authentic', sub: 'Genuine products' },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-2">
                  <b.icon className="w-4 h-4 text-neon-green" />
                  <div>
                    <p className="text-xs font-semibold text-main-text">{b.label}</p>
                    <p className="text-[10px] text-muted-text">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BRAND STRIP */}
      <section className="py-12 border-y border-border bg-sec-bg/50">
        <div className="section-container">
          <p className="text-center text-xs text-muted-text font-medium uppercase tracking-widest mb-8">Trusted by All Major Brands</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {brands.map((b) => (
              <a key={b.slug || b.name || b} href={`/brand/${b.slug || (b.name || b).toLowerCase()}`} className="text-sm font-bold text-sec-text hover:text-neon-green transition-colors duration-200">
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
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-neon-green" />
                <p className="text-xs text-neon-green font-semibold uppercase tracking-widest">Featured</p>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-main-text">Trending Phones</h2>
            </div>
            <a href="/brands" className="hidden sm:flex items-center gap-1 text-sm text-sec-text hover:text-neon-blue transition-colors">
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
            <p className="text-xs text-muted-text text-center mt-6">
              ℹ Showing placeholder data. Connect to Supabase to see real products.
            </p>
          )}
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="py-16 bg-sec-bg border-y border-border">
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Official Warranty', desc: 'Every phone comes with manufacturer warranty' },
              { icon: Truck, title: 'Fast Delivery', desc: 'Delivery all over Bangladesh within 2-5 days' },
              { icon: BadgeCheck, title: '100% Authentic', desc: 'Only genuine products, verified source' },
              { icon: MessageCircle, title: '24/7 Support', desc: 'WhatsApp & phone support in Bangla & English' },
            ].map((it, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-card-bg border border-border hover:border-neon-green/30 transition-colors">
                <div className="w-12 h-12 bg-neon-green/10 border border-neon-green/20 rounded-xl flex items-center justify-center mb-3">
                  <it.icon className="w-5 h-5 text-neon-green" />
                </div>
                <h3 className="font-semibold text-main-text mb-1">{it.title}</h3>
                <p className="text-xs text-sec-text">{it.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
