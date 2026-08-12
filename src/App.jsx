import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { RouteProgress } from './components/ui/RouteProgress'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { CartProvider } from './lib/cart'
import { AdminProvider, useAdmin } from './lib/admin/auth'

// Eagerly loaded — critical above-the-fold content
import { Home } from './pages/Home'
import { BrandsPage } from './pages/BrandsPage'
import { BrandPage } from './pages/BrandPage'
import { ProductPage } from './pages/ProductPage'
import { CartPage } from './pages/CartPage'

// Lazy routes — split into separate chunks for faster initial load
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

// Lazy admin
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })))
const AdminBrands = lazy(() => import('./pages/admin/AdminBrands').then((m) => ({ default: m.AdminBrands })))
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory').then((m) => ({ default: m.AdminInventory })))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders })))
const AdminSales = lazy(() => import('./pages/admin/AdminSales').then((m) => ({ default: m.AdminSales })))
const AdminDues = lazy(() => import('./pages/admin/AdminDues').then((m) => ({ default: m.AdminDues })))
const AdminCashflow = lazy(() => import('./pages/admin/AdminCashflow').then((m) => ({ default: m.AdminCashflow })))
const AdminReports = lazy(() => import('./pages/admin/AdminReports').then((m) => ({ default: m.AdminReports })))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })))

function AdminGuard({ children }) {
  const { authenticated } = useAdmin()
  if (!authenticated) {
    return <Suspense fallback={<PageLoader />}><AdminLogin /></Suspense>
  }
  return <ErrorBoundary>{children}</ErrorBoundary>
}

// Loading fallback shown while lazy routes are loading
function PageLoader() {
  return (
    <div className="section-container py-16">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-surfaceElevated rounded w-1/3" />
        <div className="h-4 bg-surfaceElevated rounded w-1/2" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="aspect-square bg-surfaceElevated rounded-xl mb-4" />
              <div className="h-3 bg-surfaceElevated rounded w-1/3 mb-2" />
              <div className="h-4 bg-surfaceElevated rounded w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NotFoundPage() {
  return (
    <main className="section-container py-16 text-center">
      <p className="text-5xl mb-4">🤷</p>
      <h1 className="text-2xl font-bold text-main-text mb-2">Page not found</h1>
      <p className="text-sec-text mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary inline-flex items-center gap-2">Back to Home</Link>
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <AdminProvider>
          <Routes>
            {/* Admin routes — no Header/Footer, use AdminLayout internally */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
            <Route path="/admin/brands" element={<AdminGuard><AdminBrands /></AdminGuard>} />
            <Route path="/admin/inventory" element={<AdminGuard><AdminInventory /></AdminGuard>} />
            <Route path="/admin/products" element={<AdminGuard><AdminInventory /></AdminGuard>} />
            <Route path="/admin/orders" element={<AdminGuard><AdminOrders /></AdminGuard>} />
            <Route path="/admin/sales" element={<AdminGuard><AdminSales /></AdminGuard>} />
            <Route path="/admin/dues" element={<AdminGuard><AdminDues /></AdminGuard>} />
            <Route path="/admin/cashflow" element={<AdminGuard><AdminCashflow /></AdminGuard>} />
            <Route path="/admin/reports" element={<AdminGuard><AdminReports /></AdminGuard>} />
            <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />

            {/* Storefront routes */}
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
            <Route path="*" element={<StorefrontLayout><NotFoundPage /></StorefrontLayout>} />
          </Routes>
        </AdminProvider>
      </CartProvider>
    </BrowserRouter>
  )
}

function StorefrontLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <RouteProgress />
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
