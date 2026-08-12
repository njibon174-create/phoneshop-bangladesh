import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { ArrowUpRight, ArrowDownRight, Package, ShoppingCart, AlertTriangle, DollarSign, TrendingUp, Users } from 'lucide-react'

function formatBDT(n) {
  if (n == null) return '৳0'
  return '৳' + Number(n).toLocaleString('en-IN')
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function startOfMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

export function AdminDashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    pendingOrders: 0,
    lowStock: 0,
    outOfStock: 0,
    totalProducts: 0,
    totalDues: 0,
    cashBalance: 0,
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const today = todayISO()
      const monthStart = startOfMonthISO()

      const [orders, products, credits, cash, inventory] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('products').select('id, name, slug, brand_name, brand_slug, price_bdt, stock_count, stock_status').eq('is_active', true),
        supabase.from('credits').select('*').eq('status', 'pending'),
        supabase.from('cash_transactions').select('*').gte('transaction_date', monthStart),
        supabase.from('inventory').select('product_id, stock_count, low_stock_at').lte('stock_count', 5),
      ])

      if (cancelled) return

      const allOrders = orders.data || []
      const todayOrders = allOrders.filter((o) => o.created_at.startsWith(today))
      const monthOrders = allOrders.filter((o) => o.created_at >= monthStart)
      const pending = allOrders.filter((o) => o.order_status === 'pending')

      const allProducts = products.data || []
      const lowStockItems = (inventory.data || []).map((inv) => {
        const p = allProducts.find((p) => p.id === inv.product_id)
        return p ? { ...p, stock_count: inv.stock_count } : null
      }).filter(Boolean)

      const cashTxs = cash.data || []
      const cashIn = cashTxs.filter((t) => t.direction === 'in').reduce((s, t) => s + Number(t.amount || 0), 0)
      const cashOut = cashTxs.filter((t) => t.direction === 'out').reduce((s, t) => s + Number(t.amount || 0), 0)

      const allCredits = credits.data || []
      const totalDues = allCredits.reduce((s, c) => s + Number(c.remaining || 0), 0)

      setStats({
        todaySales: todayOrders.reduce((s, o) => s + Number(o.total_bdt || 0), 0),
        monthSales: monthOrders.reduce((s, o) => s + Number(o.total_bdt || 0), 0),
        pendingOrders: pending.length,
        lowStock: lowStockItems.length,
        outOfStock: allProducts.filter((p) => p.stock_count === 0).length,
        totalProducts: allProducts.length,
        totalDues,
        cashBalance: cashIn - cashOut,
      })
      setRecentOrders(allOrders.slice(0, 5))
      setLowStockProducts(lowStockItems.slice(0, 5))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  return (
    <AdminLayout title="Dashboard" subtitle="Real-time overview of your shop">
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-surfaceElevated rounded w-1/2 mb-3" />
              <div className="h-8 bg-surfaceElevated rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard icon={<DollarSign className="w-4 h-4" />} label="Sales today" value={formatBDT(stats.todaySales)} color="neon-green" />
            <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Sales this month" value={formatBDT(stats.monthSales)} color="neon-blue" />
            <StatCard icon={<ShoppingCart className="w-4 h-4" />} label="Pending orders" value={stats.pendingOrders} color={stats.pendingOrders > 0 ? 'warning' : 'muted'} />
            <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Low stock" value={stats.lowStock} color={stats.lowStock > 0 ? 'warning' : 'muted'} />
            <StatCard icon={<Package className="w-4 h-4" />} label="Total products" value={stats.totalProducts} color="muted" />
            <StatCard icon={<AlertTriangle className="w-4 h-4" />} label="Out of stock" value={stats.outOfStock} color={stats.outOfStock > 0 ? 'danger' : 'muted'} />
            <StatCard icon={<Users className="w-4 h-4" />} label="Pending dues" value={formatBDT(stats.totalDues)} color={stats.totalDues > 0 ? 'warning' : 'muted'} />
            <StatCard icon={<DollarSign className="w-4 h-4" />} label="Cash balance (mo)" value={formatBDT(stats.cashBalance)} color={stats.cashBalance >= 0 ? 'neon-green' : 'danger'} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent orders */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-main-text">Recent orders</h2>
                <Link to="/admin/orders" className="text-xs text-neon-green hover:underline">View all</Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-sec-text text-center py-8">No orders yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-3 bg-elev-bg rounded-lg">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-neon-green">{o.order_number}</p>
                        <p className="text-sm text-main-text truncate">{o.customer_name}</p>
                        <p className="text-[10px] text-muted-text">{new Date(o.created_at).toLocaleString('en-GB')}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="font-semibold text-main-text text-sm">{formatBDT(o.total_bdt)}</p>
                        <span className={`badge text-[10px] ${
                          o.order_status === 'pending' ? 'bg-warning/20 text-warning' :
                          o.order_status === 'delivered' ? 'bg-success/20 text-success' :
                          'bg-neon-blue/20 text-neon-blue'
                        }`}>{o.order_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low stock alerts */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-main-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Low stock alerts
                </h2>
                <Link to="/admin/inventory" className="text-xs text-neon-green hover:underline">Manage</Link>
              </div>
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-success text-center py-8">All stock levels healthy ✓</p>
              ) : (
                <div className="space-y-2">
                  {lowStockProducts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-elev-bg rounded-lg">
                      <div className="min-w-0">
                        <p className="text-sm text-main-text truncate">{p.brand_name} {p.name}</p>
                        <p className="text-[10px] text-muted-text">{p.slug}</p>
                      </div>
                      <span className={`badge text-xs shrink-0 ml-3 ${
                        p.stock_count === 0 ? 'bg-error/20 text-error' :
                        p.stock_count <= 3 ? 'bg-warning/20 text-warning' :
                        'bg-neon-blue/20 text-neon-blue'
                      }`}>
                        {p.stock_count === 0 ? 'Out of stock' : `${p.stock_count} left`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}

function StatCard({ icon, label, value, color = 'muted' }) {
  const colorClass = {
    'neon-green': 'text-neon-green',
    'neon-blue': 'text-neon-blue',
    'warning': 'text-warning',
    'danger': 'text-danger',
    'muted': 'text-main-text',
  }[color]
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className={colorClass}>{icon}</span>
        <span className="text-xs text-sec-text uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
    </div>
  )
}