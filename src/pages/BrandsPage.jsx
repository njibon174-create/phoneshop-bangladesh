import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Smartphone, ArrowLeft } from 'lucide-react'
import { fetchBrands } from '../lib/queries'
import { motion } from 'framer-motion'

export function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchBrands()
        setBrands(data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <main className="min-h-screen bg-brand-white pt-24">
      {/* Minimalist Hero */}
      <section className="section-container py-12">
        <div className="flex items-center gap-2 text-sm text-brand-grey mb-4">
          <Link to="/" className="hover:text-brand-accent transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-brand-dark font-medium">Brands</span>
        </div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold text-brand-dark tracking-tight mb-4"
        >
          Explore Brands
        </motion.h1>
        <p className="text-brand-grey max-w-2xl text-lg leading-relaxed">
          Authorized dealer for the world's leading mobile brands. 
          Official warranty and genuine products guaranteed.
        </p>
      </section>

      {/* Brand Grid */}
      <section className="section-container pb-24">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-48 bg-brand-offwhite rounded-3xl animate-pulse border border-border-light" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <div className="text-center py-32 bg-brand-offwhite rounded-[3rem] border border-border-light">
            <Smartphone className="w-16 h-16 mx-auto mb-4 text-brand-grey" />
            <p className="text-xl font-semibold text-brand-dark">No brands available</p>
            <p className="text-brand-grey">Check back soon for new arrivals.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {brands.map((b, i) => (
              <motion.div
                key={b.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Link 
                  to={`/brand/${b.slug}`} 
                  className="flex flex-col items-center justify-center p-8 h-full bg-white border border-border-light rounded-3xl transition-all hover:shadow-apple group"
                >
                  <div className="w-20 h-20 mb-6 flex items-center justify-center overflow-hidden">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt={b.name} className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-brand-offwhite flex items-center justify-center text-brand-dark">
                        <Smartphone className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <span className="font-bold text-brand-dark text-center group-hover:text-brand-accent transition-colors">
                    {b.name}
                  </span>
                  {b.description && (
                    <p className="text-xs text-brand-grey text-center mt-2 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {b.description}
                    </p>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
