import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Menu, X, Search, ShoppingCart, Smartphone, ChevronDown, Heart, GitCompare } from 'lucide-react'
import { fetchBrands } from '../../lib/queries'
import { useCart } from '../../lib/cart'
import { useWishlist } from '../../lib/wishlist'
import { getItems as getCompareItems, subscribe as compareSubscribe } from '../../lib/compare'
import { useSyncExternalStore } from 'react'

const FALLBACK_BRANDS = [
  { name: 'Apple', slug: 'apple' }, { name: 'Samsung', slug: 'samsung' },
  { name: 'Xiaomi', slug: 'xiaomi' }, { name: 'Vivo', slug: 'vivo' },
  { name: 'Oppo', slug: 'oppo' }, { name: 'Realme', slug: 'realme' },
  { name: 'Infinix', slug: 'infinix' }, { name: 'Symphony', slug: 'symphony' },
  { name: 'Walton', slug: 'walton' }, { name: 'itel', slug: 'itel' },
]

export function Header() {
  const navigate = useNavigate()
  const { itemCount } = useCart()
  const { count: wishCount } = useWishlist()
  const compareItems = useSyncExternalStore(compareSubscribe, getCompareItems, getCompareItems)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [brands, setBrands] = useState(FALLBACK_BRANDS)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchBrands()
      .then((data) => {
        if (cancelled) return
        if (data?.length) setBrands(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  function submitSearch(e) {
    e.preventDefault()
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`)
      setSearchOpen(false)
      setSearchInput('')
    }
  }

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00FF88, #00D4FF)'}}>
              <Smartphone className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-lg text-main-text hidden sm:block">PhoneShop BD</span>
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            <div
              className="relative"
              onMouseEnter={() => setBrandsOpen(true)}
              onMouseLeave={() => setBrandsOpen(false)}
            >
              <button className="btn-ghost text-sm flex items-center gap-1">
                Brands <ChevronDown className="w-3 h-3" />
              </button>
              {brandsOpen && (
                <div className="absolute top-full left-0 pt-1 w-48">
                  <div className="bg-surfaceElevated border border-border rounded-xl shadow-cardHover py-2 animate-scale-in">
                    {brands.map((b) => (
                      <a
                        key={b.slug}
                        href={`/brand/${b.slug}`}
                        className="block px-4 py-2 text-sm text-textMuted hover:text-text hover:bg-surface transition-colors"
                      >
                        {b.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <a href="/deals" className="btn-ghost text-sm">Deals</a>
            <a href="/compare" className="btn-ghost text-sm">Compare</a>
            <a href="/support" className="btn-ghost text-sm">Support</a>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {searchOpen ? (
              <form onSubmit={submitSearch} className="flex items-center gap-1 bg-surfaceElevated border border-border rounded-lg px-3 py-1.5">
                <Search className="w-4 h-4 text-textSubtle" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search phones..."
                  className="bg-transparent text-sm text-text outline-none w-24 sm:w-40 lg:w-56 placeholder:text-textSubtle"
                  autoFocus
                  onBlur={() => !searchInput && setSearchOpen(false)}
                />
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="btn-ghost p-2" aria-label="Search">
                <Search className="w-5 h-5" />
              </button>
            )}
            <Link to="/wishlist" className="btn-ghost p-2 relative hidden sm:flex" aria-label="Wishlist">
              <Heart className="w-5 h-5" />
              {wishCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-neon-green text-black text-[10px] font-bold rounded-full flex items-center justify-center">{wishCount > 99 ? "99+" : wishCount}</span>
              )}
            </Link>
            <Link to="/compare" className="btn-ghost p-2 relative hidden sm:flex" aria-label="Compare">
              <GitCompare className="w-5 h-5" />
              {compareItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-neon-green text-black text-[10px] font-bold rounded-full flex items-center justify-center">{compareItems.length > 99 ? "99+" : compareItems.length}</span>
              )}
            </Link>
            <Link to="/cart" className="btn-ghost p-2 relative" aria-label="Cart">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-neon-green text-black text-[10px] font-bold rounded-full flex items-center justify-center">{itemCount > 99 ? "99+" : itemCount}</span>
              )}
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="btn-ghost p-2 lg:hidden" aria-label="Menu">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-surface">
          <div className="section-container py-4">
            <form onSubmit={submitSearch} className="mb-4">
              <div className="flex items-center gap-2 bg-surfaceElevated border border-border rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-textSubtle" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search phones..."
                  className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-textSubtle"
                />
              </div>
            </form>
            <div className="mb-4">
              <p className="text-xs text-textSubtle font-medium mb-2 px-2">BRANDS</p>
              <div className="flex flex-wrap gap-1">
                {brands.map((b) => (
                  <a key={b.slug} href={`/brand/${b.slug}`} onClick={() => setMobileOpen(false)} className="text-xs bg-surfaceElevated px-3 py-1.5 rounded-lg text-textMuted hover:text-text border border-border">
                    {b.name}
                  </a>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <a href="/deals" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm text-textMuted hover:text-text">Deals</a>
              <a href="/compare" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm text-textMuted hover:text-text">Compare</a>
              <a href="/support" onClick={() => setMobileOpen(false)} className="block px-2 py-2 text-sm text-textMuted hover:text-text">Support</a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
