import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { Search } from 'lucide-react'

function formatBDT(n) {
  return '৳' + Number(n || 0).toLocaleString('en-IN')
}

export function AdminSales() {
  const [sales, setSales] = useState([])
  const [phones, setPhones] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    const { data: salesData } = await supabase
      .from('sales')
      .select('*')
      .order('sale_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200)
    setSales(salesData || [])
    if (salesData?.length) {
      const phoneIds = [...new Set(salesData.map((s) => s.phone_id).filter(Boolean))]
      if (phoneIds.length) {
        const { data: phonesData } = await supabase.from('phones').select('id, brand, model, imei').in('id', phoneIds)
        const map = {}
        for (const p of phonesData || []) map[p.id] = p
        setPhones(map)
      }
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = sales.filter((s) => {
    if (!search) return true
    const phone = phones[s.phone_id]
    const txt = `${s.id} ${phone ? (phone.brand + ' ' + phone.model) : ''} ${s.buyer_name || ''} ${s.payment_type}`.toLowerCase()
    return txt.includes(search.toLowerCase())
  })

  // Group by date
  const grouped = {}
  for (const s of filtered) {
    const date = s.sale_date
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(s)
  }

  const totalRevenue = filtered.reduce((s, x) => s + Number(x.sell_price || 0), 0)
  const totalProfit = filtered.reduce((s, x) => s + Number(x.sell_price || 0) - Number(x.cost_price || 0), 0)
  const cashCount = filtered.filter((x) => x.payment_type === 'cash' || x.payment_type === 'cod').length
  const bakiCount = filtered.filter((x) => x.payment_type === 'baki').length

  return (
    <AdminLayout title="Sales" subtitle="All sales transactions">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Sales count</p><p className="text-2xl font-bold text-main-text">{filtered.length}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Total revenue</p><p className="text-2xl font-bold text-neon-green">{formatBDT(totalRevenue)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Estimated profit</p><p className="text-2xl font-bold text-neon-blue">{formatBDT(totalProfit)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Cash / Baki</p><p className="text-2xl font-bold text-main-text">{cashCount} / {bakiCount}</p></div>
      </div>

      <div className="card p-4 mb-4 flex items-center gap-2 bg-elev-bg border border-border rounded-lg">
        <Search className="w-4 h-4 text-muted-text" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sales..." className="flex-1 bg-transparent text-sm text-main-text outline-none placeholder:text-muted-text" />
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-5xl mb-3">💵</p><p className="text-sec-text">No sales yet. They'll appear here as customers place orders.</p></div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-sec-text">{new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                <p className="text-xs text-muted-text">{items.length} sales · {formatBDT(items.reduce((s, x) => s + Number(x.sell_price), 0))}</p>
              </div>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-border">
                    {items.map((s) => {
                      const phone = phones[s.phone_id]
                      return (
                        <tr key={s.id} className="hover:bg-elev-bg/30">
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-main-text">{phone ? `${phone.brand} ${phone.model}` : '—'}</p>
                            <p className="text-[10px] text-muted-text font-mono">{phone?.imei || '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-xs text-sec-text">
                            {s.buyer_name || '—'}
                            {s.buyer_phone && <p className="text-muted-text">{s.buyer_phone}</p>}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge text-[10px] ${
                              s.payment_type === 'cash' || s.payment_type === 'cod' ? 'bg-success/20 text-success' :
                              'bg-warning/20 text-warning'
                            }`}>{s.payment_type}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-semibold text-main-text">{formatBDT(s.sell_price)}</p>
                            {s.cost_price > 0 && <p className="text-[10px] text-neon-green">+{formatBDT(s.sell_price - s.cost_price)}</p>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}