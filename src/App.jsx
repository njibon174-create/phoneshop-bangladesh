import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { Home } from './pages/Home'
import { BrandPage } from './pages/BrandPage'
import { BrandsPage } from './pages/BrandsPage'
import { SearchPage } from './pages/SearchPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/brand/:slug" element={<BrandPage />} />
            <Route path="/search" element={<SearchPage />} />
            {/* TODO Step 4: /product/:slug */}
            {/* TODO Step 5: /cart, /checkout */}
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
