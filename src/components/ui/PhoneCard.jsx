import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, GitCompare, Heart, Check } from 'lucide-react'
import { memo, useState } from 'react'
import { useCart } from '../../lib/cart'
import { useWishlist } from '../../lib/wishlist'
import { add as compareAdd, has as compareHas } from '../../lib/compare'

// Memoized — phone cards re-render frequently in lists
export const PhoneCard = memo(function PhoneCard({ phone }) {
  const navigate = useNavigate()
  const { add } = useCart()
  const { has: inWishlist, toggle: toggleWish } = useWishlist()
  const [added, setAdded] = useState(false)

  const slug = phone.slug || phone.id
  const isInCompare = compareHas(slug)
  const isInWish = inWishlist(slug)
  const productHref = `/product/${slug}`

  const productData = {
    slug,
    id: phone.id || slug,
    name: phone.name,
    variant: phone.variant,
    brand: phone.brand,
    image: phone.image,
    unit_price_bdt: phone.unit_price_bdt ?? phone.price_bdt,
    price_bdt: phone.price_bdt ?? phone.unit_price_bdt,
  }

  function handleBuy(e) {
    e.preventDefault()
    e.stopPropagation()
    add(productData, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  function handleCompare(e) {
    e.preventDefault()
    e.stopPropagation()
    const ok = compareAdd(productData)
    if (ok) navigate('/compare')
  }

  function handleWish(e) {
    e.preventDefault()
    e.stopPropagation()
    toggleWish(productData)
  }

  // The entire card is wrapped in a Link. Inner buttons use e.preventDefault()
  // to suppress the link navigation when they are clicked.
  return (
    <Link
      to={productHref}
      className="card p-5 relative group block transition-transform hover:-translate-y-0.5"
      role="article"
      aria-label={`View ${phone.name} details`}
    >
      {/* Image */}
      <div className="aspect-square bg-surfaceElevated rounded-xl flex items-center justify-center mb-4 overflow-hidden">
        {phone.image ? (
          <img
            src={phone.image}
            alt={phone.name}
            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">📱</div>
        )}
      </div>

      <div className="inline-block bg-accent/20 text-accent text-xs font-semibold px-2 py-1 rounded-lg mb-2">
        {phone.brand}
      </div>
      <h3 className="font-semibold text-text text-base mb-1 line-clamp-1">{phone.name}</h3>
      <p className="text-textMuted text-sm mb-3">{phone.variant}</p>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-xl font-bold text-text">{phone.price}</span>
        {phone.comparePrice && (
          <span className="text-sm text-textSubtle line-through">{phone.comparePrice}</span>
        )}
        <span className="text-xs text-textSubtle">BDT</span>
      </div>

      {/* Floating action buttons (top-right) — preventDefault to not navigate */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          onClick={handleWish}
          aria-label={isInWish ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isInWish
              ? 'bg-danger/20 text-danger border border-danger/30'
              : 'bg-surfaceElevated/80 backdrop-blur text-sec-text hover:text-danger border border-border'
          }`}
        >
          <Heart className={`w-4 h-4 ${isInWish ? 'fill-current' : ''}`} />
        </button>
        <button
          type="button"
          onClick={handleCompare}
          aria-label={isInCompare ? 'Already in compare' : 'Add to compare'}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isInCompare
              ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
              : 'bg-surfaceElevated/80 backdrop-blur text-sec-text hover:text-neon-blue border border-border'
          }`}
        >
          <GitCompare className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom CTAs — Buy button preventDefault to not navigate */}
      <div className="flex gap-2 relative z-10">
        <span className="btn-primary flex-1 py-2 text-sm text-center select-none">
          View
        </span>
        <button
          type="button"
          onClick={handleBuy}
          className="btn-secondary py-2 px-3 text-sm flex items-center justify-center gap-1 min-w-[80px]"
        >
          {added ? (
            <>
              <Check className="w-3 h-3" /> Added
            </>
          ) : (
            <>
              <ShoppingCart className="w-3 h-3" /> Buy
            </>
          )}
        </button>
      </div>
    </Link>
  )
})
