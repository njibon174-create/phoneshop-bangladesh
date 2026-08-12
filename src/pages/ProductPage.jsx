import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, Check, X, Cpu, Battery, Camera, HardDrive, Smartphone } from 'lucide-react'
import { PhoneCard } from '../components/ui/PhoneCard'
import { fetchProductBySlug, fetchProductsByBrand } from '../lib/queries'
import { supabase } from '../lib/supabase'

function formatPrice(bdt) {
  if (bdt == null) return '—'
  return '৳' + Number(bdt).toLocaleString('en-IN')
}

const SPEC_GROUPS = [
  { keys: ['display', 'refresh_rate_hz'], title: 'Display', icon: Smartphone },
  { keys: ['chip', 'os', 'ram_gb'], title: 'Performance', icon: Cpu },
  { keys: ['rear_camera', 'front_camera', 'video_4k'], title: 'Camera', icon: Camera },
  { keys: ['battery_mah', 'charging_w', 'wireless_charging_w'], title: 'Battery', icon: Battery },
  { keys: ['storage_gb', 'weight_g', 'ip_rating', '5g'], title: 'Build & Connectivity', icon: HardDrive },
]

function pickSpec(fullSpecs, key) {
  if (!fullSpecs) return null
  const v = fullSpecs[key]
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}

function groupSpecs(fullSpecs) {
  return SPEC_GROUPS.map((g) => {
    const rows = []
    for (const key of g.keys) {
      const value = pickSpec(fullSpecs, key)
      if (value) rows.push({ key, value, label: prettyKey(key) })
    }
    return { title: g.title, icon: g.icon, rows }
  }).filter((g) => g.rows.length > 0)
}

