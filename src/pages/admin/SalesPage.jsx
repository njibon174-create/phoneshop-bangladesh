import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import BarcodeScanner from '../../components/admin/BarcodeScanner'

const PAYMENT_CONFIG = {
  cash: { label: 'Cash', bg: 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]', dot: 'bg-emerald-400' },
  baki: { label: 'Baki', bg: 'bg-[#FBBF2420] text-[#FBBF24] border-[#FBBF2450]', dot: 'bg-amber-400' },
  returned: {
    label: 'Returned',
    dot: 'bg-gray-400',
    bg: 'bg-[#9CA3AF20] text-[#9CA3AF] border-[#9CA3AF50]',
  },
}

const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]', dot: 'bg-emerald-400' },
  pending:   { label: 'Pending',   bg: 'bg-[#FBBF2420] text-[#FBBF24] border-[#FBBF2450]', dot: 'bg-amber-400' },
  partial:   { label: 'Partial',   bg: 'bg-[#60A5FA20] text-[#60A5FA] border-[#60A5FA50]', dot: 'bg-blue-400' },
  cleared:   { label: 'Cleared',   bg: 'bg-[#1E2A3A] text-[#9CA3AF] border-[#1E3A5F]', dot: 'bg-slate-400' },
  returned: {
    label: 'Returned',
    dot: 'bg-gray-400',
    bg: 'bg-[#9CA3AF20] text-[#9CA3AF] border-[#9CA3AF50]',
  },
}

const CREDIT_STATUS_CONFIG = {
  pending: { label: 'Unpaid', bg: 'bg-[#FBBF2420] text-[#FBBF24] border-[#FBBF2450]', dot: 'bg-amber-400' },
  partial: { label: 'Partial', bg: 'bg-[#60A5FA20] text-[#60A5FA] border-[#60A5FA50]', dot: 'bg-blue-400' },
  cleared: { label: 'Cleared', bg: 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]', dot: 'bg-emerald-400' },
}

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
// Skeleton card
function SkeletonCard() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-28 rounded bg-[#1E2A3A] animate-pulse" />
          <div className="h-3 w-20 rounded bg-[#1E2A3A] animate-pulse" />
        </div>
        <div className="h-5 w-14 rounded-full bg-[#1E2A3A] animate-pulse" />
      </div>
      <div className="space-y-1">
        <div className="h-3 w-16 rounded bg-[#1E2A3A] animate-pulse" />
        <div className="h-6 w-24 rounded bg-[#1E2A3A] animate-pulse" />
      </div>
      <div className="h-10 rounded-lg bg-[#1E2A3A] animate-pulse" />
      <div className="flex items-center justify-between pt-1 border-t border-[#1E3A5F]">
        <div className="h-3 w-20 rounded bg-[#1E2A3A] animate-pulse" />
        <div className="h-5 w-16 rounded-full bg-[#1E2A3A] animate-pulse" />
      </div>
    </div>
  )
}

