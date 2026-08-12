import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { TrendingUp, Package, Award, AlertTriangle } from 'lucide-react'

function formatBDT(n) {
  return '৳' + Number(n || 0).toLocaleString('en-IN')
}

function startOfMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

function startOfYearISO() {
  return new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
}

export function AdminReports() {
  const [loading, setLoading] = useState(true)
  const [monthly, setMonthly] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [cashSummary, setCashSummary] = useState({ in: 0, out: 0, balance: 0 })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const monthStart = startOfMonthISO()
      const yearStart = startOfYearISO()

      const [sales, phones, products, inventory, cash] = await Promise.all([
        supabase.from('sales').select('*').gte('sale_date', yearStart),
        supabase.from('phones').select('id, brand, model, product_id, status, buy_price'),
        supabase.from('products').select('id, name, brand_name, price_bdt, stock_count, is_active'),
        supabase.from('inventory').select('product_id, stock_count, low_stock_at').lte('stock_count', 5),
        supabase.from('cash_transactions').select('*').gte('transaction_date', yearStart),
      ])

      if (cancelled) return

      // Monthly buckets (last 6 months)
      const monthlyMap = {}
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        monthlyMap[key] = { label: d.toLocaleString('default', { month: 'short', year: 'numeric' }), revenue: 0, profit: 0, count: 0 }
      }
      for (const s of sales.data || []) {
        const d = s.sale_date
        const key = d.slice(0, 7)
        if (monthlyMap[key]) {
          monthlyMap[key].revenue += Number(s.sell_price || 0)
          monthlyMap[key].profit += Number(s.sell_price || 0) - Number(s.cost_price || 0)
          monthlyMap[key].count += 1
        }
      }

      // Top products by sales count
      const productSales = {}
      for (const s of sales.data || []) {
        const phone = (phones.data || []).find((p) => p.id === s.phone_id)
        if (!phone || !phone.product_id) continue
        if (!productSales[phone.product_id]) {
          const product = (products.data || []).find((p) => p.id === phone.product_id)
          productSales[phone.product_id] = {
            name: product ? product.name : `${phone.brand} ${phone.model}`,
            brand: product ? product.brand_name : phone.brand,
            count: 0,
            revenue: 0,
          }
        }
        productSales[phone.product_id].count += 1
        productSales[phone.product_id].revenue += Number(s.sell_price || 0)
      }
      const top = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

      // Low stock
      const allProducts = products.data || []
      const low = (inventory.data || []).map((inv) => {
        const p = allProducts.find((x) => x.id === inv.product_id)
        return p ? { name: p.name, brand: p.brand_name, stock: inv.stock_count } : null
      }).filter(Boolean).sort((a, b) => a.stock - b.stock)

      // Cash flow summary
      const cashIn = (cash.data || []).filter((t) => t.direction === 'in').reduce((s, t) => s + Number(t.amount || 0), 0)
      const cashOut = (cash.data || []).filter((t) => t.direction === 'out').reduce((s, t) => s + Number(t.amount || 0), 0)

      setMonthly(Object.values(monthlyMap))
      setTopProducts(top)
      setLowStock(low)
      setCashSummary({ in: cashIn, out: cashOut, balance: cashIn - cashOut })
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1)

  return (
    <AdminLayout title="Reports" subtitle="Monthly performance, top products, and more">
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-5 animate-pulse h-24" />)}</div>
      ) : (
        <div className="space-y-6">
          {/* Monthly chart */}
          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neon-green" />
              Last 6 months
            </h2>
            <div className="space-y-3">
              {monthly.map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="w-24 text-sm text-sec-text">{m.label}</span>
                  <div className="flex-1 h-8 bg-elev-bg rounded relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green to-neon-blue rounded"
                      style={{ width: `${(m.revenue / maxRevenue) * 100}%` }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-xs font-semibold text-main-text">
                      {formatBDT(m.revenue)} · {m.count} sales
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top products */}
            <div className="card p-5">
              <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-neon-blue" />
                Top selling phones
              </h2>
              {topProducts.length === 0 ? (
                <p className="text-sm text-sec-text text-center py-8">No sales data yet.</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3 p-3 bg-elev-bg rounded-lg">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-neon-green text-black' : i < 3 ? 'bg-neon-blue/20 text-neon-blue' : 'bg-elev-bg text-muted-text border border-border'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-main-text truncate">{p.brand} {p.name}</p>
                        <p className="text-[10px] text-muted-text">{p.count} sold</p>
                      </div>
                      <p className="font-semibold text-neon-green text-sm shrink-0">{formatBDT(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low stock alerts */}
            <div className="card p-5">
              <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Low stock
              </h2>
              {lowStock.length === 0 ? (
                <p className="text-sm text-success text-center py-8">All healthy ✓</p>
              ) : (
                <div className="space-y-2">
                  {lowStock.map((p) => (
                    <div key={p.name} className="flex items-center justify-between p-3 bg-elev-bg rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm text-main-text truncate">{p.brand} {p.name}</p>
                      </div>
                      <span className={`badge text-xs shrink-0 ml-2 ${p.stock === 0 ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'}`}>{p.stock} left</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cash flow YTD */}
          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4">Cash flow (year to date)</h2>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-sec-text uppercase">Total in</p><p className="text-2xl font-bold text-neon-green">{formatBDT(cashSummary.in)}</p></div>
              <div><p className="text-xs text-sec-text uppercase">Total out</p><p className="text-2xl font-bold text-danger">{formatBDT(cashSummary.out)}</p></div>
              <div><p className="text-xs text-sec-text uppercase">Net</p><p className={`text-2xl font-bold ${cashSummary.balance >= 0 ? 'text-main-text' : 'text-danger'}`}>{formatBDT(cashSummary.balance)}</p></div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
