import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Search, ChevronDown, Heart, GitCompare, ShoppingCart, Phone, MapPin } from 'lucide-react'
import { useCart } from '../../lib/cart'

export function Header() {
  const navigate = useNavigate()
  const { itemCount } = useCart()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8) }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function submitSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSearchOpen(false)
    }
  }

  return (
    <>
      {/* Top utility bar — phone, address, login */}
      <div className="hidden md:block" style={{ backgroundColor: '#070A11', borderBottom: '1px solid #13161F' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center justify-between text-xs">
          <div className="flex items-center gap-5" style={{ color: '#7EB8DA' }}>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="w-3 h-3" style={{ color: '#00FF88' }} />
              <span>Hotline: +880 1700-000000</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="w-3 h-3" style={{ color: '#00FF88' }} />
              <span>Free delivery all over Bangladesh</span>
            </span>
          </div>
          <div className="flex items-center gap-4" style={{ color: '#7EB8DA' }}>
            <Link to="/track" className="hover:text-[#00FF88] transition-colors">Track Order</Link>
            <span style={{ color: '#1E3A5F' }}>•</span>
            <Link to="/support" className="hover:text-[#00FF88] transition-colors">Support</Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl transition-all"
        style={{
          backgroundColor: scrolled ? 'rgba(10, 14, 26, 0.85)' : 'rgba(10, 14, 26, 0.6)',
          borderBottom: '1px solid #13161F',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(true)} className="md:hidden" style={{ color: '#F0F8FF' }}>
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #00FF88, #00D4FF)',
                boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
              }}
            >
              <Phone className="w-5 h-5 text-black" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-base leading-none" style={{ color: '#F0F8FF' }}>PhoneShop BD</p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: '#00D4FF' }}>Authentic mobiles since 2018</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-4">
            <Link to="/" className="px-3 py-2 text-sm font-medium" style={{ color: '#F0F8FF' }}>Home</Link>
            <Link to="/brands" className="px-3 py-2 text-sm font-medium" style={{ color: '#7EB8DA' }}>Brands</Link>
            <Link to="/deals" className="px-3 py-2 text-sm font-medium" style={{ color: '#7EB8DA' }}>Deals</Link>
            <Link to="/new" className="px-3 py-2 text-sm font-medium" style={{ color: '#7EB8DA' }}>New</Link>
            <Link to="/compare" className="px-3 py-2 text-sm font-medium" style={{ color: '#7EB8DA' }}>Compare</Link>
          </nav>

          {/* Search bar */}
          <form onSubmit={submitSearch} className="flex-1 max-w-xl hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#1E2A3A', border: '1px solid #1E3A5F' }}>
            <Search className="w-4 h-4 shrink-0" style={{ color: '#7EB8DA' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search phones, brands, models…"
              className="flex-1 bg-transparent text-sm outline-none placeholder-[#4A7A9B]"
              style={{ color: '#F0F8FF' }}
            />
            <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] rounded font-mono" style={{ backgroundColor: '#111827', color: '#4A7A9B', border: '1px solid #1E3A5F' }}>⏎</kbd>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setSearchOpen(true)} className="md:hidden p-2" style={{ color: '#F0F8FF' }}>
              <Search className="w-5 h-5" />
            </button>
            <Link to="/wishlist" className="hidden md:flex p-2 relative" style={{ color: '#7EB8DA' }} title="Wishlist">
              <Heart className="w-5 h-5" />
            </Link>
            <Link to="/compare" className="hidden md:flex p-2 relative" style={{ color: '#7EB8DA' }} title="Compare">
              <GitCompare className="w-5 h-5" />
            </Link>
            <Link to="/cart" className="p-2 relative" style={{ color: '#00FF88' }} title="Cart">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center text-black"
                  style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Sub-nav row — categories */}
        <div className="hidden md:block" style={{ borderTop: '1px solid #13161F' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center gap-1 text-xs">
            <ChevronDown className="w-3 h-3" style={{ color: '#4A7A9B' }} />
            <span style={{ color: '#4A7A9B' }} className="mr-2">Browse:</span>
            {['Apple', 'Samsung', 'Xiaomi', 'Vivo', 'Oppo', 'Realme', 'Infinix', 'Symphony', 'Walton', 'Itel'].map(b => (
              <Link
                key={b}
                to={`/brand/${b.toLowerCase()}`}
                className="px-2.5 py-1 rounded transition-colors"
                style={{ color: '#7EB8DA' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00FF88'}
                onMouseLeave={e => e.currentTarget.style.color = '#7EB8DA'}
              >
                {b}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="p-4" style={{ backgroundColor: '#0A0E1A' }}>
            <form onSubmit={submitSearch} className="flex items-center gap-2 px-3 py-2 rounded-full" style={{ backgroundColor: '#1E2A3A', border: '1px solid #1E3A5F' }}>
              <Search className="w-4 h-4" style={{ color: '#7EB8DA' }} />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search phones…"
                className="flex-1 bg-transparent text-sm outline-none placeholder-[#4A7A9B]"
                style={{ color: '#F0F8FF' }}
              />
              <button type="button" onClick={() => setSearchOpen(false)} style={{ color: '#7EB8DA' }}>
                <X className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 pt-6 px-4 flex flex-col" style={{ backgroundColor: '#0A0E1A', borderRight: '1px solid #1E3A5F' }}>
            <div className="flex items-center justify-between mb-6">
              <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}>
                  <Phone className="w-4 h-4 text-black" />
                </div>
                <span className="font-bold" style={{ color: '#F0F8FF' }}>PhoneShop BD</span>
              </Link>
              <button onClick={() => setMobileOpen(false)} style={{ color: '#7EB8DA' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {[
                ['Home', '/'],
                ['Brands', '/brands'],
                ['Deals', '/deals'],
                ['New Arrivals', '/new'],
                ['Compare', '/compare'],
                ['Wishlist', '/wishlist'],
                ['Cart', '/cart'],
                ['Track Order', '/track'],
                ['Support', '/support'],
                ['About', '/about'],
              ].map(([label, to]) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium"
                  style={{ color: '#F0F8FF' }}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="border-t pt-4 pb-2" style={{ borderColor: '#1E3A5F' }}>
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium"
                style={{ color: '#00FF88' }}
              >
                ↗ Admin Panel
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
