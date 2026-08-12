import { Link, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react'
import { useWishlist } from '../lib/wishlist'
import { useCart } from '../lib/cart'
import { BackButton } from '../components/ui/BackButton'

function formatPrice(bdt) {
  if (bdt == null) return '—'
  return '৳' + Number(bdt).toLocaleString('en-IN')
}

export function WishlistPage() {
  const { items, remove, clear } = useWishlist()
  const { add } = useCart()
  const navigate = useNavigate()

  function moveToCart(item) {
    add({
      id: item.slug,
      slug: item.slug,
      name: item.name,
      variant: item.variant,
      brand: item.brand,
      image: item.image,
      unit_price_bdt: item.price_bdt,
    }, 1)
    remove(item.slug)
    navigate('/cart')
  }

  if (items.length === 0) {
    return (
      <main className="section-container py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-neon-green/10 border border-neon-green/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-neon-green" />
          </div>
          <h1 className="text-2xl font-bold text-main-text mb-2">Your wishlist is empty</h1>
          <p className="text-sec-text mb-6">Tap the heart icon on any phone to save it here.</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            Browse Phones <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="section-container py-8"><div className="mb-4"><BackButton /></div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-main-text">Your Wishlist ({items.length})</h1>
          <p className="text-sm text-sec-text mt-1">Phones you saved for later.</p>
        </div>
        <button onClick={clear} className="text-sm text-muted-text hover:text-danger">Clear all</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {items.map((it) => (
          <div key={it.slug} className="card p-5">
            <Link to={`/product/${it.slug}`} className="block">
              <div className="aspect-square bg-elev-bg rounded-xl overflow-hidden mb-3">
                <img src={it.image} alt={it.name} className="w-full h-full object-contain p-4" />
              </div>
              <span className="text-[10px] uppercase tracking-wider text-neon-green font-bold">{it.brand}</span>
              <h3 className="font-semibold text-main-text text-sm line-clamp-1">{it.name}</h3>
              <p className="text-xs text-sec-text line-clamp-1">{it.variant}</p>
              <p className="font-bold text-main-text mt-2">{formatPrice(it.price_bdt)}</p>
            </Link>
            <div className="flex gap-2 mt-3">
              <button onClick={() => moveToCart(it)} className="btn-primary flex-1 text-xs py-2 flex items-center justify-center gap-1">
                <ShoppingCart className="w-3 h-3" /> Move to Cart
              </button>
              <button onClick={() => remove(it.slug)} className="btn-ghost p-2 text-muted-text hover:text-danger" aria-label="Remove">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
