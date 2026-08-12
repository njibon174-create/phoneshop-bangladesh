import React from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAdmin } from '../../lib/admin/auth'
import { LogOut, Shield, Menu, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/inventory', label: 'Inventory', icon: '📦' },
  { to: '/admin/brands', label: 'Brands', icon: '🏷️' },
  { to: '/admin/orders', label: 'Orders', icon: '🛒' },
  { to: '/admin/sales', label: 'Sales', icon: '💵' },
  { to: '/admin/dues', label: 'Dues (Baki)', icon: '⏰' },
  { to: '/admin/cashflow', label: 'Cash Flow', icon: '💰' },
  { to: '/admin/reports', label: 'Reports', icon: '📈' },
  { to: '/admin/settings', label: 'Site Settings', icon: '⚙️' },
]

export function AdminLayout({ children, title, subtitle, actions }) {
  const { logout } = useAdmin()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  function handleLogout() {
    logout()
    navigate('/admin')
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-sec-bg border-r border-border flex flex-col transform transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #00FF88, #00D4FF)'}}>
              <Shield className="w-4 h-4 text-black" />
            </div>
            <div>
              <p className="text-xs text-muted-text uppercase tracking-wider">Admin</p>
              <p className="font-bold text-main-text text-sm">PhoneShop BD</p>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-neon-green/10 text-neon-green border-l-2 border-neon-green'
                    : 'text-sec-text hover:bg-surfaceElevated hover:text-main-text'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sec-text hover:bg-surfaceElevated hover:text-main-text">
            <span>🏠</span>
            <span className="font-medium">View Store</span>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10">
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-25 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-main-text">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-main-text">{title}</h1>
                {subtitle && <p className="text-xs sm:text-sm text-sec-text">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        <div className="p-4 sm:p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('AdminLayout error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-danger mb-2">Something went wrong</h2>
          <p className="text-sm text-sec-text mb-3">{this.state.error.message || String(this.state.error)}</p>
          <pre className="text-xs text-muted-text bg-elev-bg p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">{this.state.error.stack || ''}</pre>
          <button onClick={() => this.setState({ error: null })} className="btn-primary mt-4 text-sm">Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
