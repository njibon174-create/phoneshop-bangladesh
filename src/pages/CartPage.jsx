import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, ChevronRight, ArrowRight, Truck, Store } from 'lucide-react'
import { useCart, formatPrice } from '../lib/cart'
import { BackButton } from '../components/ui/BackButton'

export function CartPage() {
  const { items, setQuantity, remove, subtotal, SHIPPING_HOME, SHIPPING_PICKUP } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <main className="section-container py-16">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-neon-green/10 border border-neon-green/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-neon-green" />
          </div>
          <h1 className="text-2xl font-bold text-main-text mb-2">Your cart is empty</h1>
          <p className="text-sec-text mb-6">Browse our collection and add a phone to get started.</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            Shop Phones <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="section-container py-8">
      <div className="mb-4"><BackButton /></div>
      <h1 className="text-3xl font-bold text-main-text mb-6">Your Cart ({items.length})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.slug} className="card p-4 flex gap-4">
              <Link to={`/product/${item.slug}`} className="shrink-0 w-24 h-24 bg-elev-bg rounded-xl overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase tracking-wider text-neon-green font-bold">{item.brand}</span>
                    <h3 className="font-semibold text-main-text text-sm line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-sec-text line-clamp-1">{item.variant}</p>
                  </div>
                  <button
                    onClick={() => remove(item.slug)}
                    className="text-muted-text hover:text-danger shrink-0 p-1"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 bg-elev-bg border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(item.slug, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-sec-text hover:text-neon-green"
                      aria-label="Decrease"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold text-main-text">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.slug, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-sec-text hover:text-neon-green"
                      aria-label="Increase"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-main-text">{formatPrice(item.unit_price_bdt * item.quantity)}</p>
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-muted-text">{formatPrice(item.unit_price_bdt)} each</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4">Order Summary</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-sec-text">
                <span>Subtotal</span>
                <span className="text-main-text font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sec-text">
                <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Home delivery</span>
                <span className="text-main-text font-medium">+ {formatPrice(SHIPPING_HOME)}</span>
              </div>
              <div className="flex justify-between text-sec-text">
                <span className="flex items-center gap-1"><Store className="w-3 h-3" /> Shop pickup</span>
                <span className="text-neon-green font-medium">FREE</span>
              </div>
            </div>
            <div className="border-t border-border pt-3 mb-4">
              <div className="flex justify-between text-base">
                <span className="font-semibold text-main-text">Total</span>
                <span className="font-bold text-neon-green">{formatPrice(subtotal + SHIPPING_HOME)}</span>
              </div>
              <p className="text-xs text-muted-text mt-1">Pay cash on delivery</p>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              Proceed to Checkout <ChevronRight className="w-4 h-4" />
            </button>
            <Link to="/" className="block text-center text-xs text-muted-text hover:text-neon-green mt-3">
              Continue shopping
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