export default function SalesList() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [returnSale, setReturnSale] = useState(null)
  const [returnReason, setReturnReason] = useState('')

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  function setQuickFilter(preset) {
    const today = new Date()
    const fmt = d => d.toISOString().split('T')[0]
    if (preset === 'today') {
      setDateFrom(fmt(today))
      setDateTo(fmt(today))
    } else if (preset === 'this_week') {
      const day = today.getDay() || 7
      const monday = new Date(today)
      monday.setDate(today.getDate() - day + 1)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      setDateFrom(fmt(monday))
      setDateTo(fmt(sunday))
    } else if (preset === 'this_month') {
      const y = today.getFullYear(), m = today.getMonth()
      setDateFrom(`${y}-${String(m+1).padStart(2,'0')}-01`)
      const last = new Date(y, m+1, 0)
      setDateTo(fmt(last))
    } else if (preset === 'all') {
      setDateFrom('')
      setDateTo('')
    }
  }

  async function fetchSales() {
    setLoading(true)
    const { data } = await supabase
      .from('sales')
      .select(`
        id,
        sell_price,
        payment_type,
        buyer_name,
        buyer_phone,
        status,
        sale_date,
        created_at,
        phone_id,
        phone:phones(brand, model, imei),
        credit:credits(id, status, remaining, paid_amount, total_due)
      `)
      .order('created_at', { ascending: false })
    setSales(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchSales() }, [])

  async function handleReturn(sale) {
    if (!sale) return
    let creditRecord = null
    if (sale.payment_type === 'baki') {
      const { data: credit } = await supabase
        .from('credits')
        .select('*')
        .eq('sale_id', sale.id)
        .single()
      creditRecord = credit
    }
    // Update sale status
    const { error: saleErr } = await supabase
      .from('sales')
      .update({ status: 'returned' })
      .eq('id', sale.id)
    if (saleErr) { showToast('Failed to return sale', 'error'); return }
    // Update phone back to in_stock
    const { error: phoneErr } = await supabase
      .from('phones')
      .update({ status: 'in_stock' })
      .eq('id', sale.phone_id)
    if (phoneErr) { showToast('Failed to update phone status', 'error'); return }
    // CASE 1: cash sale — insert refund transaction
    if (sale.payment_type === 'cash') {
      await supabase.from('cash_transactions').insert({
        type: 'refund',
        amount: sale.sell_price,
        note: `Refund: ${sale.phone?.brand} ${sale.phone?.model} return`,
        transaction_date: new Date().toISOString().split('T')[0],
      })
    }
    // CASE 2: baki sale
    if (sale.payment_type === 'baki' && creditRecord) {
      if (creditRecord.paid_amount > 0) {
        await supabase.from('cash_transactions').insert({
          type: 'refund',
          amount: creditRecord.paid_amount,
          note: `Refund: ${sale.phone?.brand} ${sale.phone?.model} return (partial payment returned)`,
          transaction_date: new Date().toISOString().split('T')[0],
        })
      }
      await supabase.from('credits').update({
        status: 'cancelled',
        remaining: 0,
      }).eq('id', creditRecord.id)
    }
    showToast('Phone returned successfully')
    setReturnSale(null)
    setReturnReason('')
    fetchSales()
  }

  const filtered = sales.filter(s => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q || (s.phone?.imei || '').toLowerCase().includes(q)
      || (s.buyer_name || '').toLowerCase().includes(q)
      || (s.buyer_phone || '').toLowerCase().includes(q)
    const matchPayment = paymentFilter === 'all' || s.payment_type === paymentFilter
    const matchFrom = !dateFrom || (s.sale_date && s.sale_date >= dateFrom)
    const matchTo   = !dateTo   || (s.sale_date && s.sale_date <= dateTo)
    return matchSearch && matchPayment && matchFrom && matchTo
  })

  const totalSales  = filtered.length
  const totalAmount = filtered.reduce((s, sale) => s + Number(sale.sell_price || 0), 0)
  const cashTotal   = filtered.filter(s => s.payment_type === 'cash').reduce((s, sale) => s + Number(sale.sell_price || 0), 0)
  const bakiTotal   = filtered.filter(s => s.payment_type === 'baki').reduce((s, sale) => s + Number(sale.sell_price || 0), 0)

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === 'error'
            ? 'bg-[#F8717120] text-[#F87171] border-[#F8717150]'
            : 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="stat-card">
          <span className="stat-label">Total Sales</span>
          <span className="stat-value">{totalSales}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Amount</span>
          <span className="stat-value text-base">৳{formatCurrency(totalAmount)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Cash Sales</span>
          <span className="stat-value text-base text-[#39FF88]">৳{formatCurrency(cashTotal)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Baki Sales</span>
          <span className="stat-value text-base text-[#FBBF24]">৳{formatCurrency(bakiTotal)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <div>
            <label className="text-xs text-[#9CA3AF] font-medium mb-1 block">From</label>
            <input
              type="date"
              className="input py-1.5 text-sm"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-[#9CA3AF] font-medium mb-1 block">To</label>
            <input
              type="date"
              className="input py-1.5 text-sm"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[['today','Today'],['this_week','This Week'],['this_month','This Month'],['all','All Time']].map(([val, label]) => (
            <button
              key={val}
              className={`btn btn-sm ${(val === 'all' && !dateFrom && !dateTo) || (val === 'today' && dateFrom === new Date().toISOString().split('T')[0] && dateTo === new Date().toISOString().split('T')[0]) ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setQuickFilter(val)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            className="input pl-9 pr-9"
            placeholder="Search IMEI, buyer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#E5E7EB] p-0.5"
              onClick={() => setSearch('')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        <button
          className="btn-secondary px-3"
          onClick={() => setShowScanner(true)}
          title="Scan barcode"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>

        <select
          className="input w-auto"
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
        >
          <option value="all">All Payments</option>
          <option value="cash">Cash</option>
          <option value="baki">Baki (Credit)</option>
        </select>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-[#9CA3AF]">
          {filtered.length === 0
            ? 'No sales yet'
            : `Showing ${filtered.length} sale${filtered.length !== 1 ? 's' : ''}`
          }
        </p>
      )}
      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Loading skeletons */}
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1E2A3A] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#E5E7EB]">No sales recorded yet</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Complete a sale from the Inventory page</p>
            </div>
          </div>
        )}

        {/* Sales cards */}
        {!loading && filtered.map(sale => {
          const phone = sale.phone
          const pmtConfig = PAYMENT_CONFIG[sale.payment_type] || PAYMENT_CONFIG.cash
          const stConfig  = STATUS_CONFIG[sale.status] || STATUS_CONFIG.completed
          return (
            <div
              key={sale.id}
              className="card p-4 flex flex-col gap-3 border border-[#1E3A5F] hover:border-[#39FF8850] transition-colors"
            >
              {/* Header: Phone + Payment Badge */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-[#E5E7EB] truncate">{phone?.brand} {phone?.model}</p>
                  <p className="font-mono text-xs text-[#9CA3AF] mt-0.5 tracking-wider">{phone?.imei || '—'}</p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${pmtConfig.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${pmtConfig.dot}`} />
                    {pmtConfig.label}
                  </span>
                  {sale.payment_type === 'baki' && sale.credit && (
                    (() => {
                      const creditStatus = Array.isArray(sale.credit)
                        ? sale.credit.find(c => c)?.status
                        : sale.credit.status
                      const creditCfg = CREDIT_STATUS_CONFIG[creditStatus]
                      if (!creditCfg) return null
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${creditCfg.bg}`}>
                          {creditStatus === 'cleared' && '✓ '}{creditCfg.label}
                        </span>
                      )
                    })()
                  )}
                </div>
              </div>

              {/* Sell Price */}
              <div>
                <p className="text-xs text-[#9CA3AF] font-medium">Sell Price</p>
                <p className="text-xl font-bold text-[#E5E7EB]">৳{formatCurrency(sale.sell_price)}</p>
              </div>

              {/* Buyer info — only for Baki */}
              {sale.payment_type === 'baki' && (
                <div className="rounded-lg bg-[#FBBF2420] border border-[#FBBF2450] px-3 py-2">
                  <p className="text-xs text-[#FBBF24] font-medium mb-1">Credit Buyer</p>
                  <p className="text-sm font-semibold text-[#E5E7EB]">{sale.buyer_name || '—'}</p>
                  {sale.buyer_phone && (
                    <p className="text-xs text-[#9CA3AF]">{sale.buyer_phone}</p>
                  )}
                </div>
              )}

              {/* Footer: Sale Date + Status + Return Button */}
              <div className="flex items-center justify-between pt-1 border-t border-[#1E3A5F] mt-auto">
                <p className="text-xs text-[#9CA3AF]">Sold {formatDate(sale.sale_date)}</p>
                {sale.status === 'completed' && (
                  <button
                    className="btn btn-sm text-[#9CA3AF] hover:text-[#F87171] hover:bg-[#F8717120] border border-[#9CA3AF50]"
                    onClick={() => { setReturnSale(sale); setReturnReason('') }}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"/>
                    </svg>
                    Return
                  </button>
                )}
                {sale.status !== 'completed' && sale.status !== 'returned' && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${stConfig.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${stConfig.dot}`} />
                    {stConfig.label}
                  </span>
                )}
                {sale.status === 'returned' && (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG.returned.bg}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG.returned.dot}`} />
                    Returned
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Return Confirmation Modal */}
      {returnSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 shadow-2xl border border-[#1E3A5F]">
            <h3 className="text-base font-semibold text-[#E5E7EB] mb-1">Confirm Return</h3>
            <p className="text-sm text-[#9CA3AF] mb-4">This will return the phone to inventory and process the refund.</p>
            <div className="rounded-xl bg-[#1E2A3A] border border-[#1E3A5F] p-4 mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#9CA3AF]">Phone</span>
                <span className="text-sm font-medium text-[#E5E7EB]">{returnSale.phone?.brand} {returnSale.phone?.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#9CA3AF]">IMEI</span>
                <span className="font-mono text-xs text-[#9CA3AF]">{returnSale.phone?.imei}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#9CA3AF]">Sell Price</span>
                <span className="text-sm font-semibold text-[#E5E7EB]">৳{formatCurrency(returnSale.sell_price)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#9CA3AF]">Payment</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${PAYMENT_CONFIG[returnSale.payment_type]?.bg || ''}`}>
                  {returnSale.payment_type === 'cash' ? 'Cash' : 'Baki'}
                </span>
              </div>
              {returnSale.payment_type === 'baki' && returnSale.credit && (
                <div className="flex justify-between">
                  <span className="text-sm text-[#9CA3AF]">Already Paid</span>
                  <span className="text-sm font-medium text-[#FBBF24]">৳{formatCurrency(
                    Array.isArray(returnSale.credit)
                      ? (returnSale.credit[0]?.paid_amount || 0)
                      : (returnSale.credit?.paid_amount || 0)
                  )}</span>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="label">Reason for Return <span className="text-[#9CA3AF]">(optional)</span></label>
              <textarea
                className="input min-h-[80px] resize-none"
                placeholder="e.g. Customer exchange, defective unit…"
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => { setReturnSale(null); setReturnReason('') }}>Cancel</button>
              <button
                className="btn flex-1 justify-center bg-[#F8717120] text-[#F87171] border border-[#F8717150] hover:bg-[#F8717130]"
                onClick={() => handleReturn(returnSale)}
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <BarcodeScanner
          title="Scan IMEI to Search Sales"
          onScan={(code) => {
            setShowScanner(false)
            setSearch(code)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
