import { BackButton } from '../components/ui/BackButton'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, Phone, MessageCircle, CheckCircle2, Clock, Package, Truck, Store, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

const STATUS_STEPS = [
  { key: 'pending', icon: Clock, label: 'Order placed' },
  { key: 'confirmed', icon: CheckCircle2, label: 'Confirmed' },
  { key: 'processing', icon: Package, label: 'Packed' },
  { key: 'shipped', icon: Truck, label: 'Shipped' },
  { key: 'delivered', icon: CheckCircle2, label: 'Delivered' },
]

const STATUS_INDEX = { pending: 0, confirmed: 1, processing: 2, shipped: 3, delivered: 4, cancelled: -1 }

function formatPrice(bdt) {
  if (bdt == null) return '—'
  return '৳' + Number(bdt).toLocaleString('en-IN')
}

export function OrderTrackingPage() {
  const [params] = useSearchParams()
  const [input, setInput] = useState(params.get('order') || '')
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  async function search(e) {
    e?.preventDefault()
    setError(null)
    setSearched(true)
    setLoading(true)
    try {
      const { data: orderRow, error: oErr } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', input.trim())
        .maybeSingle()
      if (oErr) throw oErr
      if (!orderRow) {
        setOrder(null)
        setItems([])
        return
      }
      setOrder(orderRow)
      const { data: itemsRows } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderRow.id)
      setItems(itemsRows || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="section-container py-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-main-text mb-2">Track your order</h1>
        <p className="text-sec-text">Enter your order number to see the current status.</p>
      </header>

      <form onSubmit={search} className="mb-8">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-2xl px-4 py-3 focus-within:border-neon-green">
          <Search className="w-5 h-5 text-muted-text shrink-0" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. BD-20260812-0001"
            className="flex-1 bg-transparent text-main-text outline-none placeholder:text-muted-text font-mono"
            required
          />
          <button type="submit" disabled={loading} className="btn-primary text-sm py-2 px-4">
            {loading ? '...' : 'Track'}
          </button>
        </div>
      </form>

      {error && (
        <div className="card p-4 mb-4 border-danger/40 bg-danger/10">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {searched && !loading && !order && (
        <div className="text-center py-12 bg-surface border border-border rounded-2xl">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-xl font-semibold text-main-text mb-2">Order not found</h3>
          <p className="text-sm text-sec-text mb-2">No order matches "<span className="font-mono">{input}</span>".</p>
          <p className="text-xs text-muted-text">Check the number and try again — order numbers start with BD-.</p>
        </div>
      )}

      {order && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted-text mb-1">Order</p>
                <p className="font-mono font-bold text-neon-green text-lg">{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-text mb-1">Placed</p>
                <p className="text-sm text-main-text">{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Status timeline */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((s, i) => {
                  const current = STATUS_INDEX[order.order_status] ?? 0
                  const isComplete = i <= current
                  const isCurrent = i === current
                  return (
                    <div key={s.key} className="flex-1 flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isComplete
                          ? 'bg-neon-green text-black shadow-neon-green'
                          : 'bg-elev-bg text-muted-text border border-border'
                      } ${isCurrent ? 'ring-2 ring-neon-green/40 ring-offset-2 ring-offset-background' : ''}`}>
                        <s.icon className="w-4 h-4" />
                      </div>
                      <p className={`text-[10px] mt-2 text-center uppercase tracking-wider font-medium ${isComplete ? 'text-main-text' : 'text-muted-text'}`}>{s.label}</p>
                    </div>
                  )
                })}
              </div>
              <div className="relative h-0.5 bg-border mt-[-1.7rem] mx-5">
                <div className="absolute top-0 left-0 h-full bg-neon-green transition-all" style={{
                  width: `${(STATUS_INDEX[order.order_status] ?? 0) / (STATUS_STEPS.length - 1) * 100}%`
                }} />
              </div>
            </div>

            {order.order_status === 'cancelled' && (
              <div className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                This order has been cancelled. Please contact us if you need help.
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-3">Items ({items.length})</h2>
            <div className="space-y-2">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between items-center text-sm py-2 border-b border-border/50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-main-text line-clamp-1">{it.product_name}</p>
                    <p className="text-xs text-muted-text">{it.product_variant} • Qty {it.quantity}</p>
                  </div>
                  <p className="font-semibold text-main-text shrink-0 ml-3">{formatPrice(it.line_total_bdt)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 mt-3 space-y-1 text-sm">
              <div className="flex justify-between text-sec-text">
                <span>Subtotal</span>
                <span className="text-main-text">{formatPrice(order.subtotal_bdt)}</span>
              </div>
              <div className="flex justify-between text-sec-text">
                <span>Shipping</span>
                <span className={order.shipping_bdt === 0 ? 'text-neon-green font-medium' : 'text-main-text'}>
                  {order.shipping_bdt === 0 ? 'FREE' : formatPrice(order.shipping_bdt)}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-border mt-2">
                <span className="font-semibold text-main-text">Total</span>
                <span className="text-2xl font-bold text-neon-green">{formatPrice(order.total_bdt)}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-3">Delivery</h2>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-neon-green/10 rounded-lg flex items-center justify-center text-neon-green shrink-0">
                {order.delivery_method === 'pickup' ? <Store className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm text-main-text font-medium mb-1">
                  {order.delivery_method === 'pickup' ? 'Shop Pickup' : 'Home Delivery'}
                </p>
                <p className="text-xs text-sec-text">{order.shipping_address}</p>
                <p className="text-xs text-sec-text">{order.shipping_city}</p>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-elev-bg border-neon-green/20 text-center">
            <p className="text-sm text-sec-text mb-3">Need help with this order?</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <a href="tel:+8801700000000" className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-2">
                <Phone className="w-4 h-4" /> Call us
              </a>
              <a href={`https://wa.me/8801700000000?text=${encodeURIComponent(`Hi, I need help with order ${order.order_number}`)}`} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
