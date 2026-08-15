import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ShoppingBag, Search, ArrowRight, Smartphone, Headset, Watch, Battery } from 'lucide-react'
import { useCart } from '../lib/cart'
import { fetchFeaturedProducts } from '../lib/queries'
import { useEffect, useState } from 'react'

export function Home() {
  const { items, itemCount, add } = useCart()
  const [featured, setFeatured] = useState([])

  useEffect(() => {
    async function loadFeatured() {
      try {
        const data = await fetchFeaturedProducts(4)
        setFeatured(data)
      } catch (e) {
        console.error('Failed to load featured products', e)
      }
    }
    loadFeatured()
  }, [])

  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* HERO SECTION */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-brand-offwhite">
        <div className="section-container grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <span className="text-brand-accent font-bold tracking-widest uppercase text-sm mb-4 block">
              Introducing the Future
            </span>
            <h1 className="text-6xl lg:text-8xl font-extrabold text-brand-dark leading-[1.1] mb-6 tracking-tight">
              Innovation <br /> 
              <span className="text-brand-grey">in every detail.</span>
            </h1>
            <p className="text-lg text-brand-grey mb-10 max-w-lg leading-relaxed">
              Experience the next generation of mobile technology. Precision engineered, 
              beautifully designed, and built for the way you live.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/brands" className="btn-primary px-8 py-4 text-lg flex items-center gap-2 group">
                Shop Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/about" className="btn-secondary px-8 py-4 text-lg">
                Learn More
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 w-full aspect-[4/5] bg-white rounded-[3rem] shadow-apple flex items-center justify-center overflow-hidden border border-border-light">
              <img 
                src="https://images.unsplash.com/photo-1616348470796-27626bc7c223?auto=format&fit=crop&q=80&w=800" 
                alt="Premium Phone" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-accent/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </section>

      {/* CATEGORY HUB */}
      <section className="section-container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-brand-dark mb-4 tracking-tight">Shop by Category</h2>
          <p className="text-brand-grey max-w-xl mx-auto">Find exactly what you need, from the latest flagship phones to essential accessories.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { name: 'Smartphones', icon: Smartphone, path: '/brands', color: 'bg-blue-50 text-blue-600' },
            { name: 'Audio', icon: Headset, path: '/deals', color: 'bg-purple-50 text-purple-600' },
            { name: 'Wearables', icon: Watch, path: '/deals', color: 'bg-orange-50 text-orange-600' },
            { name: 'Power', icon: Battery, path: '/deals', color: 'bg-green-50 text-green-600' },
          ].map((cat) => (
            <motion.div
              key={cat.name}
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Link to={cat.path} className={`flex flex-col items-center justify-center p-10 rounded-3xl border border-border-light bg-white shadow-apple transition-all hover:shadow-apple-hover ${cat.color}`}>
                <cat.icon className="w-12 h-12 mb-4" />
                <span className="font-semibold text-brand-dark">{cat.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="bg-brand-offwhite py-24">
        <div className="section-container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold text-brand-dark tracking-tight mb-4">Featured Collection</h2>
              <p className="text-brand-grey">Our top picks for this season.</p>
            </div>
            <Link to="/brands" className="text-brand-accent font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.length > 0 ? featured.map((product) => (
              <motion.div 
                key={product.id}
                whileHover={{ y: -10 }}
                className="card-apple group"
              >
                <div className="aspect-square bg-brand-offwhite rounded-2xl overflow-hidden mb-6 relative">
                  <img 
                    src={product.primary_image_url || 'https://via.placeholder.com/400'} 
                    alt={product.name} 
                    className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-500" 
                  />
                  <button 
                    onClick={() => add(product)}
                    className="absolute bottom-4 right-4 p-3 bg-brand-dark text-white rounded-full opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                  >
                    <ShoppingBag className="w-5 h-5" />
                  </button>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-brand-grey font-bold">{product.brand_name}</span>
                <h3 className="text-lg font-bold text-brand-dark mb-2">{product.name}</h3>
                <p className="text-brand-accent font-bold text-xl">৳{product.min_price_bdt?.toLocaleString()}</p>
              </motion.div>
            )) : (
              <div className="col-span-full text-center py-20 text-brand-grey">
                Loading the best of the best...
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
