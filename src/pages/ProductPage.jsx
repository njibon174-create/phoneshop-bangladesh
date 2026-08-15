import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ChevronRight, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, Check, Cpu, Battery, Camera, HardDrive, Smartphone, Bell, CheckCircle2 } from 'lucide-react'
import { useCart } from '../lib/cart'
import { useWishlist } from '../lib/wishlist'
import { BackButton } from '../components/ui/BackButton'
import { PhoneCard } from '../components/ui/PhoneCard'
import { RestockRequestModal } from '../components/ui/RestockRequestModal'
import { fetchProductBySlug, fetchProductsByBrand } from '../lib/queries'
import { motion } from 'framer-motion'

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

const SPEC_LABELS = {
  display: 'Display', refresh_rate_hz: 'Refresh Rate', chip: 'Processor',
  os: 'Operating System', ram_gb: 'RAM', storage_gb: 'Storage',
  rear_camera: 'Rear Camera', front_camera: 'Front Camera', video_4k: 'Video',
  battery_mah: 'Battery', charging_w: 'Charging', wireless_charging_w: 'Wireless Charging',
  weight_g: 'Weight', ip_rating: 'IP Rating', five_g: '5G',
}

function prettyKey(k) { return SPEC_LABELS[k] || k.replace(/_/g, ' ').replace(/\\b\\w/g, c => c.toUpperCase()) }
function pickSpec(fullSpecs, key) {
  if (!fullSpecs) return null
  const v = fullSpecs[key]
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  return String(v)
}
function groupSpecs(fullSpecs) {
  return SPEC_GROUPS.map(g => {
    const rows = g.keys.map(key => ({ key, value: pickSpec(fullSpecs, key), label: prettyKey(key) })).filter(r => r.value)
    return { title: g.title, icon: g.icon, rows }
  }).filter(g => g.rows.length > 0)
}

