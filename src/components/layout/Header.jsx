import { useState } from 'react'
import { Menu, X, Search, ShoppingCart, Smartphone } from 'lucide-react'

const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'Realme', 'Infinix', 'Symphony', 'Walton', 'itel']

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 glass">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-text hidden sm:block">PhoneShop BD</span>
          </a>
          <nav className="hidden lg:flex items-center gap-1">
            <a href="/brands" className="btn-ghost text-sm">Brands</a>
            <a href="/compare" className="btn-ghost text-sm">Compare</a>
            <a href="/deals" className="btn-ghost text-sm">Deals</a>
            <a href="/support" className="btn-ghost text-sm">Support</a>
          </nav>
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-2 hidden sm:flex" aria-label="Search">
              <Search className="w-5 h-5" />
            </button>
            <button className="btn-ghost p-2 relative" aria-label="Cart">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-ghost p-2 lg:hidden" aria-label="Menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-surface">
          <div className="section-container py-4">
            <div className="mb-4">
              <p className="text-xs text-textSubtle font-medium mb-2 px-2">BRANDS</p>
              <div className="flex flex-wrap gap-1">
                {BRANDS.map((b) => (
                  <a key={b} href={`/brand/${b.toLowerCase()}`} className="text-xs bg-surfaceElevated px-3 py-1.5 rounded-lg text-textMuted hover:text-text border border-border">{b}</a>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <a href="/compare" className="block px-2 py-2 text-sm text-textMuted hover:text-text">Compare</a>
              <a href="/deals" className="block px-2 py-2 text-sm text-textMuted hover:text-text">Deals</a>
              <a href="/support" className="block px-2 py-2 text-sm text-textMuted hover:text-text">Support</a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
