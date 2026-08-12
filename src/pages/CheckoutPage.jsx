import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Truck, Store, ChevronRight, ChevronLeft, MapPin, User, Phone, Mail, FileText, Wallet } from 'lucide-react'
import { useCart, formatPrice } from '../lib/cart'
import { createOrder } from '../lib/queries'

const SHOP_PICKUP_ADDRESS = {
  name: 'PhoneShop BD Flagship Store',
  address: 'House 12, Road 7, Dhanmondi',
  city: 'Dhaka',
  hours: 'Sat-Thu 10:00 AM – 8:00 PM, Fri 2:00 PM – 8:00 PM',
  phone: '+880 1700-000000',
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clear, SHIPPING_HOME, SHIPPING_PICKUP } = useCart()
  const [deliveryMethod, setDeliveryMethod] = useState('home')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    thana: '',
    postcode: '',
    notes: '',
  })

  const shipping = deliveryMethod === 'pickup' ? SHIPPING_PICKUP : SHIPPING_HOME
  const total = subtotal + shipping

  function update(k, v) {
    setForm((s) => ({ ...s, [k]: v }))
  }

  async function submit(e) {
    e.preventDefault()
    setError(null)

    if (items.length === 0) {
      setError('Your cart is empty')
      return
    }
    if (!form.name.trim()) return setError('Please enter your name')
    if (!form.phone.trim()) return setError('Please enter your phone number')
    if (deliveryMethod === 'home') {
      if (!form.address.trim()) return setError('Please enter your delivery address')
      if (!form.city.trim()) return setError('Please enter your city')
    }

    setSubmitting(true)
    try {
      const customer = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: deliveryMethod === 'pickup'
          ? `Pickup at: ${SHOP_PICKUP_ADDRESS.name}, ${SHOP_PICKUP_ADDRESS.address}`
          : form.address.trim(),
        city: deliveryMethod === 'pickup' ? SHOP_PICKUP_ADDRESS.city : form.city.trim(),
        thana: form.thana.trim() || null,
        postcode: form.postcode.trim() || null,
        notes: form.notes.trim() || null,
      }
      const itemsForOrder = items.map((it) => ({
        product_id: it.id,
        quantity: it.quantity,
      }))
      const { order } = await createOrder({
        customer,
        items: itemsForOrder,
        deliveryMethod,
      })
      clear()
      navigate(`/order-confirmed?order=${encodeURIComponent(order.order_number)}`)
    } catch (e) {
      setError(e.message || 'Something went wrong placing your order')
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <main className="section-container py-16 text-center">
        <h1 className="text-2xl font-bold text-main-text mb-4">Nothing to check out</h1>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          Browse Phones <ChevronRight className="w-4 h-4" />
        </Link>
      </main>
    )
  }

  return (
    <main className="section-container py-8">
      <Link to="/cart" className="inline-flex items-center gap-1 text-sm text-sec-text hover:text-neon-green mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to cart
      </Link>

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          {/* Delivery method */}
          <section className="card p-5">
            <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neon-green" /> Delivery Method
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DeliveryOption
                active={deliveryMethod === 'home'}
                onClick={() => setDeliveryMethod('home')}
                icon={<Truck className="w-5 h-5" />}
                title="Home Delivery"
                desc="Get it delivered to your doorstep"
                price={`+ ৳${SHIPPING_HOME}`}
              />
              <DeliveryOption
                active={deliveryMethod === 'pickup'}
                onClick={() => setDeliveryMethod('pickup')}
                icon={<Store className="w-5 h-5" />}
                title="Shop Pickup"
                desc="Pick up at our Dhaka store"
                price="FREE"
                highlight
              />
            </div>
            {deliveryMethod === 'pickup' && (
              <div className="mt-4 p-4 bg-elev-bg border border-neon-green/20 rounded-xl text-sm">
                <p className="font-semibold text-main-text mb-1">{SHOP_PICKUP_ADDRESS.name}</p>
                <p className="text-sec-text text-xs">{SHOP_PICKUP_ADDRESS.address}, {SHOP_PICKUP_ADDRESS.city}</p>
                <p className="text-muted-text text-xs mt-1">{SHOP_PICKUP_ADDRESS.hours}</p>
                <p className="text-muted-text text-xs">Phone: {SHOP_PICKUP_ADDRESS.phone}</p>
              </div>
            )}
          </section>

          {/* Customer info */}
          <section className="card p-5">
            <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-neon-green" /> Your Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Your name"
                  className="input"
                  required
                />
              </Field>
              <Field label="Phone Number" required>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="input"
                  required
                />
              </Field>
              <Field label="Email (optional)" className="sm:col-span-2">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
              </Field>
            </div>
          </section>

          {/* Address — only if home delivery */}
          {deliveryMethod === 'home' && (
            <section className="card p-5">
              <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-neon-green" /> Delivery Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Full Address" required className="sm:col-span-2">
                  <textarea
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    placeholder="House, Road, Area, etc."
                    rows={2}
                    className="input resize-none"
                    required
                  />
                </Field>
                <Field label="City" required>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => update('city', e.target.value)}
                    placeholder="e.g. Dhaka"
                    className="input"
                    required
                  />
                </Field>
                <Field label="Area / Thana">
                  <input
                    type="text"
                    value={form.thana}
                    onChange={(e) => update('thana', e.target.value)}
                    placeholder="e.g. Dhanmondi"
                    className="input"
                  />
                </Field>
                <Field label="Postcode" className="sm:col-span-2">
                  <input
                    type="text"
                    value={form.postcode}
                    onChange={(e) => update('postcode', e.target.value)}
                    placeholder="e.g. 1205"
                    className="input"
                  />
                </Field>
                <Field label="Order Notes (optional)" className="sm:col-span-2">
                  <textarea
                    value={form.notes}
                    onChange={(e) => update('notes', e.target.value)}
                    placeholder="Landmark, delivery instructions, etc."
                    rows={2}
                    className="input resize-none"
                  />
                </Field>
              </div>
            </section>
          )}

          {/* Payment — COD only */}
          <section className="card p-5">
            <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-neon-green" /> Payment Method
            </h2>
            <div className="flex items-start gap-3 p-4 bg-elev-bg border border-neon-green/30 rounded-xl">
              <div className="w-10 h-10 bg-neon-green/15 rounded-lg flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5 text-neon-green" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-main-text">Cash on Delivery</p>
                  <span className="badge-success">Selected</span>
                </div>
                <p className="text-xs text-sec-text mt-1">
                  {deliveryMethod === 'pickup'
                    ? 'Pay cash when you pick up at our Dhaka store.'
                    : 'Pay cash when the delivery person arrives at your doorstep.'}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-20 h-fit">
          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {items.map((it) => (
                <div key={it.slug} className="flex gap-3">
                  <div className="w-12 h-12 bg-elev-bg rounded-lg overflow-hidden shrink-0">
                    <img src={it.image} alt="" className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-main-text line-clamp-1">{it.name}</p>
                    <p className="text-[10px] text-muted-text line-clamp-1">{it.variant}</p>
                    <p className="text-xs text-sec-text">Qty: {it.quantity}</p>
                  </div>
                  <p className="text-xs font-semibold text-main-text shrink-0">{formatPrice(it.unit_price_bdt * it.quantity)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-sec-text">
                <span>Subtotal</span>
                <span className="text-main-text">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sec-text">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-neon-green font-medium' : 'text-main-text'}>
                  {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                </span>
              </div>
            </div>
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-main-text">Total</span>
                <span className="text-2xl font-bold text-neon-green">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-muted-text mt-1">Pay on {deliveryMethod === 'pickup' ? 'pickup' : 'delivery'}</p>
            </div>
            {error && (
              <div className="mt-3 p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Placing order...' : `Place Order — ${formatPrice(total)}`}
            </button>
            <p className="text-[10px] text-muted-text text-center mt-2">
              By placing this order you agree to our terms.
            </p>
          </div>
        </aside>
      </form>
    </main>
  )
}

function DeliveryOption({ active, onClick, icon, title, desc, price, highlight }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition-all ${
        active
          ? 'border-neon-green bg-neon-green/5 shadow-neon-green'
          : 'border-border bg-elev-bg hover:border-neon-blue/40'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${active ? 'bg-neon-green/20 text-neon-green' : 'bg-card-bg text-sec-text'}`}>
          {icon}
        </div>
        {highlight && (
          <span className="badge-success text-[10px]">Save ৳60</span>
        )}
      </div>
      <p className="font-semibold text-main-text text-sm">{title}</p>
      <p className="text-xs text-sec-text mt-0.5">{desc}</p>
      <p className={`text-xs font-bold mt-1 ${price === 'FREE' ? 'text-neon-green' : 'text-neon-blue'}`}>{price}</p>
    </button>
  )
}

function Field({ label, required, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-sec-text mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  )
}
