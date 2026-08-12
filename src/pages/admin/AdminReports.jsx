import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { ToastContainer, showToast } from '../../components/admin/Toast'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { TrendingUp, Package, Award, AlertTriangle, Download, ChevronLeft, ChevronRight, TrendingDown, Minus, Wallet, Receipt } from 'lucide-react'

function formatBDT(n) {
  return '\u09F3' + Number(n || 0).toLocaleString('en-IN')
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function pctChange(current, previous) {
  if (previous == null) return null
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function getMonthRange(year, month) {
  const start = new Date(year, month, 1).toISOString().slice(0, 10)
  const lastDay = new Date(year, month + 1, 0).getDate()
  const end = new Date(year, month, lastDay).toISOString().slice(0, 10)
  return { start, end }
}

export function AdminReports() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [prev, setPrev] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)

  useEffect(() => { load() }, [selectedYear, selectedMonth])

  async function load() {
    setLoading(true)
    const { start: cs, end: ce } = getMonthRange(selectedYear, selectedMonth)
    const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1
    const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear
    const { start: ps, end: pe } = getMonthRange(prevYear, prevMonth)

    const [curSales, prevSales, allCash, allCredits, phones, products, inventory] = await Promise.all([
      supabase.from('sales').select('*').gte('sale_date', cs).lte('sale_date', ce),
      supabase.from('sales').select('*').gte('sale_date', ps).lte('sale_date', pe),
      supabase.from('cash_transactions').select('*').gte('transaction_date', cs).lte('transaction_date', ce),
      supabase.from('credits').select('*'),
      supabase.from('phones').select('id, brand, model, product_id, status, buy_price'),
      supabase.from('products').select('id, name, brand_name, price_bdt, stock_count, is_active'),
      supabase.from('inventory').select('product_id, stock_count, low_stock_at').lte('stock_count', 5),
    ])

    function summarizeSales(rows) {
      if (!rows) return null
      const completed = rows.filter((r) => r.status === 'completed' || !r.status)
      return {
        count: completed.length,
        amount: completed.reduce((s, r) => s + Number(r.sell_price || 0), 0),
        cashAmount: completed.filter((r) => r.payment_type === 'cash').reduce((s, r) => s + Number(r.sell_price || 0), 0),
        bakiAmount: completed.filter((r) => r.payment_type === 'baki').reduce((s, r) => s + Number(r.sell_price || 0), 0),
        codAmount: completed.filter((r) => r.payment_type === 'cod').reduce((s, r) => s + Number(r.sell_price || 0), 0),
        costAmount: completed.reduce((s, r) => s + Number(r.cost_price || 0), 0),
        grossProfit: completed.reduce((s, r) => s + Number(r.sell_price || 0) - Number(r.cost_price || 0), 0),
      }
    }

    function summarizeCash(rows) {
      if (!rows) return null
      return {
        investment: rows.filter((t) => t.type === 'investment').reduce((s, t) => s + Number(t.amount || 0), 0),
        withdrawal: rows.filter((t) => t.type === 'withdrawal').reduce((s, t) => s + Number(t.amount || 0), 0),
        expenses: rows.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0),
        refunds: rows.filter((t) => t.type === 'refund').reduce((s, t) => s + Number(t.amount || 0), 0),
        saleCashIn: rows.filter((t) => t.type === 'sale_cash').reduce((s, t) => s + Number(t.amount || 0), 0),
        bakiIn: rows.filter((t) => t.type === 'sale_baki_paid').reduce((s, t) => s + Number(t.amount || 0), 0),
        netFlow: rows.reduce((s, t) => s + (t.direction === 'in' ? Number(t.amount || 0) : -Number(t.amount || 0)), 0),
        in: rows.filter((t) => t.direction === 'in').reduce((s, t) => s + Number(t.amount || 0), 0),
        out: rows.filter((t) => t.direction === 'out').reduce((s, t) => s + Number(t.amount || 0), 0),
      }
    }

    function summarizeCredits(rows) {
      if (!rows) return null
      const active = rows.filter((c) => c.status === 'pending' || c.status === 'partial')
      return {
        newCount: rows.length,
        newAmount: rows.reduce((s, c) => s + Number(c.total_due || 0), 0),
        outstanding: active.reduce((s, c) => s + Number(c.remaining || 0), 0),
        clearedAmount: rows.filter((c) => c.status === 'cleared').reduce((s, c) => s + Number(c.total_due || 0), 0),
      }
    }

    const curData = {
      sales: summarizeSales(curSales.data),
      cash: summarizeCash(allCash.data),
      baki: summarizeCredits(allCredits.data),
    }
    const prevData = {
      sales: summarizeSales(prevSales.data),
      cash: summarizeCash([]),
      baki: summarizeCredits([]),
    }

    setData(curData)
    setPrev(prevData)

    // Top products (last 30 days)
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const recentSales = (curSales.data || []).filter((s) => new Date(s.sale_date) >= cutoff)
    const productSales = {}
    for (const s of recentSales) {
      const phone = (phones.data || []).find((p) => p.id === s.phone_id)
      if (!phone || !phone.product_id) continue
      const product = (products.data || []).find((p) => p.id === phone.product_id)
      if (!productSales[phone.product_id]) {
        productSales[phone.product_id] = { name: product?.name || `${phone.brand} ${phone.model}`, brand: product?.brand_name || phone.brand, count: 0, revenue: 0, profit: 0 }
      }
      productSales[phone.product_id].count += 1
      productSales[phone.product_id].revenue += Number(s.sell_price || 0)
      productSales[phone.product_id].profit += Number(s.sell_price || 0) - Number(s.cost_price || 0)
    }
    const top = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

    // Low stock
    const allProducts = products.data || []
    const low = (inventory.data || []).map((inv) => {
      const p = allProducts.find((x) => x.id === inv.product_id)
      return p ? { name: p.name, brand: p.brand_name, stock: inv.stock_count } : null
    }).filter(Boolean).sort((a, b) => a.stock - b.stock)

    setTopProducts(top)
    setLowStock(low)
    setLoading(false)
  }

  function prevMonth() {
    if (selectedMonth === 0) {
      setSelectedMonth(11); setSelectedYear(selectedYear - 1)
    } else setSelectedMonth(selectedMonth - 1)
  }
  function nextMonth() {
    if (selectedMonth === 11) {
      setSelectedMonth(0); setSelectedYear(selectedYear + 1)
    } else setSelectedMonth(selectedMonth + 1)
  }

  function exportExcel() {
    if (!data) { setExportError('Data still loading.'); return }
    setExporting(true); setExportError(null)
    try {
      const cs = data.sales || {}; const ps = prev?.sales || {}; const cash = data.cash || {}; const pcash = prev?.cash || {}; const bk = data.baki || {}
      const wb = XLSX.utils.book_new()
      const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
      const generatedAt = new Date()
      const summaryRows = [
        ['PhoneShop BD - Monthly Report'],
        [monthLabel],
        [`Generated: ${generatedAt.toLocaleString('en-GB')}`],
        [],
        ['Section', 'Metric', 'This Month', 'Prev Month', 'Change'],
        ['Sales', 'Phones Sold', cs.count || 0, ps.count || 0, formatPct(cs.count, ps.count)],
        ['Sales', 'Total Revenue', cs.amount || 0, ps.amount || 0, formatPct(cs.amount, ps.amount)],
        ['Sales', 'Cash Sales', cs.cashAmount || 0, ps.cashAmount || 0, formatPct(cs.cashAmount, ps.cashAmount)],
        ['Sales', 'Baki Sales', cs.bakiAmount || 0, ps.bakiAmount || 0, formatPct(cs.bakiAmount, ps.bakiAmount)],
        ['Sales', 'COD Sales', cs.codAmount || 0, ps.codAmount || 0, formatPct(cs.codAmount, ps.codAmount)],
        ['Sales', 'Cost of Goods', cs.costAmount || 0, ps.costAmount || 0, formatPct(cs.costAmount, ps.costAmount)],
        ['Sales', 'Gross Profit', cs.grossProfit || 0, ps.grossProfit || 0, formatPct(cs.grossProfit, ps.grossProfit)],
        ['Cash', 'Investment', cash.investment || 0, pcash.investment || 0, formatPct(cash.investment, pcash.investment)],
        ['Cash', 'Withdrawals', cash.withdrawal || 0, pcash.withdrawal || 0, formatPct(cash.withdrawal, pcash.withdrawal)],
        ['Cash', 'Expenses', cash.expenses || 0, pcash.expenses || 0, formatPct(cash.expenses, pcash.expenses)],
        ['Cash', 'Refunds', cash.refunds || 0, pcash.refunds || 0, formatPct(cash.refunds, pcash.refunds)],
        ['Cash', 'Net Flow', cash.netFlow || 0, pcash.netFlow || 0, formatPct(cash.netFlow, pcash.netFlow)],
        ['Baki', 'New Credits', bk.newCount || 0, '', ''],
        ['Baki', 'New Credit Amount', bk.newAmount || 0, '', ''],
        ['Baki', 'Total Outstanding', bk.outstanding || 0, '', ''],
        ['Baki', 'Cleared', bk.clearedAmount || 0, '', ''],
      ]
      const summaryWs = XLSX.utils.aoa_to_array(summaryRows)
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary')

      // Top products sheet
      const topRows = [['Rank', 'Brand', 'Phone', 'Units Sold', 'Revenue', 'Profit']]
      topProducts.forEach((p, i) => topRows.push([i + 1, p.brand, p.name, p.count, p.revenue, p.profit]))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_array(topRows), 'Top Products')

      // Low stock sheet
      const lowRows = [['Brand', 'Phone', 'Stock Left']]
      lowStock.forEach((p) => lowRows.push([p.brand, p.name, p.stock]))
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_array(lowRows), 'Low Stock')

      XLSX.writeFile(wb, `PhoneShop_Report_${MONTH_NAMES[selectedMonth]}_${selectedYear}.xlsx`)
      showToast('Excel report downloaded.', 'success')
    } catch (e) {
      setExportError('Export failed: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  function formatPct(cur, prev) {
    const p = pctChange(cur, prev)
    if (p == null) return ''
    const sign = p > 0 ? '+' : ''
    return `${sign}${p.toFixed(1)}%`
  }

  return (
    <AdminLayout title="Reports" subtitle="Monthly performance with comparison" actions={
      <div className="flex gap-2">
        <button onClick={prevMonth} className="btn-secondary p-2"><ChevronLeft className="w-4 h-4" /></button>
        <span className="px-3 py-2 text-sm font-semibold text-main-text min-w-[140px] text-center">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
        <button onClick={nextMonth} className="btn-secondary p-2"><ChevronRight className="w-4 h-4" /></button>
        <button onClick={exportExcel} disabled={exporting} className="btn-primary text-sm py-2 px-3 inline-flex items-center gap-1 disabled:opacity-50">
          <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Excel'}
        </button>
      </div>
    }>
      <ToastContainer />

      {exportError && <div className="card p-3 mb-4 text-danger text-sm">{exportError}</div>}

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-5 animate-pulse h-24" />)}</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Sales section */}
          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2"><Receipt className="w-4 h-4 text-neon-green" /> Sales</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatRow label="Phones sold" value={data.sales?.count || 0} prev={prev?.sales?.count} />
              <StatRow label="Total revenue" value={formatBDT(data.sales?.amount || 0)} prev={formatBDT(prev?.sales?.amount || 0)} isCurrency />
              <StatRow label="Cash sales" value={formatBDT(data.sales?.cashAmount || 0)} prev={formatBDT(prev?.sales?.cashAmount || 0)} isCurrency />
              <StatRow label="Baki sales" value={formatBDT(data.sales?.bakiAmount || 0)} prev={formatBDT(prev?.sales?.bakiAmount || 0)} isCurrency />
              <StatRow label="COD sales" value={formatBDT(data.sales?.codAmount || 0)} prev={formatBDT(prev?.sales?.codAmount || 0)} isCurrency />
              <StatRow label="Cost of goods" value={formatBDT(data.sales?.costAmount || 0)} prev={formatBDT(prev?.sales?.costAmount || 0)} isCurrency invertColors />
              <StatRow label="Gross profit" value={formatBDT(data.sales?.grossProfit || 0)} prev={formatBDT(prev?.sales?.grossProfit || 0)} isCurrency highlight />
            </div>
          </div>

          {/* Cash section */}
          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2"><Wallet className="w-4 h-4 text-neon-blue" /> Cash book (this month)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <StatRow label="Investment" value={formatBDT(data.cash?.investment || 0)} prev={null} />
              <StatRow label="Withdrawals" value={formatBDT(data.cash?.withdrawal || 0)} prev={null} />
              <StatRow label="Expenses" value={formatBDT(data.cash?.expenses || 0)} prev={null} />
              <StatRow label="Refunds" value={formatBDT(data.cash?.refunds || 0)} prev={null} />
              <StatRow label="Cash in" value={formatBDT(data.cash?.in || 0)} prev={null} highlight />
              <StatRow label="Cash out" value={formatBDT(data.cash?.out || 0)} prev={null} invertColors />
              <StatRow label="Net flow" value={formatBDT(data.cash?.netFlow || 0)} prev={null} highlight />
            </div>
          </div>

          {/* Baki section */}
          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-warning" /> Baki / Credit</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card p-3 bg-elev-bg/50">
                <p className="text-xs text-sec-text uppercase">New credits</p>
                <p className="text-xl font-bold text-main-text">{data.baki?.newCount || 0}</p>
              </div>
              <div className="card p-3 bg-elev-bg/50">
                <p className="text-xs text-sec-text uppercase">New amount</p>
                <p className="text-xl font-bold text-main-text">{formatBDT(data.baki?.newAmount || 0)}</p>
              </div>
              <div className="card p-3 bg-elev-bg/50">
                <p className="text-xs text-sec-text uppercase">Outstanding (all time)</p>
                <p className="text-xl font-bold text-warning">{formatBDT(data.baki?.outstanding || 0)}</p>
              </div>
              <div className="card p-3 bg-elev-bg/50">
                <p className="text-xs text-sec-text uppercase">Cleared (all time)</p>
                <p className="text-xl font-bold text-success">{formatBDT(data.baki?.clearedAmount || 0)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2"><Award className="w-4 h-4 text-neon-blue" /> Top selling (last 30 days)</h2>
              {topProducts.length === 0 ? (
                <p className="text-sm text-sec-text text-center py-8">No sales data yet.</p>
              ) : (
                <div className="space-y-2">
                  {topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3 p-3 bg-elev-bg rounded-lg">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-neon-green text-black' : i < 3 ? 'bg-neon-blue/20 text-neon-blue' : 'bg-elev-bg text-muted-text border border-border'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-main-text truncate">{p.brand} {p.name}</p>
                        <p className="text-[10px] text-muted-text">{p.count} sold \u00B7 profit {formatBDT(p.profit)}</p>
                      </div>
                      <p className="font-semibold text-neon-green text-sm shrink-0">{formatBDT(p.revenue)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-main-text mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Low stock</h2>
              {lowStock.length === 0 ? (
                <p className="text-sm text-success text-center py-8">All healthy \u2713</p>
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
        </div>
      ) : (
        <div className="card p-12 text-center text-sec-text">No data.</div>
      )}
    </AdminLayout>
  )
}

function StatRow({ label, value, prev, isCurrency, invertColors, highlight }) {
  const p = pctChange(typeof value === 'number' ? value : (isCurrency ? Number(String(value).replace(/[^\d.]/g, '')) : 0), prev == null ? null : (isCurrency ? Number(String(prev).replace(/[^\d.]/g, '')) : prev))
  let color = 'text-main-text'
  if (p != null) {
    if (invertColors) color = p > 0 ? 'text-danger' : p < 0 ? 'text-success' : 'text-muted-text'
    else if (p > 0) color = highlight ? 'text-neon-green' : 'text-success'
    else if (p < 0) color = 'text-danger'
  }
  return (
    <div className="card p-3 bg-elev-bg/50">
      <p className="text-xs text-sec-text uppercase tracking-wider">{label}</p>
      <p className={`text-xl font-bold mt-1 ${highlight ? 'text-neon-green' : 'text-main-text'}`}>{value}</p>
      {p != null && (
        <p className={`text-xs mt-1 flex items-center gap-1 ${color}`}>
          {p > 0 ? <TrendingUp className="w-3 h-3" /> : p < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {p > 0 ? '+' : ''}{p.toFixed(1)}% vs prev
        </p>
      )}
    </div>
  )
}
