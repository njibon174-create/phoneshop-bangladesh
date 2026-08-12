import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { ToastContainer, showToast } from '../../components/admin/Toast'
import { supabase } from '../../lib/supabase'
import { Search, ChevronRight, X, Calendar, RotateCcw, Filter, Download } from 'lucide-react'

function formatBDT(n) {
  return '\u09F3' + Number(n || 0).toLocaleString('en-IN')
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PAYMENT_CONFIG = {
  cash: { label: 'Cash', bg: 'bg-success/20 text-success border-success/30' },
  baki: { label: 'Baki', bg: 'bg-warning/20 text-warning border-warning/30' },
  cod: { label: 'COD', bg: 'bg-neon-blue/20 text-neon-blue border-neon-blue/30' },
}

const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: 'bg-success/20 text-success' },
  pending: { label: 'Pending', bg: 'bg-warning/20 text-warning' },
  returned: { label: 'Returned', bg: 'bg-error/20 text-error' },
  cancelled: { label: 'Cancelled', bg: 'bg-muted-text/20 text-muted-text' },
}

export function AdminSales() {
  const [sales, setSales] = useState([])
  const [phones, setPhones] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [openId, setOpenId] = useState(null)
  const [returning, setReturning] = useState(null)
  const [returnReason, setReturnReason] = useState('')

  async function load() {
    setLoading(true)
    const { data: salesData } = await supabase
      .from('sales').select('*').order('sale_date', { ascending: false }).order('created_at', { ascending: false }).limit(500)
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

  function setQuickFilter(preset) {
    const today = new Date()
    const fmt = d => d.toISOString().split('T')[0]
    if (preset === 'today') {
      setDateFrom(fmt(today)); setDateTo(fmt(today))
    } else if (preset === 'this_week') {
      const day = today.getDay() || 7
      const monday = new Date(today); monday.setDate(today.getDate() - day + 1)
      setDateFrom(fmt(monday)); setDateTo(fmt(today))
    } else if (preset === 'this_month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      setDateFrom(fmt(first)); setDateTo(fmt(today))
    } else if (preset === 'all') {
      setDateFrom(''); setDateTo('')
    }
  }

  function exportCSV() {
    if (filtered.length === 0) { showToast('No sales to export', 'error'); return }
    const rows = [['Date', 'Brand', 'Model', 'IMEI', 'Buyer', 'Phone', 'Sell Price', 'Cost Price', 'Profit', 'Payment', 'Status', 'Note']]
    for (const s of filtered) {
      const phone = phones[s.phone_id] || {}
      rows.push([
        s.sale_date, phone.brand || '', phone.model || '', phone.imei || '',
        s.buyer_name || '', s.buyer_phone || '',
        s.sell_price, s.cost_price || 0, (s.sell_price || 0) - (s.cost_price || 0),
        s.payment_type, s.status, s.notes || '',
      ])
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `PhoneShop_Sales_${dateFrom || 'all'}_to_${dateTo || 'all'}.csv`
    a.click(); URL.revokeObjectURL(url)
    showToast('Sales exported.', 'success')
  }

  const filtered = sales.filter((s) => {
    if (paymentFilter !== 'all' && s.payment_type !== paymentFilter) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (dateFrom && s.sale_date < dateFrom) return false
    if (dateTo && s.sale_date > dateTo) return false
    if (search) {
      const phone = phones[s.phone_id] || {}
      const txt = `${s.id} ${phone.brand || ''} ${phone.model || ''} ${phone.imei || ''} ${s.buyer_name || ''} ${s.buyer_phone || ''}`.toLowerCase()
      if (!txt.includes(search.toLowerCase())) return false
    }
    return true
  })

  const totalRevenue = filtered.reduce((s, x) => s + Number(x.sell_price || 0), 0)
  const totalProfit = filtered.reduce((s, x) => s + Number(x.sell_price || 0) - Number(x.cost_price || 0), 0)
  const cashCount = filtered.filter((x) => x.payment_type === 'cash').length
  const bakiCount = filtered.filter((x) => x.payment_type === 'baki').length
  const codCount = filtered.filter((x) => x.payment_type === 'cod').length
  const returnedCount = filtered.filter((x) => x.status === 'returned').length

  async function handleReturn() {
    if (!returning) return
    const { id, phone_id, payment_type, sell_price, cost_price } = returning

    // 1. Update sale
    const { error: saleErr } = await supabase.from('sales').update({ status: 'returned' }).eq('id', id)
    if (saleErr) { showToast('Failed to return sale', 'error'); returnReturning(); return }

    // 2. Update phone back to in_stock
    if (phone_id) {
      await supabase.from('phones').update({ status: 'in_stock' }).eq('id', phone_id)
    }

    // 3. Refund
    if (payment_type === 'cash') {
      await supabase.from('cash_transactions').insert({
        type: 'refund', direction: 'out', amount: sell_price,
        note: `Refund: return${returnReason ? ' - ' + returnReason : ''}`,
        transaction_date: new Date().toISOString().slice(0, 10),
      })
    } else if (payment_type === 'baki') {
      // Cancel the related credit
      const { data: credit } = await supabase.from('credits').select('*').eq('sale_id', id).maybeSingle()
      if (credit) {
        if (credit.paid_amount > 0) {
          await supabase.from('cash_transactions').insert({
            type: 'refund', direction: 'out', amount: credit.paid_amount,
            note: `Baki refund for cancelled sale`,
            transaction_date: new Date().toISOString().slice(0, 10),
          })
        }
        await supabase.from('credits').update({ status: 'cancelled', remaining: 0 }).eq('id', credit.id)
      }
    } else if (payment_type === 'cod') {
      // For COD returns, just track as a manual expense or skip
      await supabase.from('cash_transactions').insert({
        type: 'refund', direction: 'out', amount: sell_price,
        note: `COD order returned${returnReason ? ' - ' + returnReason : ''}`,
        transaction_date: new Date().toISOString().slice(0, 10),
      })
    }

    returnReturning()
    load()
    showToast('Sale returned, phone back in stock.', 'success')
  }

  function returnReturning() { setReturning(null); setReturnReason('') }

  // Group by date
  const grouped = {}
  for (const s of filtered) {
    const date = s.sale_date
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(s)
  }

  return (
    <AdminLayout title="Sales" subtitle="All sales transactions" actions={
      <button onClick={exportCSV} className="btn-secondary text-sm py-2 px-3 inline-flex items-center gap-1">
        <Download className="w-4 h-4" /> Export CSV
      </button>
    }>
      <ToastContainer />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Sales</p><p className="text-2xl font-bold text-main-text">{filtered.length}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Revenue</p><p className="text-2xl font-bold text-neon-green">{formatBDT(totalRevenue)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Profit</p><p className="text-2xl font-bold text-neon-blue">{formatBDT(totalProfit)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Cash / Baki / COD</p><p className="text-sm font-bold text-main-text">{cashCount} / {bakiCount} / {codCount}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Returned</p><p className="text-2xl font-bold text-danger">{returnedCount}</p></div>
      </div>

      <div className="card p-4 mb-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-sec-text uppercase tracking-wider flex items-center gap-1"><Filter className="w-3 h-3" /> Date:</span>
          {[
            ['all', 'All time'],
            ['today', 'Today'],
            ['this_week', 'This week'],
            ['this_month', 'This month'],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setQuickFilter(k)} className={`px-3 py-1 text-xs rounded ${(!dateFrom && !dateTo && k === 'all') || (k === 'today' && dateFrom === new Date().toISOString().slice(0, 10) && dateTo === dateFrom) || (k === 'this_week' && (() => { const d=new Date(); const day=d.getDay()||7; const monday=new Date(d); monday.setDate(d.getDate()-day+1); return dateFrom===monday.toISOString().slice(0,10) && dateTo===d.toISOString().slice(0,10) })()) || (k === 'this_month' && dateFrom === new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10)) ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-elev-bg text-sec-text border border-border'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-muted-text" />
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input w-36 text-xs py-1" />
            <span className="text-muted-text text-xs">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input w-36 text-xs py-1" />
          </div>
          {(dateFrom || dateTo) && <button onClick={() => setQuickFilter('all')} className="text-xs text-muted-text hover:text-main-text">Clear dates</button>}
        </div>
        <div className="flex gap-1 flex-wrap">
          <span className="text-xs text-sec-text uppercase tracking-wider self-center">Payment:</span>
          {['all', 'cash', 'baki', 'cod'].map((p) => (
            <button key={p} onClick={() => setPaymentFilter(p)} className={`px-3 py-1 text-xs rounded ${paymentFilter === p ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-elev-bg text-sec-text border border-border'}`}>{p === 'all' ? 'All' : PAYMENT_CONFIG[p]?.label || p}</button>
          ))}
          <span className="text-xs text-sec-text uppercase tracking-wider self-center ml-2">Status:</span>
          {['all', 'completed', 'returned', 'cancelled'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1 text-xs rounded ${statusFilter === s ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-elev-bg text-sec-text border border-border'}`}>{s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 bg-elev-bg border border-border rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-text" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search IMEI, brand, buyer..." className="flex-1 bg-transparent text-sm text-main-text outline-none placeholder:text-muted-text" />
        </div>
      </div>

      {returning && (
        <div className="card p-5 mb-4 border-danger/40">
          <h3 className="font-semibold text-main-text mb-3">Return sale: {returning.phone?.brand} {returning.phone?.model}</h3>
          <p className="text-sm text-sec-text mb-3">Refund amount: <span className="text-danger font-bold">{formatBDT(returning.sell_price)}</span> · Status will become 'returned' and phone goes back to in_stock.</p>
          <div className="mb-3">
            <label className="block text-xs font-medium text-sec-text mb-1.5">Reason (optional)</label>
            <input type="text" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="input" placeholder="e.g. customer changed mind" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleReturn} className="btn-primary text-sm py-2 px-4 flex items-center gap-1 bg-danger hover:bg-danger"><RotateCcw className="w-4 h-4" /> Confirm Return + Refund</button>
            <button onClick={returnReturning} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-5xl mb-3">💵</p><p className="text-sec-text">No sales match your filters.</p></div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-sec-text">{formatDate(date)}</h3>
                <p className="text-xs text-muted-text">{items.length} sales · {formatBDT(items.reduce((s, x) => s + Number(x.sell_price), 0))}</p>
              </div>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-border">
                    {items.map((s) => {
                      const phone = phones[s.phone_id] || {}
                      return (
                        <tr key={s.id} className="hover:bg-elev-bg/30">
                          <td className="px-4 py-3 cursor-pointer" onClick={() => setOpenId(openId === s.id ? null : s.id)}>
                            <p className="text-sm font-medium text-main-text">{phone.brand ? `${phone.brand} ${phone.model}` : 'Manual sale'}</p>
                            <p className="text-[10px] text-muted-text font-mono">{phone.imei || s.id.slice(0, 8)}</p>
                            {openId === s.id && (
                              <div className="mt-2 p-3 bg-elev-bg rounded-lg text-xs space-y-1">
                                <p className="text-sec-text">Sale ID: <span className="text-main-text font-mono">{s.id.slice(0, 13)}...</span></p>
                                {s.buyer_name && <p className="text-sec-text">Buyer: <span className="text-main-text">{s.buyer_name} ({s.buyer_phone || 'no phone'})</span></p>}
                                {s.notes && <p className="text-sec-text">Notes: <span className="text-main-text">{s.notes}</span></p>}
                                {s.cost_price > 0 && <p className="text-sec-text">Profit: <span className="text-neon-green font-semibold">{formatBDT(s.sell_price - s.cost_price)}</span></p>}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge text-[10px] ${PAYMENT_CONFIG[s.payment_type]?.bg || 'bg-elev-bg text-muted-text'}`}>{PAYMENT_CONFIG[s.payment_type]?.label || s.payment_type}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`badge text-[10px] ${STATUS_CONFIG[s.status]?.bg || ''}`}>{STATUS_CONFIG[s.status]?.label || s.status}</span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-semibold text-main-text">{formatBDT(s.sell_price)}</p>
                            {s.cost_price > 0 && <p className="text-[10px] text-neon-green">+{formatBDT(s.sell_price - s.cost_price)}</p>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {s.status === 'completed' && (
                              <button onClick={() => setReturning(s)} className="btn-ghost p-1.5 text-danger hover:bg-danger/10" title="Return sale">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
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