function prettyKey(k) {
  return k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchProductBySlug(slug)
        if (cancelled) return
        if (!data) {
          setError('Product not found')
        } else {
          setProduct(data)
          const relatedData = await fetchProductsByBrand(data.brand_slug, { limit: 4 })
          if (!cancelled) setRelated((relatedData || []).filter((r) => r.id !== data.id).slice(0, 3))
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  function share() {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) return <SkeletonPage />
  if (error) return <ErrorPage message={error} onBack={() => navigate(-1)} />
  if (!product) return null

  const images = product.images?.length
    ? product.images
    : [{ url: product.primary_image_url, alt_text: product.name, is_primary: true }]
  const stockBadge = product.stock_status === 'out_of_stock' ? { text: 'Out of Stock', cls: 'bg-error/20 text-error' }
    : product.stock_status === 'low_stock' ? { text: 'Only ' + product.stock_count + ' left', cls: 'bg-warning/20 text-warning' }
    : { text: 'In Stock', cls: 'bg-success/20 text-success' }
  const specGroups = groupSpecs(product.full_specs)

  return (
    <main className="bg-background">
      {/* Breadcrumb */}
      <div className="section-container pt-6">
        <nav className="flex items-center gap-1 text-sm text-textSubtle mb-4">
          <Link to="/" className="hover:text-accent">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/brands" className="hover:text-accent">Brands</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to={`/brand/${product.brand_slug}`} className="hover:text-accent">{product.brand_name}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-text line-clamp-1">{product.name}</span>
        </nav>
      </div>

      <div className="section-container pb-12">
        {/* TOP: gallery + buy box */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Gallery */}
          <div>
            <div className="aspect-square bg-surfaceElevated border border-border rounded-2xl overflow-hidden mb-3">
              <img
                src={images[activeImage]?.url || product.primary_image_url}
                alt={images[activeImage]?.alt_text || product.name}
                className="w-full h-full object-contain p-6"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition-colors ${
                      i === activeImage ? 'border-accent' : 'border-border hover:border-borderHover'
                    }`}
                  >
                    <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-contain p-2 bg-surfaceElevated" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Buy box */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-accent/20 text-accent text-xs font-semibold px-2 py-1 rounded-lg">{product.brand_name}</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${stockBadge.cls}`}>{stockBadge.text}</span>
              {product.condition && product.condition !== 'new' && (
                <span className="bg-surfaceElevated text-textMuted text-xs font-semibold px-2 py-1 rounded-lg capitalize">{product.condition}</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-text mb-2">{product.name}</h1>
            {product.variant && <p className="text-textMuted mb-4">{product.variant}</p>}

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-4xl font-bold text-text">{formatPrice(product.price_bdt)}</span>
              {product.compare_price_bdt && product.compare_price_bdt > product.price_bdt && (
                <span className="text-lg text-textSubtle line-through">{formatPrice(product.compare_price_bdt)}</span>
              )}
            </div>
            <p className="text-xs text-textSubtle mb-6">Inclusive of VAT • Free delivery all over Bangladesh</p>

            {product.short_desc && (
              <p className="text-textMuted mb-6 leading-relaxed">{product.short_desc}</p>
            )}

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <AddToCartButton product={product} />
              <button className="btn-secondary py-3.5 px-5 flex items-center justify-center gap-2">
                <Heart className="w-5 h-5" />
                <span className="hidden sm:inline">Wishlist</span>
              </button>
              <button onClick={share} className="btn-secondary py-3.5 px-5 flex items-center justify-center gap-2">
                {copied ? <Check className="w-5 h-5 text-success" /> : <Share2 className="w-5 h-5" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
              </button>
            </div>

            {/* Trust strip */}
            <div className="grid grid-cols-3 gap-2 p-4 bg-surface border border-border rounded-xl">
              {[
                { icon: Truck, label: 'Free Delivery', sub: '2-5 days' },
                { icon: Shield, label: `${product.warranty_months || 12}mo Warranty`, sub: 'Official' },
                { icon: RotateCcw, label: '7-Day Return', sub: 'Easy refund' },
              ].map((it) => (
                <div key={it.label} className="flex flex-col items-center text-center">
                  <it.icon className="w-5 h-5 text-accent mb-1" />
                  <p className="text-xs font-semibold text-text">{it.label}</p>
                  <p className="text-[10px] text-textSubtle">{it.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SPECS — progressive disclosure */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-text mb-6">Full Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specGroups.map((g) => (
              <div key={g.title} className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
                    <g.icon className="w-4 h-4 text-accent" />
                  </div>
                  <h3 className="font-semibold text-text">{g.title}</h3>
                </div>
                <dl className="grid grid-cols-1 gap-2">
                  {g.rows.map((r) => (
                    <div key={r.key} className="flex justify-between items-center text-sm py-1.5 border-b border-border/50 last:border-0">
                      <dt className="text-textSubtle">{r.label}</dt>
                      <dd className="text-text font-medium text-right">{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
          {product.long_desc && (
            <div className="mt-6 bg-surface border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-text mb-2">Description</h3>
              <p className="text-textMuted leading-relaxed">{product.long_desc}</p>
            </div>
          )}
        </section>

        {/* RELATED */}
        {related.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-2xl font-bold text-text">More from {product.brand_name}</h2>
              <Link to={`/brand/${product.brand_slug}`} className="text-sm text-textMuted hover:text-accent flex items-center gap-1">
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((p) => (
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
          </section>
        )}
      </div>
    </main>
  )
}

function SkeletonPage() {
  return (
    <main className="section-container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-pulse">
        <div>
          <div className="aspect-square bg-surfaceElevated rounded-2xl" />
          <div className="flex gap-2 mt-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="w-20 h-20 bg-surfaceElevated rounded-lg" />)}
          </div>
        </div>
        <div>
          <div className="h-4 bg-surfaceElevated rounded w-1/4 mb-3" />
          <div className="h-8 bg-surfaceElevated rounded w-3/4 mb-2" />
          <div className="h-4 bg-surfaceElevated rounded w-1/2 mb-6" />
          <div className="h-10 bg-surfaceElevated rounded w-1/3 mb-6" />
          <div className="h-14 bg-surfaceElevated rounded mb-3" />
          <div className="h-20 bg-surfaceElevated rounded" />
        </div>
      </div>
    </main>
  )
}

function ErrorPage({ message, onBack }) {
  return (
    <main className="section-container py-16 text-center">
      <p className="text-5xl mb-4">😕</p>
      <h2 className="text-2xl font-bold text-text mb-2">We couldn't find that phone</h2>
      <p className="text-textMuted mb-6">{message}</p>
      <div className="flex justify-center gap-3">
        <button onClick={onBack} className="btn-secondary">Go back</button>
        <Link to="/" className="btn-primary">Home</Link>
      </div>
    </main>
  )
}


function AddToCartButton({ product }) {
  const { add } = useCart()
  const [added, setAdded] = useState(false)
  const navigate = useNavigate()
  const isOut = product.stock_status === 'out_of_stock'

  function handleAdd() {
    if (isOut) return
    add({
      id: product.id,
      slug: product.slug,
      name: product.name,
      variant: product.variant,
      brand: product.brand_name,
      image: product.primary_image_url,
      unit_price_bdt: product.price_bdt,
    }, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex-1 flex gap-2">
      <button
        onClick={handleAdd}
        disabled={isOut}
        className="btn-primary flex-1 text-base py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {added ? (
          <><CheckCircle2 className="w-5 h-5" /> Added!</>
        ) : (
          <><ShoppingCart className="w-5 h-5" /> {isOut ? 'Out of Stock' : 'Add to Cart'}</>
        )}
      </button>
      <button
        onClick={() => { handleAdd(); setTimeout(() => navigate('/cart'), 200) }}
        disabled={isOut}
        className="btn-secondary py-3.5 px-5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Buy Now
      </button>
    </div>
  )
}
