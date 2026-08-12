import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { Home } from './pages/Home'
import { BrandPage } from './pages/BrandPage'
import { BrandsPage } from './pages/BrandsPage'
import { SearchPage } from './pages/SearchPage'
import { ProductPage } from './pages/ProductPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderConfirmationPage } from './pages/OrderConfirmationPage'
import { OrderTrackingPage } from './pages/OrderTrackingPage'
import { WishlistPage } from './pages/WishlistPage'
import { ComparePage } from './pages/ComparePage'
import { DealsPage } from './pages/DealsPage'
import { NewArrivalsPage } from './pages/NewArrivalsPage'
import { SupportPage } from './pages/SupportPage'
import { AboutPage } from './pages/AboutPage'
import { WarrantyPage, ReturnsPage, PrivacyPage, TermsPage, CareersPage } from './pages/legal'
import { DeliveryPage } from './pages/delivery'
import { CartProvider } from './lib/cart'
import { AdminProvider, useAdmin } from './lib/admin/auth'
import { AdminLogin } from './pages/admin/AdminLogin'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminBrands } from './pages/admin/AdminBrands'
import { AdminInventory } from './pages/admin/AdminInventory'
import { AdminOrders } from './pages/admin/AdminOrders'
import { AdminSales } from './pages/admin/AdminSales'
import { AdminDues } from './pages/admin/AdminDues'
import { AdminCashflow } from './pages/admin/AdminCashflow'
import { AdminReports } from './pages/admin/AdminReports'
import { AdminSettings } from './pages/admin/AdminSettings'

function AdminGuard({ children }) {
  const { authenticated } = useAdmin()
  if (!authenticated) {
    return <AdminLogin />
  }
  return <ErrorBoundary>{children}</ErrorBoundary>
}

function NotFoundPage() {
  return (
    <main className="section-container py-16 text-center">
      <p className="text-5xl mb-4">🤷</p>
      <h1 className="text-2xl font-bold text-main-text mb-2">Page not found</h1>
      <p className="text-sec-text mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="btn-primary inline-flex items-center gap-2">Back to Home</a>
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
      <Header />
      <main className="flex-1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
