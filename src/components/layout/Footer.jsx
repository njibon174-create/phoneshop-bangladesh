import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, MapPin, Mail, Facebook, Instagram, Youtube, MessageCircle, ShieldCheck, Truck, RotateCcw, Award, Send } from 'lucide-react'

const SHOP_LINKS = [
  { label: 'All Brands', to: '/brands' },
  { label: 'New Arrivals', to: '/new' },
  { label: 'Deals & Offers', to: '/deals' },
  { label: 'Compare Phones', to: '/compare' },
  { label: 'Wishlist', to: '/wishlist' },
  { label: 'Track Order', to: '/track' },
]

const SUPPORT_LINKS = [
  { label: 'Contact Us', to: '/support' },
  { label: 'Delivery Info', to: '/delivery' },
  { label: 'Warranty Policy', to: '/warranty' },
  { label: 'Return Policy', to: '/returns' },
  { label: 'Privacy', to: '/privacy' },
  { label: 'Terms', to: '/terms' },
]

const COMPANY_LINKS = [
  { label: 'About Us', to: '/about' },
  { label: 'Careers', to: '/careers' },
  { label: 'Our Store', to: '/about' },
  { label: 'Press', to: '/about' },
  { label: 'Sustainability', to: '/about' },
]

const SOCIAL_LINKS = [
  { name: 'Facebook', icon: Facebook, href: '#', color: '#1877F2' },
  { name: 'Instagram', icon: Instagram, href: '#', color: '#E4405F' },
  { name: 'YouTube', icon: Youtube, href: '#', color: '#FF0000' },
  { name: 'WhatsApp', icon: MessageCircle, href: '#', color: '#25D366' },
]

export function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  function handleSubscribe(e) {
    e.preventDefault()
    if (email.trim() && email.includes('@')) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 4000)
    }
  }

  return (
    <footer style={{ backgroundColor: '#070A11', borderTop: '1px solid #1E3A5F' }}>
      {/* Trust strip — 4 trust badges */}
      <div style={{ backgroundColor: '#0A0E1A', borderBottom: '1px solid #13161F' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: 'Free Delivery', sub: 'All over Bangladesh' },
            { icon: RotateCcw, title: '7-Day Return', sub: 'No questions asked' },
            { icon: ShieldCheck, title: 'Official Warranty', sub: 'Manufacturer backed' },
            { icon: Award, title: '100% Authentic', sub: 'Genuine products only' },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: 'rgba(0, 255, 136, 0.12)',
                  border: '1px solid rgba(0, 255, 136, 0.2)',
                }}
              >
                <t.icon className="w-5 h-5" style={{ color: '#00FF88' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#F0F8FF' }}>{t.title}</p>
                <p className="text-xs" style={{ color: '#7EB8DA' }}>{t.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main footer columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        {/* Brand + newsletter */}
        <div className="col-span-2 md:col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)', boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }}
            >
              <Phone className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: '#F0F8FF' }}>PhoneShop BD</p>
              <p className="text-[10px] -mt-0.5" style={{ color: '#00D4FF' }}>Authentic since 2018</p>
            </div>
          </Link>
          <p className="text-sm leading-relaxed mb-5" style={{ color: '#7EB8DA' }}>
            Bangladesh's most trusted mobile retailer. New & refurbished phones from all top brands at the best prices — with official warranty and fast delivery.
          </p>

          {/* Newsletter */}
          <form onSubmit={handleSubscribe} className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#F0F8FF' }}>Get exclusive deals</p>
            <div
              className="flex items-center rounded-full overflow-hidden"
              style={{ backgroundColor: '#1E2A3A', border: '1px solid #1E3A5F' }}
            >
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 bg-transparent text-sm outline-none placeholder-[#4A7A9B]"
                style={{ color: '#F0F8FF' }}
                required
              />
              <button
                type="submit"
                className="px-4 py-2.5 text-black font-semibold text-sm inline-flex items-center gap-1"
                style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {subscribed && (
              <p className="text-xs mt-2" style={{ color: '#00FF88' }}>✓ Subscribed — check your inbox!</p>
            )}
          </form>

          {/* Social */}
          <div className="flex items-center gap-2">
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.name}
                href={s.href}
                title={s.name}
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: '#1E2A3A', border: '1px solid #1E3A5F', color: '#7EB8DA' }}
              >
                <s.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#F0F8FF' }}>Shop</h4>
          <ul className="space-y-2.5">
            {SHOP_LINKS.map(l => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm inline-flex items-center gap-1 transition-colors"
                  style={{ color: '#7EB8DA' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00FF88'}
                  onMouseLeave={e => e.currentTarget.style.color = '#7EB8DA'}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#F0F8FF' }}>Support</h4>
          <ul className="space-y-2.5">
            {SUPPORT_LINKS.map(l => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm transition-colors"
                  style={{ color: '#7EB8DA' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#00FF88'}
                  onMouseLeave={e => e.currentTarget.style.color = '#7EB8DA'}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#F0F8FF' }}>Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2" style={{ color: '#7EB8DA' }}>
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#00FF88' }} />
              <span>123 Gulshan Avenue,<br />Dhaka 1212, Bangladesh</span>
            </li>
            <li className="flex items-center gap-2" style={{ color: '#7EB8DA' }}>
              <Phone className="w-4 h-4 shrink-0" style={{ color: '#00FF88' }} />
              <a href="tel:+8801700000000" className="hover:text-[#00FF88] transition-colors">+880 1700-000000</a>
            </li>
            <li className="flex items-center gap-2" style={{ color: '#7EB8DA' }}>
              <Mail className="w-4 h-4 shrink-0" style={{ color: '#00FF88' }} />
              <a href="mailto:hello@phoneshop.bd" className="hover:text-[#00FF88] transition-colors">hello@phoneshop.bd</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid #1E3A5F', backgroundColor: '#050810' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <p style={{ color: '#4A7A9B' }}>© 2026 PhoneShop BD. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span style={{ color: '#4A7A9B' }}>Payment methods:</span>
            <div className="flex items-center gap-2">
              {['bKash', 'Nagad', 'COD', 'Bank'].map(p => (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: '#1E2A3A',
                    border: '1px solid #1E3A5F',
                    color: '#7EB8DA',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
