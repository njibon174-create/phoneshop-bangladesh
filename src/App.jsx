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

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <Header />
          <main className="flex-1">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/brands" element={<BrandsPage />} />
                <Route path="/brand/:slug" element={<BrandPage />} />
                <Route path="/product/:slug" element={<ProductPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-confirmed" element={<OrderConfirmationPage />} />
                <Route path="/track" element={<OrderTrackingPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/deals" element={<DealsPage />} />
                <Route path="/new" element={<NewArrivalsPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/delivery" element={<DeliveryPage />} />
                <Route path="/warranty" element={<WarrantyPage />} />
                <Route path="/returns" element={<ReturnsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/careers" element={<CareersPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </BrowserRouter>
  )
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
