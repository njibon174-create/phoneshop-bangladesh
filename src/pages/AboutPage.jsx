import { Link } from 'react-router-dom'
import { Smartphone, Shield, Truck, BadgeCheck, Heart, Globe } from 'lucide-react'
import { InfoPage } from '../components/ui/InfoPage'

export function AboutPage() {
  return (
    <main className="section-container py-8 max-w-3xl">
      <header className="mb-8">
        <div className="inline-flex items-center gap-2 bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          About Us
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-main-text mb-3">Bangladesh's most trusted mobile phone retailer.</h1>
        <p className="text-sec-text text-lg">
          We started in 2024 with a simple mission: make buying a phone in Bangladesh feel safe, transparent, and actually pleasant.
        </p>
      </header>

      <div className="space-y-6">
        <section className="card p-6">
          <h2 className="text-xl font-semibold text-main-text mb-3">Our story</h2>
          <p className="text-sec-text leading-relaxed mb-3">
            PhoneShop BD was founded by a group of friends who got tired of buying phones from local shops with no warranties, no price transparency, and no way to verify if the phone was actually original. We built PhoneShop BD to fix that.
          </p>
          <p className="text-sec-text leading-relaxed">
            Today we sell phones from all major brands — Apple, Samsung, Xiaomi, Vivo, Oppo, Realme, Infinix, Symphony, Walton, and itel — with official manufacturer warranty, transparent pricing, and friendly customer support in Bangla and English.
          </p>
        </section>

        <section className="card p-6">
          <h2 className="text-xl font-semibold text-main-text mb-4">What we believe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: BadgeCheck, title: 'Authentic only', desc: 'We never sell counterfeit or refurbished-as-new phones.' },
              { icon: Shield, title: 'Warranty backed', desc: 'Every phone comes with official manufacturer warranty.' },
              { icon: Truck, title: 'Fast delivery', desc: 'Most orders delivered within 2-5 days, all over Bangladesh.' },
              { icon: Heart, title: 'Honest pricing', desc: 'No hidden fees, no bait-and-switch, no surprises.' },
            ].map((it) => (
              <div key={it.title} className="flex gap-3">
                <div className="w-10 h-10 bg-neon-green/10 border border-neon-green/20 rounded-lg flex items-center justify-center shrink-0 text-neon-green">
                  <it.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-main-text text-sm">{it.title}</p>
                  <p className="text-xs text-sec-text">{it.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6 bg-gradient-to-br from-sec-bg to-card-bg">
          <h2 className="text-xl font-semibold text-main-text mb-3">Visit our store</h2>
          <p className="text-sec-text mb-2">📍 House 12, Road 7, Dhanmondi, Dhaka</p>
          <p className="text-sec-text mb-2">🕐 Sat-Thu 10:00 AM – 8:00 PM, Fri 2:00 PM – 8:00 PM</p>
          <p className="text-sec-text mb-4">📞 +880 1700-000000</p>
          <Link to="/shop-pickup" className="btn-primary text-sm py-2 inline-flex items-center gap-2">
            Choose pickup at checkout
          </Link>
        </section>
      </div>
    </main>
  )
}
