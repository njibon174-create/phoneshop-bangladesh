import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { Search, ChevronRight, X, Phone, MapPin } from 'lucide-react'

function formatBDT(n) {
  return '৳' + Number(n || 0).toLocaleString('en-IN')
}

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-neon-blue/20 text-neon-blue',
  processing: 'bg-neon-blue/20 text-neon-blue',
  shipped: 'bg-neon-green/20 text-neon-green',
  delivered: 'bg-success/20 text-success',
  cancelled: 'bg-error/20 text-error',
}

export function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [openId, setOpenId] = useState(null)

  async function load() {
    setLoading(true)
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setOrders(ordersData || [])
    // Load items for visible orders
    if (ordersData?.length) {
      const ids = ordersData.map((o) => o.id)
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', ids)
      const grouped = {}
      for (const it of itemsData || []) {
        (grouped[it.order_id] = grouped[it.order_id] || []).push(it)
      }
      setItems(grouped)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, status) {
    await supabase.from('orders').update({ order_status: status }).eq('id', id)
    load()
  }

  const filtered = orders.filter((o) => {
    if (search && !`${o.order_number} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && o.order_status !== statusFilter) return false
    return true
  })

  return (
    <AdminLayout title="Orders" subtitle={`${orders.length} orders total`}>
      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-elev-bg border border-border rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-text" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order number, customer, phone..." className="flex-1 bg-transparent text-sm text-main-text outline-none placeholder:text-muted-text" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 text-xs rounded-lg ${statusFilter === 'all' ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-elev-bg text-sec-text border border-border'}`}>All</button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs rounded-lg capitalize ${statusFilter === s ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-elev-bg text-sec-text border border-border'}`}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-3">📦</p>
          <p className="text-sec-text">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <div key={o.id} className="card overflow-hidden">
              <div className="p-4 flex items-center gap-3 cursor-pointer hover:bg-elev-bg/30" onClick={() => setOpenId(openId === o.id ? null : o.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-bold text-neon-green">{o.order_number}</p>
                    <span className={`badge text-[10px] ${STATUS_COLORS[o.order_status]}`}>{o.order_status}</span>
                    <span className="badge text-[10px] bg-elev-bg text-sec-text">{o.delivery_method}</span>
                  </div>
                  <p className="text-sm text-main-text mt-1">{o.customer_name} · {o.customer_phone}</p>
                  <p className="text-[10px] text-muted-text">{new Date(o.created_at).toLocaleString('en-GB')}</p>
                </div>
                <p className="font-bold text-main-text text-right shrink-0">{formatBDT(o.total_bdt)}</p>
                <ChevronRight className={`w-4 h-4 text-muted-text transition-transform ${openId === o.id ? 'rotate-90' : ''}`} />
              </div>

              {openId === o.id && (
                <div className="border-t border-border p-4 bg-elev-bg/30 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-text uppercase mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Contact</p>
                      <p className="text-sm text-main-text">{o.customer_name}</p>
                      <p className="text-xs text-sec-text">{o.customer_phone}</p>
                      {o.customer_email && <p className="text-xs text-sec-text">{o.customer_email}</p>}
                    </div>
                    <div>
                      <p className="text-xs text-muted-text uppercase mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {o.delivery_method === 'pickup' ? 'Pickup at' : 'Deliver to'}</p>
                      <p className="text-sm text-main-text">{o.shipping_address}</p>
                      <p className="text-xs text-sec-text">{o.shipping_thana && `${o.shipping_thana}, `}{o.shipping_city}{o.shipping_postcode && ` - ${o.shipping_postcode}`}</p>
                      {o.shipping_notes && <p className="text-xs text-textSubtle mt-1">"{o.shipping_notes}"</p>}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-text uppercase mb-2">Items</p>
                    <div className="space-y-1">
                      {(items[o.id] || []).map((it) => (
                        <div key={it.id} className="flex justify-between text-sm py-1.5 border-b border-border/50 last:border-0">
                          <div>
                            <p className="text-main-text">{it.product_name}</p>
                            <p className="text-xs text-muted-text">{it.product_variant} · Qty {it.quantity}</p>
                          </div>
                          <p className="text-main-text font-medium">{formatBDT(it.line_total_bdt)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-border space-y-1 text-sm">
                      <div className="flex justify-between text-sec-text"><span>Subtotal</span><span>{formatBDT(o.subtotal_bdt)}</span></div>
                      <div className="flex justify-between text-sec-text"><span>Shipping</span><span>{o.shipping_bdt === 0 ? 'FREE' : formatBDT(o.shipping_bdt)}</span></div>
                      <div className="flex justify-between font-bold text-main-text pt-1 border-t border-border"><span>Total</span><span className="text-neon-green">{formatBDT(o.total_bdt)}</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-text">Status:</label>
                    <select value={o.order_status} onChange={(e) => updateStatus(o.id, e.target.value)} className={`text-xs px-2 py-1 rounded border bg-elev-bg ${STATUS_COLORS[o.order_status]}`}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}