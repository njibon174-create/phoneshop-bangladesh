import { Smartphone } from 'lucide-react'

const FOOTER_LINKS = {
  shop: [
    { label: 'All Brands', href: '/brands' },
    { label: 'New Arrivals', href: '/new' },
    { label: 'Compare Phones', href: '/compare' },
    { label: 'Price Drops', href: '/deals' },
  ],
  support: [
    { label: 'Contact Us', href: '/support' },
    { label: 'Delivery Info', href: '/delivery' },
    { label: 'Warranty Policy', href: '/warranty' },
    { label: 'Return Policy', href: '/returns' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
}

const SOCIALS = [
  { name: 'Facebook', label: 'f' },
  { name: 'Instagram', label: 'ig' },
  { name: 'YouTube', label: 'yt' },
  { name: 'WhatsApp', label: 'wa' },
]

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-20">
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00FF88, #00D4FF)'}}>
                <Smartphone className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-lg text-main-text">PhoneShop BD</span>
            </div>
            <p className="text-sm text-textMuted mb-4 leading-relaxed">
              Bangladesh's most trusted mobile phone retailer. New & refurbished phones from all top brands at the best prices.
            </p>
            <div className="flex gap-3">
              {SOCIALS.map((s) => (
                <a key={s.name} href="#" aria-label={s.name} className="w-9 h-9 bg-surfaceElevated rounded-lg flex items-center justify-center text-xs font-bold text-textMuted hover:text-accent hover:bg-accent/10 transition-all">
                  {s.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text mb-4">Shop</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.shop.map((l) => (
                <li key={l.href}><a href={l.href} className="text-sm text-textMuted hover:text-accent transition-colors">{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text mb-4">Support</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.support.map((l) => (
                <li key={l.href}><a href={l.href} className="text-sm text-textMuted hover:text-accent transition-colors">{l.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text mb-4">Company</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.company.map((l) => (
                <li key={l.href}><a href={l.href} className="text-sm text-textMuted hover:text-accent transition-colors">{l.label}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-textSubtle">© 2025 PhoneShop BD. All rights reserved. Dhaka, Bangladesh.</p>
          <p className="text-xs text-textSubtle">Payment: Cash on Delivery • bKash • Nagad</p>
        </div>
      </div>
    </footer>
  )
}
