import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Phone, MessageCircle, MapPin, Clock, ChevronDown, Search } from 'lucide-react'

const FAQ = [
  {
    q: 'How do I place an order?',
    a: 'Browse our phones, click any phone to see details, add to cart, then proceed to checkout. Fill in your details and choose home delivery or shop pickup. We currently only accept Cash on Delivery.',
  },
  {
    q: 'How long does delivery take?',
    a: 'For major cities (Dhaka, Chittagong, Sylhet, etc.): 2-3 business days. For other districts: 3-5 business days. We will call you within 1 hour to confirm your order.',
  },
  {
    q: 'What is your return policy?',
    a: '7-day returns for unused phones in original packaging. Defective on arrival is fully covered — we replace or refund and pay return shipping.',
  },
  {
    q: 'Do phones come with warranty?',
    a: 'Yes. All new phones come with official manufacturer warranty (typically 6-12 months). Refurbished phones have a 3-month PhoneShop BD warranty.',
  },
  {
    q: 'Can I pick up my order in person?',
    a: 'Yes! Choose "Shop Pickup" at checkout. Your phone will be ready at our Dhaka store within 1 hour during business hours. You can pay cash on pickup.',
  },
  {
    q: 'Do you have a store I can visit?',
    a: 'Yes. Our flagship store is at House 12, Road 7, Dhanmondi, Dhaka. Open Sat-Thu 10 AM-8 PM, Fri 2 PM-8 PM.',
  },
  {
    q: 'Are the phones original?',
    a: '100% original. We source directly from brand-authorized distributors and verified importers. Every phone comes with the official manufacturer warranty card.',
  },
  {
    q: 'Can I track my order?',
    a: 'Yes. After dispatch, you\'ll receive an SMS with the tracking number. You can also enter your order number on our order tracking page.',
  },
]

export function SupportPage() {
  const [open, setOpen] = useState(0)
  const [query, setQuery] = useState('')

  const filtered = query
    ? FAQ.filter((f) => f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase()))
    : FAQ

  return (
    <main className="section-container py-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-main-text mb-2">How can we help?</h1>
        <p className="text-sec-text">Search our help center or contact us directly.</p>
      </header>

      <div className="mb-6">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-2xl px-4 py-3 focus-within:border-neon-green">
          <Search className="w-5 h-5 text-muted-text shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search FAQ..."
            className="flex-1 bg-transparent text-main-text outline-none placeholder:text-muted-text"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <a href="tel:+8801700000000" className="card p-4 flex items-center gap-3 hover:border-neon-green/40">
          <div className="w-10 h-10 bg-neon-green/10 rounded-lg flex items-center justify-center text-neon-green shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-text">Call</p>
            <p className="text-sm font-semibold text-main-text">+880 1700-000000</p>
          </div>
        </a>
        <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="card p-4 flex items-center gap-3 hover:border-neon-green/40">
          <div className="w-10 h-10 bg-neon-green/10 rounded-lg flex items-center justify-center text-neon-green shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-text">WhatsApp</p>
            <p className="text-sm font-semibold text-main-text">+880 1700-000000</p>
          </div>
        </a>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-neon-green/10 rounded-lg flex items-center justify-center text-neon-green shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-text">Visit</p>
            <p className="text-sm font-semibold text-main-text">Dhanmondi, Dhaka</p>
          </div>
        </div>
      </div>

      <div className="card p-4 mb-6 flex items-center gap-3 bg-elev-bg">
        <Clock className="w-5 h-5 text-neon-green shrink-0" />
        <p className="text-sm text-sec-text"><strong className="text-main-text">Support hours:</strong> Sat-Thu 10:00 AM – 8:00 PM, Fri 2:00 PM – 8:00 PM. WhatsApp 24/7.</p>
      </div>

      <h2 className="text-xl font-semibold text-main-text mb-4">Frequently asked questions</h2>
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-sec-text text-sm py-8 text-center">No matches. Try a different search term, or contact us directly.</p>
        ) : (
          filtered.map((f, i) => {
            const isOpen = open === i
            return (
              <div key={f.q} className="card overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-main-text text-sm pr-2">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-text transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-sec-text leading-relaxed border-t border-border pt-3">
                    {f.a}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="mt-8 card p-6 text-center bg-gradient-to-br from-sec-bg to-card-bg border-neon-green/30">
        <h3 className="text-lg font-semibold text-main-text mb-2">Still have questions?</h3>
        <p className="text-sm text-sec-text mb-4">Our team is happy to help — in Bangla or English.</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <a href="https://wa.me/8801700000000" target="_blank" rel="noopener noreferrer" className="btn-primary text-sm py-2 inline-flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
          </a>
          <a href="tel:+8801700000000" className="btn-secondary text-sm py-2 inline-flex items-center gap-2">
            <Phone className="w-4 h-4" /> Call us
          </a>
        </div>
      </div>
    </main>
  )
}
