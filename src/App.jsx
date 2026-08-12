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

// Eagerly loaded storefront pages
import { Home } from './pages/Home'
import { BrandsPage } from './pages/BrandsPage'
import { BrandPage } from './pages/BrandPage'
import { ProductPage } from './pages/ProductPage'
import { CartPage } from './pages/CartPage'

// Lazy-loaded storefront
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })))
const OrderConfirmationPage = lazy(() => import('./pages/OrderConfirmationPage').then((m) => ({ default: m.OrderConfirmationPage })))
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage').then((m) => ({ default: m.OrderTrackingPage })))
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((m) => ({ default: m.WishlistPage })))
const ComparePage = lazy(() => import('./pages/ComparePage').then((m) => ({ default: m.ComparePage })))
const DealsPage = lazy(() => import('./pages/DealsPage').then((m) => ({ default: m.DealsPage })))
const NewArrivalsPage = lazy(() => import('./pages/NewArrivalsPage').then((m) => ({ default: m.NewArrivalsPage })))
const SupportPage = lazy(() => import('./pages/SupportPage').then((m) => ({ default: m.SupportPage })))
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const DeliveryPage = lazy(() => import('./pages/delivery').then((m) => ({ default: m.DeliveryPage })))
const WarrantyPage = lazy(() => import('./pages/legal').then((m) => ({ default: m.WarrantyPage })))
const ReturnsPage = lazy(() => import('./pages/legal').then((m) => ({ default: m.ReturnsPage })))
const PrivacyPage = lazy(() => import('./pages/legal').then((m) => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('./pages/legal').then((m) => ({ default: m.TermsPage })))
const CareersPage = lazy(() => import('./pages/legal').then((m) => ({ default: m.CareersPage })))

// Storefront layout wrapper
function StorefrontLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeaderLite />
      <main className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={<div className="section-container py-16 text-center text-sec-text">Loading…</div>}>
            {children}
          </Suspense>
        </ErrorBoundary>
      </main>
      <FooterLite />
    </div>
  )
}

// Lightweight header for lazy routes
function HeaderLite() {
  return (
    <header className="border-b border-border bg-card-bg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }}>
            <Shield className="w-4 h-4 text-black" />
          </div>
          <span className="font-bold text-main-text">PhoneShop BD</span>
        </Link>
        <Link to="/admin" className="text-xs text-sec-text hover:text-neon-blue">Admin</Link>
      </div>
    </header>
  )
}

function FooterLite() {
  return (
    <footer className="border-t border-border bg-card-bg py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted-text">
        © 2026 PhoneShop BD. All rights reserved.
      </div>
    </footer>
  )
}

function NotFound() {
  return (
    <StorefrontLayout>
      <div className="section-container py-16 text-center">
        <p className="text-5xl mb-4">🤷</p>
        <h1 className="text-2xl font-bold text-main-text mb-2">Page not found</h1>
        <Link to="/" className="btn-primary inline-flex items-center gap-2 mt-4">Back to Home</Link>
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
