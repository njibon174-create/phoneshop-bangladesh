import { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Phone, MapPin, Store, Truck, MessageCircle, ChevronRight, Copy, Package, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'

const SHOP_PICKUP_ADDRESS = {
  name: 'PhoneShop BD Flagship Store',
  address: 'House 12, Road 7, Dhanmondi',
  city: 'Dhaka',
  hours: 'Sat-Thu 10:00 AM – 8:00 PM, Fri 2:00 PM – 8:00 PM',
  phone: '+880 1700-000000',
}

export function OrderConfirmationPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const orderNumber = params.get('order')
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!orderNumber) {
        setLoading(false)
        return
      }
      try {
        const { data: orderRow } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', orderNumber)
          .maybeSingle()
        if (cancelled) return
        if (orderRow) {
          setOrder(orderRow)
          // Try to fetch order items. If the migration hasn't run yet,
          // these may fail — that's OK, we just show the order without items.
          const { data: itemsRows } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', orderRow.id)
          if (!cancelled) setItems(itemsRows || [])
        }
      } catch (e) {
        console.warn('OrderConfirmation load failed:', e)
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [orderNumber])

  function copy() {
    if (!orderNumber) return
    navigator.clipboard.writeText(orderNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <main className="section-container py-16 text-center">
        <div className="w-16 h-16 border-2 border-[#00FF88] border-t-transparent rounded-full animate-spin mx-auto" />
      </main>
    )
  }

  if (!order) {
    // Allow manual entry if order number is missing or invalid
    if (!orderNumber) {
      return (
        <main className="section-container py-16 text-center max-w-md mx-auto">
          <p className="text-5xl mb-4">📦</p>
          <h2 className="text-2xl font-bold text-main-text mb-2">No order in progress</h2>
          <p className="text-sec-text mb-6">It looks like you came here directly. Place an order first, or track an existing one.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/track" className="btn-primary inline-flex items-center gap-2">
              <Package className="w-4 h-4" /> Track order
            </Link>
            <Link to="/" className="btn-secondary inline-flex items-center gap-2">
              <ChevronRight className="w-4 h-4" /> Browse Phones
            </Link>
          </div>
        </main>
      )
    }
    return (
      <main className="section-container py-16 text-center max-w-md mx-auto">
        <p className="text-5xl mb-4">🔍</p>
        <h2 className="text-2xl font-bold text-main-text mb-2">Order not found</h2>
        <p className="text-sec-text mb-6">No order with number "{orderNumber}" exists.</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          Back to Home <ChevronRight className="w-4 h-4" />
        </Link>
      </main>
    )
  }

  const isPickup = order.delivery_method === 'pickup'

  return (
    <main className="section-container py-8 max-w-3xl">
      {/* Success banner */}
      <div className="card p-8 text-center mb-6">
        <div className="w-16 h-16 bg-[#00FF88]/15 border border-[#00FF88]/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(0,255,136,0.3)]">
          <CheckCircle2 className="w-8 h-8 text-[#00FF88]" />
        </div>
        <h1 className="text-3xl font-bold text-main-text mb-2">Order Placed!</h1>
        <p className="text-sec-text mb-6">
          Thank you, {order.customer_name}. We'll call you shortly to confirm.
        </p>

        {/* Big Order ID display */}
        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest text-muted-text mb-2">Your Order Tracking ID</p>
          <div className="inline-flex items-center gap-2 bg-elev-bg border border-neon-green/30 rounded-xl px-5 py-3 shadow-[0_0_20px_rgba(0,255,136,0.15)]">
            <span className="font-mono text-xl font-bold text-neon-green">{order.order_number}</span>
            <button onClick={copy} className="ml-2 text-muted-text hover:text-neon-green" aria-label="Copy order number">
              {copied ? <CheckCircle2 className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && <p className="text-xs text-neon-green mt-2">Copied to clipboard!</p>}
        </div>

        <button
          onClick={() => navigate(`/track?q=${encodeURIComponent(order.order_number)}`)}
          className="btn-primary inline-flex items-center gap-2 mt-2"
        >
          <Package className="w-4 h-4" />
          Track this order
        </button>
      </div>

      {/* Delivery info */}
      <div className="card p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#00FF88]/15 rounded-lg flex items-center justify-center shrink-0 text-[#00FF88]">
            {isPickup ? <Store className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-semibold text-main-text">{isPickup ? 'Shop Pickup' : 'Home Delivery'}</h2>
              <span className="badge-success">{isPickup ? 'Pickup' : 'Delivery'}</span>
            </div>
            {isPickup ? (
              <div className="text-sm text-sec-text space-y-1">
                <p className="font-semibold text-main-text">{SHOP_PICKUP_ADDRESS.name}</p>
                <p className="flex items-start gap-1">
                  <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-muted-text" />
                  {SHOP_PICKUP_ADDRESS.address}, {SHOP_PICKUP_ADDRESS.city}
                </p>
                <p className="text-xs text-muted-text">{SHOP_PICKUP_ADDRESS.hours}</p>
                <p className="text-xs text-muted-text flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {SHOP_PICKUP_ADDRESS.phone}
                </p>
              </div>
            ) : (
              <div className="text-sm text-sec-text">
                <p className="text-main-text">{order.shipping_address}</p>
                <p>{order.shipping_thana && `${order.shipping_thana}, `}{order.shipping_city}{order.shipping_postcode && ` - ${order.shipping_postcode}`}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order items */}
      {items.length > 0 ? (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-main-text mb-4">Order Items</h2>
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="flex justify-between items-center text-sm py-2 border-b border-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-main-text line-clamp-1">{it.product_name}</p>
                  <p className="text-xs text-muted-text">{it.product_variant} • Qty {it.quantity}</p>
                </div>
                <p className="font-semibold text-main-text shrink-0 ml-3">৳{Number(it.line_total_bdt).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-sec-text">
              <span>Subtotal</span>
              <span className="text-main-text">৳{Number(order.subtotal_bdt).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sec-text">
              <span>Shipping</span>
              <span className={order.shipping_bdt === 0 ? 'text-neon-green font-medium' : 'text-main-text'}>
                {order.shipping_bdt === 0 ? 'FREE' : `৳${Number(order.shipping_bdt).toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-border mt-2">
              <span className="font-semibold text-main-text">Total</span>
              <span className="text-2xl font-bold text-neon-green">৳{Number(order.total_bdt).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-5 mb-6 bg-elev-bg border-neon-green/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-[#00FF88]/15 rounded-lg flex items-center justify-center text-[#00FF88]">
              ৳
            </div>
            <div>
              <p className="text-sm text-main-text">
                <span className="font-semibold">Total: ৳{Number(order.total_bdt).toLocaleString('en-IN')}</span>
              </p>
              <p className="text-xs text-sec-text">Order details will appear in your account</p>
            </div>
          </div>
        </div>
      )}

      {/* What happens next */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-main-text mb-3">What happens next?</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-[#00FF88]/15 text-[#00FF88] rounded-full flex items-center justify-center shrink-0 text-xs font-bold">1</span>
            <span className="text-sec-text">We'll call you on <span className="text-main-text font-medium">{order.customer_phone}</span> within 1 hour to confirm your order.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-[#00FF88]/15 text-[#00FF88] rounded-full flex items-center justify-center shrink-0 text-xs font-bold">2</span>
            <span className="text-sec-text">
              {isPickup
                ? 'Your phone will be reserved and ready for pickup at our store.'
                : 'Your phone will be packed and dispatched. Delivery usually takes 2-5 days.'}
            </span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-[#00FF88]/15 text-[#00FF88] rounded-full flex items-center justify-center shrink-0 text-xs font-bold">3</span>
            <span className="text-sec-text">
              {isPickup
                ? 'Pay cash when you collect at the store.'
                : 'Pay cash to the delivery person when you receive your phone. Inspect first, pay after.'}
            </span>
          </li>
        </ol>
      </div>

      {/* Contact */}
      <div className="card p-5 bg-elev-bg border-neon-green/20 text-center">
        <p className="text-sm text-sec-text mb-3">Have questions? Reach us anytime</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <a href="tel:+8801700000000" className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-2">
            <Phone className="w-4 h-4" /> Call us
          </a>
          <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
        </div>
      </div>

      <div className="text-center mt-8 flex gap-4 justify-center flex-wrap">
        <Link to={`/track?q=${encodeURIComponent(order.order_number)}`} className="text-sm text-neon-green hover:text-neon-green/80 inline-flex items-center gap-1">
          <Package className="w-4 h-4" /> Track this order
        </Link>
        <Link to="/" className="text-sm text-sec-text hover:text-neon-green inline-flex items-center gap-1">
          Continue shopping <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </main>
  )
}