function ProductSkeleton() {
  return (
    <main className="bg-brand-white">
      <div className="section-container pt-6"><div className="h-4 w-64 bg-brand-offwhite rounded animate-pulse mb-6" /></div>
      <div className="section-container pb-12">\n        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-pulse">\n          <div className="aspect-square bg-brand-offwhite rounded-3xl" />\n          <div className="space-y-4"><div className="h-6 w-24 bg-brand-offwhite rounded" /><div className="h-10 w-3/4 bg-brand-offwhite rounded" /><div className="h-8 w-32 bg-brand-offwhite rounded" /></div>\n        </div>\n      </div>\n    </main>\n  )
}

function ProductError({ message }) {
  const navigate = useNavigate()
  return (
    <main className="section-container py-16 text-center">
      <p className="text-5xl mb-4">⚠️</p>
      <h1 className="text-2xl font-bold text-brand-dark mb-2">Couldn't load product</h1>
      <p className="text-brand-grey mb-6">{message}</p>
      <button onClick={() => navigate('/')} className="btn-primary">Back to Home</button>
    </main>
  )
}

function VariantSelector({ variants = [], selectedVariant, onSelect }) {
  const colors = [...new Map(variants.map(v => [v.color, v])).values()]
  const rams    = [...new Map(variants.map(v => [v.ram_gb, v])).values()]
  const roms    = [...new Map(variants.map(v => [v.rom_gb, v])).values()]

  function getVariant(color, ram, rom) {
    return variants.find(v =>
      (v.color || '') === (color || '') &&
      Number(v.ram_gb) === Number(ram) &&
      Number(v.rom_gb) === Number(rom)
    )
  }

  const selected = selectedVariant || {}

  return (
    <div className="space-y-4">
      {colors.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-brand-grey mb-2 uppercase tracking-wide">
            Color{selected.color ? `: ${selected.color}` : ''}
          </label>
          <div className="flex flex-wrap gap-2">
            {colors.map(v => (
              <button
                key={v.color}
                onClick={() => onSelect(v)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  selected.color === v.color
                    ? 'border-brand-accent bg-brand-accent/10 text-brand-accent font-semibold'
                    : 'border-border-light bg-white text-brand-grey hover:border-brand-accent'
                }`}
              >
                {v.color}
              </button>
            ))}\n          </div>\n        </div>\n      )}

      {rams.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-brand-grey mb-2 uppercase tracking-wide">\n            RAM{selected.ram_gb ? `: ${selected.ram_gb} GB` : ''}\n          </label>
          <div className="flex flex-wrap gap-2">\n            {rams.map(v => {\n              const comboStock = variants.filter(x => x.color === selected.color && Number(x.ram_gb) === Number(v.ram_gb)).reduce((s, x) => s + (x.stock_count || 0), 0)\n              return (\n                <button\n                  key={v.ram_gb}\n                  onClick={() => {\n                    const match = getVariant(selected.color, v.ram_gb, selected.rom_gb) || getVariant(selected.color, v.ram_gb, roms[0]?.rom_gb) || v\n                    onSelect(match)\n                  }}\n                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    Number(selected.ram_gb) === Number(v.ram_gb)\n                      ? 'border-brand-accent bg-brand-accent/10 text-brand-accent font-semibold'\n                      : comboStock > 0\n                      ? 'border-border-light bg-white text-brand-grey hover:border-brand-accent'\n                      : 'border-border-light bg-brand-offwhite text-brand-grey opacity-40 cursor-not-allowed'\n                  }`}\n                  disabled={comboStock === 0}\n                >\n                  {v.ram_gb} GB{comboStock > 0 ? '' : ' · Out'}\n                </button>\n              )\n            })}\n          </div>\n        </div>\n      )}

      {roms.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-brand-grey mb-2 uppercase tracking-wide">\n            Storage{selected.rom_gb ? `: ${selected.rom_gb} GB` : ''}\n          </label>
          <div className="flex flex-wrap gap-2">\n            {roms.map(v => {\n              const comboStock = variants.filter(x =>\n                x.color === selected.color &&\n                Number(x.ram_gb) === Number(selected.ram_gb) &&\n                Number(x.rom_gb) === Number(v.rom_gb)\n              ).reduce((s, x) => s + (x.stock_count || 0), 0)\n              return (\n                <button\n                  key={v.rom_gb}\n                  onClick={() => {\n                    const match = getVariant(selected.color, selected.ram_gb, v.rom_gb) || v\n                    onSelect(match)\n                  }}\n                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    Number(selected.rom_gb) === Number(v.rom_gb)\n                      ? 'border-brand-accent bg-brand-accent/10 text-brand-accent font-semibold'\n                      : comboStock > 0\n                      ? 'border-border-light bg-white text-brand-grey hover:border-brand-accent'\n                      : 'border-border-light bg-brand-offwhite text-brand-grey opacity-40 cursor-not-allowed'\n                  }`}\n                  disabled={comboStock === 0}\n                >\n                  {v.rom_gb} GB{comboStock > 0 ? '' : ' · Out'}\n                </button>\n              )\n            })}\n          </div>\n        </div>\n      )}
    </div>\n  )\n}

export function ProductPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { has: inWishlist, toggle: toggleWish } = useWishlist()
  const { add } = useCart()

  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [copied, setCopied] = useState(false)
  const [restockOpen, setRestockOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setProduct(null)
    setRelated([])
    setSelectedVariant(null)
    async function load() {
      try {
        const data = await fetchProductBySlug(slug)
        if (cancelled) return
        if (!data) { setError('Product not found'); return }
        setProduct(data)
        setVariants(data.variants || [])
        if (data.variants?.length) {
          const defaultV = data.variants.find(v => v.stock_count > 0) || data.variants[0]
          setSelectedVariant(defaultV)
          if (defaultV?.image_url) setActiveImage(0)
        }
        try {
          const relatedData = await fetchProductsByBrand(data.brand_slug, { limit: 4 })
          if (!cancelled) setRelated((relatedData || []).filter(r => r.id !== data.id).slice(0, 3))
        } catch { /* ignore */ }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Something went wrong')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug])

  const share = useCallback(() => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (navigator.share) { navigator.share({ title: product?.name || '', url }).catch(() => {}) }
    else if (navigator.clipboard) { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  }, [product?.name])

  const addToCart = useCallback(() => {
    if (!selectedVariant || !product) return
    add({
      slug: product.slug,
      variant_id: selectedVariant.id,
      name: `${product.brand_name} ${product.name}`,
      variant: selectedVariant.variant_name || `${selectedVariant.color || ''} ${selectedVariant.ram_gb}GB/${selectedVariant.rom_gb}GB`.trim(),
      brand: product.brand_name,
      image: selectedVariant.image_url || product.primary_image_url,
      unit_price_bdt: selectedVariant.mrp_bdt,
      price_bdt: selectedVariant.mrp_bdt,
    }, 1)
    setTimeout(() => navigate('/cart'), 200)
  }, [selectedVariant, product, add, navigate])

  const specGroups = useMemo(() => groupSpecs(product?.full_specs), [product?.full_specs])

  const stockCount = selectedVariant?.stock_count || 0
  const isOutOfStock = !selectedVariant || stockCount <= 0
  const stockBadge = isOutOfStock
    ? { text: 'Out of Stock', cls: 'bg-danger/10 text-danger' }
    : stockCount <= 5
    ? { text: `Only ${stockCount} left`, cls: 'bg-warning/10 text-warning' }
    : { text: 'In Stock', cls: 'bg-success/10 text-success' }

  const images = selectedVariant?.image_url
    ? [{ url: selectedVariant.image_url, alt_text: product?.name }]
    : product?.images?.length ? product.images : []

  const price = selectedVariant?.mrp_bdt || product?.min_price_bdt
  const comparePrice = selectedVariant?.compare_price_bdt || product?.compare_price_bdt

  if (loading) return <ProductSkeleton />
  if (error || !product) return <ProductError message={error || 'Product not found'} />

  return (
    <main className="bg-brand-white">
      <div className="section-container pt-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">\n          <nav className="flex items-center gap-1 text-sm text-brand-grey min-w-0 flex-1" aria-label="Breadcrumb">\n            <Link to="/" className="hover:text-brand-accent transition-colors">Home</Link>\n            <ChevronRight className="w-3 h-3" />\n            <Link to="/brands" className="hover:text-brand-accent transition-colors">Brands</Link>\n            <ChevronRight className="w-3 h-3" />\n            <Link to={`/brand/${product.brand_slug}`} className="hover:text-brand-accent transition-colors">{product.brand_name}</Link>\n            <ChevronRight className="w-3 h-3" />\n            <span className="text-brand-dark font-medium line-clamp-1">{product.name}</span>\n          </nav>\n          <BackButton />\n        </div>\n      </div>

      <div className="section-container pb-12">\n        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">\n          {/* Images */}\n          <div className="relative">\n            <motion.div \n              initial={{ opacity: 0, scale: 0.9 }}\n              animate={{ opacity: 1, scale: 1 }}\n              className="aspect-square bg-brand-offwhite border border-border-light rounded-3xl overflow-hidden mb-3 shadow-apple"\n            >\n              <img\n                src={images[activeImage]?.url || 'https://placehold.co/600x600/f5f5f7/86868b?text=No+Image'}\n                alt={images[activeImage]?.alt_text || product.name}\n                className="w-full h-full object-contain p-8"\n              />\n            </motion.div>\n            {images.length > 1 && (\n              <div className="flex gap-3 overflow-x-auto py-2">\n                {images.map((img, i) => (\n                  <button key={i} onClick={() => setActiveImage(i)}\n                    className={`shrink-0 w-20 h-20 rounded-xl border-2 overflow-hidden transition-all ${i === activeImage ? 'border-brand-accent scale-105 shadow-sm' : 'border-border-light hover:border-brand-grey'}`}>\n                    <img src={img.url} alt={img.alt_text || ''} className="w-full h-full object-contain p-2 bg-white" />\n                  </button>\n                ))}\n              </div>\n            )}\n          </div>

          {/* Product Info */}\n          <div className="flex flex-col">\n            <div className="flex items-center gap-2 mb-3">\n              <span className="bg-brand-accent/10 text-brand-accent text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">{product.brand_name}</span>\n              <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider ${stockBadge.cls}`}>{stockBadge.text}</span>\n            </div>\n            <h1 className="text-4xl font-extrabold text-brand-dark mb-2 tracking-tight">\n              {product.brand_name} {product.name}\n            </h1>\n\n            {variants.length > 0 && (\n              <div className="mb-8">\n                <VariantSelector\n                  variants={variants}\n                  selectedVariant={selectedVariant}\n                  onSelect={setSelectedVariant}\n                />\n              </div>\n            )}\n\n            <div className="flex items-baseline gap-3 mb-2">\n              <span className="text-5xl font-bold text-brand-dark">{formatPrice(price)}</span>\n              {comparePrice && comparePrice > price && (\n                <span className="text-xl text-brand-grey line-through">{formatPrice(comparePrice)}</span>\n              )}\n            </div>\n            <p className="text-sm text-brand-grey mb-8">Inclusive of all taxes • Official warranty included</p>\n\n            {product.short_desc && (\n              <p className="text-brand-grey text-lg mb-8 leading-relaxed">{product.short_desc}</p>\n            )}\n\n            <div className="flex flex-col sm:flex-row gap-4 mb-10">\n              {!isOutOfStock ? (\n                <>\n                  <button onClick={addToCart} className="btn-primary py-4 px-8 flex items-center justify-center gap-3 text-lg">\n                    <ShoppingCart className="w-5 h-5" /> Add to Cart\n                  </button>\n                  <button onClick={addToCart} className="btn-secondary py-4 px-8 flex items-center justify-center gap-3 text-lg">\n                    <CheckCircle2 className="w-5 h-5" /> Buy Now\n                  </button>\n                </>\n              ) : (\n                <button\n                  onClick={() => setRestockOpen(true)}\n                  className="btn-primary py-4 px-8 flex items-center justify-center gap-3 text-lg w-full sm:w-auto"\n                >\n                  <Bell className="w-5 h-5" /> Notify Me When In Stock\n                </button>\n              )}\n              <button\n                onClick={() => toggleWish({\n                  id: product.id,\n                  slug: product.slug,\n                  variant_id: selectedVariant?.id,\n                  name: `${product.brand_name} ${product.name}`,\n                  variant: selectedVariant?.variant_name,\n                  brand: product.brand_name,\n                  image: selectedVariant?.image_url || product.primary_image_url,\n                  unit_price_bdt: selectedVariant?.mrp_bdt,\n                  price_bdt: price,\n                })}\n                className={`btn-secondary py-4 px-8 flex items-center justify-center gap-3 text-lg transition-all ${inWishlist(selectedVariant?.id || product.id) ? 'bg-danger/10 text-danger border-danger' : ''}`}\n              >\n                <Heart className={`w-5 h-5 ${inWishlist(selectedVariant?.id || product.id) ? 'fill-current' : ''}`} />\n                <span>{inWishlist(selectedVariant?.id || product.id) ? 'In Wishlist' : 'Wishlist'}</span>\n              </button>\n              <button onClick={share} className="btn-secondary py-4 px-8 flex items-center justify-center gap-3 text-lg">\n                {copied ? <Check className="w-5 h-5 text-success" /> : <Share2 className="w-5 h-5" />}\n                <span>{copied ? 'Copied!' : 'Share'}</span>\n              </button>\n            </div>\n\n            <div className="grid grid-cols-3 gap-4 p-6 bg-brand-offwhite rounded-3xl border border-border-light">\n              <div className="flex flex-col items-center text-center">\n                <Truck className="w-6 h-6 text-brand-accent mb-2" />\n                <p className="text-xs font-bold text-brand-dark">Fast Delivery</p>\n                <p className="text-[10px] text-brand-grey">2-5 Working Days</p>\n              </div>\n              <div className="flex flex-col items-center text-center">\n                <Shield className="w-6 h-6 text-brand-accent mb-2" />\n                <p className="text-xs font-bold text-brand-dark">{product.warranty_months || 12}mo Warranty</p>\n                <p className="text-[10px] text-brand-grey">Official Support</p>\n              </div>\n              <div className="flex flex-col items-center text-center">\n                <RotateCcw className="w-6 h-6 text-brand-accent mb-2" />\n                <p className="text-xs font-bold text-brand-dark">Easy Returns</p>\n                <p className="text-[10px] text-brand-grey">7-Day Policy</p>\n              </div>\n            </div>\n          </div>\n        </div>\n\n        {specGroups.length > 0 && (\n          <section className="mb-16">\n            <h2 className="text-3xl font-bold text-brand-dark mb-8 tracking-tight">Technical Specifications</h2>\n            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">\n              {specGroups.map(g => (\n                <div key={g.title} className="bg-white border border-border-light rounded-3xl p-6 shadow-sm">\n                  <div className="flex items-center gap-3 mb-6">\n                    <div className="w-10 h-10 bg-brand-offwhite rounded-xl flex items-center justify-center">\n                      <g.icon className="w-5 h-5 text-brand-accent" />\n                    </div>\n                    <h3 className="font-bold text-brand-dark">{g.title}</h3>\n                  </div>\n                  <dl className="grid grid-cols-1 gap-3">\n                    {g.rows.map(r => (\n                      <div key={r.key} className="flex justify-between items-center py-2 border-b border-border-light last:border-0">\n                        <dt className="text-brand-grey text-sm">{r.label}</dt>\n                        <dd className="text-brand-dark font-medium text-sm text-right">{r.value}</dd>\n                      </div>\n                    ))}\n                  </dl>\n                </div>\n              ))}\n            </div>\n          </section>\n        )}\n\n        {product.long_desc && (\n          <section className="mb-16">\n            <h2 className="text-3xl font-bold text-brand-dark mb-6 tracking-tight">About this product</h2>\n            <div className="bg-brand-offwhite rounded-3xl p-8 border border-border-light">\n              <p className="text-brand-grey text-lg leading-relaxed whitespace-pre-line">{product.long_desc}</p>\n            </div>\n          </section>\n        )}\n\n        {related.length > 0 && (\n          <section>\n            <div className="flex items-end justify-between mb-8 gap-3 flex-wrap">\n              <h2 className="text-3xl font-bold text-brand-dark tracking-tight">You might also like</h2>\n              <Link to={`/brand/${product.brand_slug}`} className="text-sm text-brand-accent font-semibold hover:underline flex items-center gap-1">\n                See all {product.brand_name} <ChevronRight className="w-4 h-4" />\n              </Link>\n            </div>\n            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">\n              {related.map(p => (\n                <PhoneCard\n                  key={p.id}\n                  phone={{\n                    id: p.id,\n                    brand: p.brand_name,\n                    name: p.name,\n                    variant: p.variant_name,\n                    price: formatPrice(p.min_price_bdt),\n                    image: p.primary_image_url,\n                    slug: p.slug,\n                  }}\n                />\n              ))}\n            </div>\n          </section>\n        )}\n      </div>\n\n      {restockOpen && (\n        <RestockRequestModal\n          phone={{\n            id: product.id,\n            slug: product.slug,\n            variant_id: selectedVariant?.id,\n            name: `${product.brand_name} ${product.name}`,\n            variant: selectedVariant?.variant_name,\n            brand: product.brand_name,\n          }}\n          onClose={() => setRestockOpen(false)}\n        />\n      )}\n    </main>\n  )\n}
