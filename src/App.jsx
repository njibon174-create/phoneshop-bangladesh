import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { CartProvider } from './lib/cart'
import { AdminProvider, useAdmin } from './lib/admin/auth'
import { AdminLogin } from './pages/admin/AdminLogin'
import { PhoneShopAdmin } from './pages/admin/PhoneShopAdmin'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { RouteProgress } from './components/ui/RouteProgress'
import { Shield } from 'lucide-react'
import './index.css'

// Eagerly loaded storefront pages — these render above the fold
import { Home } from './pages/Home'
import { BrandsPage } from './pages/BrandsPage'
import { BrandPage } from './pages/BrandPage'
import { ProductPage } from './pages/ProductPage'
import { CartPage } from './pages/CartPage'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'

// Lazy-loaded storefront — all use named exports so we look up the named
// export from the module instead of relying on a default.
function lazyNamed(loader, exportName) {
  return lazy(async () => {
    const m = await loader()
    const C = m[exportName]
    if (!C) throw new Error(`Export "${exportName}" not found in lazy-loaded module`)
    return { default: C }
  })
}

const SearchPage = lazyNamed(() => import('./pages/SearchPage'), 'SearchPage')
const CheckoutPage = lazyNamed(() => import('./pages/CheckoutPage'), 'CheckoutPage')
const OrderConfirmationPage = lazyNamed(() => import('./pages/OrderConfirmationPage'), 'OrderConfirmationPage')
const OrderTrackingPage = lazyNamed(() => import('./pages/OrderTrackingPage'), 'OrderTrackingPage')
const WishlistPage = lazyNamed(() => import('./pages/WishlistPage'), 'WishlistPage')
const ComparePage = lazyNamed(() => import('./pages/ComparePage'), 'ComparePage')
const DealsPage = lazyNamed(() => import('./pages/DealsPage'), 'DealsPage')
const NewArrivalsPage = lazyNamed(() => import('./pages/NewArrivalsPage'), 'NewArrivalsPage')
const SupportPage = lazyNamed(() => import('./pages/SupportPage'), 'SupportPage')
const AboutPage = lazyNamed(() => import('./pages/AboutPage'), 'AboutPage')
const DeliveryPage = lazyNamed(() => import('./pages/delivery'), 'DeliveryPage')
const WarrantyPage = lazyNamed(() => import('./pages/legal'), 'WarrantyPage')
const ReturnsPage = lazyNamed(() => import('./pages/legal'), 'ReturnsPage')
const PrivacyPage = lazyNamed(() => import('./pages/legal'), 'PrivacyPage')
const TermsPage = lazyNamed(() => import('./pages/legal'), 'TermsPage')
const CareersPage = lazyNamed(() => import('./pages/legal'), 'CareersPage')

// Storefront layout wrapper — full header + footer
function StorefrontLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0A0E1A' }}>
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }} />
                <p className="mt-4 text-sm" style={{ color: '#7EB8DA' }}>Loading…</p>
              </div>
            </div>
          }>
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}

function NotFound() {
  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-7xl mb-4">🔍</p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#F0F8FF' }}>Page not found</h1>
        <p style={{ color: '#7EB8DA' }} className="mb-6">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-black" style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}>
          <Shield className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </StorefrontLayout>
  )
}

function AdminGate() {
  const { authenticated } = useAdmin()
  if (!authenticated) return <AdminLogin />
  return <PhoneShopAdmin />
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <AdminProvider>
          <RouteProgress />
          <Routes>
            {/* Admin — tabbed PhoneLedger-style */}
            <Route path="/admin" element={<AdminGate />} />
            <Route path="/admin/*" element={<AdminGate />} />

            {/* Storefront */}
            <Route path="/" element={<StorefrontLayout><Home /></StorefrontLayout>} />
            <Route path="/brands" element={<StorefrontLayout><BrandsPage /></StorefrontLayout>} />
            <Route path="/brand/:slug" element={<StorefrontLayout><BrandPage /></StorefrontLayout>} />
            <Route path="/product/:slug" element={<StorefrontLayout><ProductPage /></StorefrontLayout>} />
            <Route path="/search" element={<StorefrontLayout><SearchPage /></StorefrontLayout>} />
            <Route path="/cart" element={<StorefrontLayout><CartPage /></StorefrontLayout>} />
            <Route path="/checkout" element={<StorefrontLayout><CheckoutPage /></StorefrontLayout>} />
            <Route path="/order-confirmed" element={<StorefrontLayout><OrderConfirmationPage /></StorefrontLayout>} />
            <Route path="/track" element={<StorefrontLayout><OrderTrackingPage /></StorefrontLayout>} />
            <Route path="/wishlist" element={<StorefrontLayout><WishlistPage /></StorefrontLayout>} />
            <Route path="/compare" element={<StorefrontLayout><ComparePage /></StorefrontLayout>} />
            <Route path="/deals" element={<StorefrontLayout><DealsPage /></StorefrontLayout>} />
            <Route path="/new" element={<StorefrontLayout><NewArrivalsPage /></StorefrontLayout>} />
            <Route path="/support" element={<StorefrontLayout><SupportPage /></StorefrontLayout>} />
            <Route path="/about" element={<StorefrontLayout><AboutPage /></StorefrontLayout>} />
            <Route path="/delivery" element={<StorefrontLayout><DeliveryPage /></StorefrontLayout>} />
            <Route path="/warranty" element={<StorefrontLayout><WarrantyPage /></StorefrontLayout>} />
            <Route path="/returns" element={<StorefrontLayout><ReturnsPage /></StorefrontLayout>} />
            <Route path="/privacy" element={<StorefrontLayout><PrivacyPage /></StorefrontLayout>} />
            <Route path="/terms" element={<StorefrontLayout><TermsPage /></StorefrontLayout>} />
            <Route path="/careers" element={<StorefrontLayout><CareersPage /></StorefrontLayout>} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AdminProvider>
      </CartProvider>
    </BrowserRouter>
  )
}
