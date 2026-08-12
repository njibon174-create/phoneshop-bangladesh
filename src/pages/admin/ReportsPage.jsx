import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num || 0)
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

function pctChange(current, previous) {
  if (previous === null || previous === undefined) return '—'
  if (previous === 0) return current > 0 ? '+100%' : '0%'
  const change = ((current - previous) / previous) * 100
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

function getMonthRange(year, month) {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

// ─── Icons ───────────────────────────────────────────────────────────────────

function IconPhone() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </svg>
  )
}
function IconCurrency() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  )
}
function IconWallet() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
    </svg>
  )
}
function IconChart() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
    </svg>
  )
}
function IconTrendUp() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/>
    </svg>
  )
}
function IconTrendDown() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
    </svg>
  )
}
function IconArrowLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
    </svg>
  )
}
function IconArrowRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
    </svg>
  )
}
function IconDownload() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
    </svg>
  )
}
function IconBrand() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  )
}
function IconReceipt() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
    </svg>
  )
}
function IconProfit() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
    </svg>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'text-main-text', icon: Icon }) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-sec-text uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-elev-bg flex items-center justify-center text-sec-text">
            <Icon />
          </div>
        )}
      </div>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      {sub && <span className="text-xs text-muted-text">{sub}</span>}
    </div>
  )
}

// ─── Section Card ────────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon />}
        <h3 className="text-sm font-semibold text-main-text uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ─── Comparison Row ───────────────────────────────────────────────────────────

function ComparisonRow({ label, current, previous, isCurrency = true, invertColors = false }) {
  if (previous === null || previous === undefined) {
    return (
      <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
        <span className="text-sm text-sec-text">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-main-text">
            {isCurrency ? `৳${formatCurrency(current)}` : current}
          </span>
          <span className="text-xs text-muted-text">—</span>
        </div>
      </div>
    )
  }

  const change = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100
  const isPositive = current > previous
  const isNeutral = current === previous

  const arrowColor = isNeutral
    ? 'text-muted-text'
    : invertColors
      ? (isPositive ? 'text-danger' : 'text-success')
      : (isPositive ? 'text-success' : 'text-danger')

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-sec-text">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-main-text">
          {isCurrency ? `৳${formatCurrency(current)}` : current}
        </span>
        {!isNeutral && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${arrowColor}`}>
            {isPositive ? <IconTrendUp /> : <IconTrendDown />}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
        {isNeutral && <span className="text-xs text-muted-text">—</span>}
        <div className="w-16 text-right">
          <span className="text-xs text-muted-text">vs ৳{formatCurrency(previous)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main Reports Page ────────────────────────────────────────────────────────

export default function ReportsPage() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [loading, setLoading] = useState(true)
  const [currentData, setCurrentData] = useState(null)
  const [prevData, setPrevData] = useState(null)
  const [exporting, setExporting] = useState(null)
  const [exportError, setExportError] = useState(null)

  function exportExcel() {
    if (!currentData) {
      setExportError('Report data not loaded yet. Please wait for the page to finish loading.')
      return
    }
    setExportError(null)
    setExporting('xlsx')
    try {
      const XLSX = window.XLSX
      if (!XLSX) {
        throw new Error('XLSX library not loaded. Please refresh the page.')
      }

      const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`
      const generatedAt = new Date()
      const cs = currentData?.sales || {}
      const cb = currentData?.baki || {}
      const cc = currentData?.cash || {}
      const cp = currentData?.profit || {}
      const ps = prevData?.sales || {}
      const pb = prevData?.baki || {}
      const pc = prevData?.cash || {}
      const pp = prevData?.profit || {}

      const wb = XLSX.utils.book_new()

      const summaryRows = [
        ['PhoneLedger — Monthly Report'],
        [monthLabel],
        [`Generated: ${generatedAt.toLocaleString('en-GB')}`],
        [],
        ['Section', 'Metric', 'This Month', 'Prev Month', 'Change'],
        ['Sales', 'Phones Sold', cs.count || 0, ps.count || 0, pctChange(cs.count, ps.count)],
        ['Sales', 'Total Sales', cs.amount || 0, ps.amount || 0, pctChange(cs.amount, ps.amount)],
        ['Sales', 'Cash Sales', cs.cashAmount || 0, ps.cashAmount || 0, pctChange(cs.cashAmount, ps.cashAmount)],
        ['Sales', 'Baki Sales', cs.bakiAmount || 0, ps.bakiAmount || 0, pctChange(cs.bakiAmount, ps.bakiAmount)],
        ['Baki', 'New Baki Created (count)', cb.newBakiCount || 0, '', ''],
        ['Baki', 'New Baki Amount', cb.newBakiAmount || 0, '', ''],
        ['Baki', 'Baki Cleared', cb.clearedAmount || 0, pb.clearedAmount || 0, pctChange(cb.clearedAmount, pb.clearedAmount)],
        ['Baki', 'Total Outstanding', cb.outstanding || 0, '', ''],
        ['Cash', 'Investment', cc.investment || 0, pc.investment || 0, pctChange(cc.investment, pc.investment)],
        ['Cash', 'Withdrawals', cc.withdrawals || 0, pc.withdrawals || 0, pctChange(cc.withdrawals, pc.withdrawals)],
        ['Cash', 'Expenses', cc.expenses || 0, pc.expenses || 0, pctChange(cc.expenses, pc.expenses)],
        ['Cash', 'Net Cash Flow', cc.netFlow || 0, pc.netFlow || 0, pctChange(cc.netFlow, pc.netFlow)],
        ['Cash', 'Current Balance', cc.balance || 0, pc.balance || 0, pctChange(cc.balance, pc.balance)],
        ['Profit', 'Gross Profit', cp.grossProfit || 0, pp.grossProfit || 0, pctChange(cp.grossProfit, pp.grossProfit)],
        ['Profit', 'Net Profit', cp.netProfit || 0, pp.netProfit || 0, pctChange(cp.netProfit, pp.netProfit)],
      ]

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
      wsSummary['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 16 }, { wch: 12 }]
      wsSummary['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
      ]
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

      if (cs.brandBreakdown && Object.keys(cs.brandBreakdown).length > 0) {
        const brandRows = [['Brand', 'Count', 'Amount']]
        Object.entries(cs.brandBreakdown)
          .sort(([, a], [, b]) => b.amount - a.amount)
          .forEach(([brand, data]) => brandRows.push([brand, data.count, data.amount]))
        const wsBrands = XLSX.utils.aoa_to_sheet(brandRows)
        wsBrands['!cols'] = [{ wch: 16 }, { wch: 10 }, { wch: 16 }]
        XLSX.utils.book_append_sheet(wb, wsBrands, 'Brand Breakdown')
      }

      const fname = `PhoneLedger_Report_${MONTH_NAMES[selectedMonth]}_${selectedYear}.xlsx`
      XLSX.writeFile(wb, fname)
    } catch (err) {
      console.error('Excel export failed:', err)
      setExportError(`Excel export failed: ${err?.message || err}`)
    } finally {
      setExporting(null)
    }
  }

  async function fetchMonthData(year, month) {
    const { start, end } = getMonthRange(year, month)

    const { data: allSales } = await supabase
      .from('sales')
      .select('id, sell_price, payment_type, sale_date, phone:phones(buy_price, brand)')
      .order('sale_date', { ascending: false })

    const { data: allCredits } = await supabase
      .from('credits')
      .select('id, total_due, remaining, status, last_payment_date, credit_payments(amount, payment_date)')

    const { data: allTx } = await supabase
      .from('cash_transactions')
      .select('id, type, amount, transaction_date')

    function calcSales(sales) {
      if (!sales || sales.length === 0) return { count: 0, amount: 0, cashCount: 0, cashAmount: 0, bakiCount: 0, bakiAmount: 0, brandBreakdown: {} }
      const monthSales = sales.filter(s => s.sale_date >= start && s.sale_date <= end)
      const totalCount = monthSales.length
      const totalAmount = monthSales.reduce((sum, s) => sum + Number(s.sell_price || 0), 0)
      const cashSales = monthSales.filter(s => s.payment_type === 'cash')
      const bakiSales = monthSales.filter(s => s.payment_type === 'baki')
      const brandBreakdown = {}
      monthSales.forEach(s => {
        const brand = s.phone?.brand || 'Unknown'
        if (!brandBreakdown[brand]) brandBreakdown[brand] = { count: 0, amount: 0 }
        brandBreakdown[brand].count++
        brandBreakdown[brand].amount += Number(s.sell_price || 0)
      })
      return {
        count: totalCount, amount: totalAmount,
        cashCount: cashSales.length,
        cashAmount: cashSales.reduce((sum, s) => sum + Number(s.sell_price || 0), 0),
        bakiCount: bakiSales.length,
        bakiAmount: bakiSales.reduce((sum, s) => sum + Number(s.sell_price || 0), 0),
        brandBreakdown,
      }
    }

    function calcBaki(credits) {
      if (!credits) return { newBakiCount: 0, newBakiAmount: 0, clearedAmount: 0, outstanding: 0 }
      const clearedAmount = (credits || []).flatMap(c => c.credit_payments || [])
        .filter(p => p.payment_date >= start && p.payment_date <= end)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)
      const outstanding = (credits || []).filter(c => c.status !== 'cleared')
        .reduce((sum, c) => sum + Number(c.remaining || 0), 0)
      return { clearedAmount, outstanding }
    }

    function calcCash(tx) {
      if (!tx) return { investment: 0, withdrawals: 0, expenses: 0, netFlow: 0, balance: 0 }
      const monthTx = tx.filter(t => t.transaction_date >= start && t.transaction_date <= end)
      const investment = monthTx.filter(t => t.type === 'investment').reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const withdrawals = monthTx.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const expenses = monthTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const netFlow = monthTx.reduce((sum, t) => {
        if (['investment', 'sale_cash', 'credit_payment_received'].includes(t.type)) return sum + Number(t.amount || 0)
        if (['withdrawal', 'expense'].includes(t.type)) return sum - Number(t.amount || 0)
        return sum
      }, 0)
      const allCashIn = tx.filter(t => ['investment', 'sale_cash', 'credit_payment_received'].includes(t.type)).reduce((sum, t) => sum + Number(t.amount || 0), 0)
      const allCashOut = tx.filter(t => ['withdrawal', 'expense'].includes(t.type)).reduce((sum, t) => sum + Number(t.amount || 0), 0)
      return { investment, withdrawals, expenses, netFlow, balance: allCashIn - allCashOut }
    }

    function calcProfit(sales, expenses) {
      const monthSales = (sales || []).filter(s => s.sale_date >= start && s.sale_date <= end)
      const grossProfit = monthSales.reduce((sum, s) => {
        return sum + (Number(s.sell_price || 0) - Number(s.phone?.buy_price || 0))
      }, 0)
      return { grossProfit, netProfit: grossProfit - expenses, soldCount: monthSales.length }
    }

    function calcNewBaki(sales) {
      if (!sales) return 0
      return sales.filter(s => s.payment_type === 'baki' && s.sale_date >= start && s.sale_date <= end).length
    }
    function calcNewBakiAmount(sales) {
      if (!sales) return 0
      return sales.filter(s => s.payment_type === 'baki' && s.sale_date >= start && s.sale_date <= end)
        .reduce((sum, s) => sum + Number(s.sell_price || 0), 0)
    }

    const salesData = calcSales(allSales)
    const bakiData = calcBaki(allCredits)
    bakiData.newBakiCount = calcNewBaki(allSales)
    bakiData.newBakiAmount = calcNewBakiAmount(allSales)
    const cashData = calcCash(allTx)
    const profitData = calcProfit(allSales, cashData.expenses)

    return { sales: salesData, baki: bakiData, cash: cashData, profit: profitData }
  }

  async function fetchData() {
    setLoading(true)
    const curr = await fetchMonthData(selectedYear, selectedMonth)
    const prev = await fetchMonthData(
      selectedMonth === 0 ? selectedYear - 1 : selectedYear,
      selectedMonth === 0 ? 11 : selectedMonth - 1
    )
    setCurrentData(curr)
    setPrevData(prev)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [selectedYear, selectedMonth])

  function prevMonth() {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1) }
    else setSelectedMonth(m => m - 1)
  }
  function nextMonth() {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1) }
    else setSelectedMonth(m => m + 1)
  }

  const monthLabel = `${MONTH_NAMES[selectedMonth]} ${selectedYear}`

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-sec-text">Loading report…</p>
      </div>
    )
  }

  const s  = currentData?.sales   || {}
  const b  = currentData?.baki    || {}
  const c  = currentData?.cash    || {}
  const p  = currentData?.profit  || {}
  const ps = prevData?.sales      || {}
  const pb = prevData?.baki       || {}
  const pc = prevData?.cash       || {}
  const pp = prevData?.profit     || {}

  return (
    <div className="space-y-5">

      {/* Error Banner */}
      {exportError && (
        <div className="flex items-start justify-between gap-3 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-sm">
          <div>
            <p className="font-semibold text-danger">Export failed</p>
            <p className="text-xs text-danger/80 mt-0.5">{exportError}</p>
          </div>
          <button onClick={() => setExportError(null)} className="text-danger/60 hover:text-danger text-xs font-medium shrink-0">Dismiss</button>
        </div>
      )}

      {/* Month Navigator + Export */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button className="btn-secondary btn-sm" onClick={prevMonth}><IconArrowLeft /> Prev</button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-elev-bg border border-border">
            <IconCalendar />
            <span className="text-sm font-semibold text-main-text">{monthLabel}</span>
          </div>
          <button className="btn-secondary btn-sm" onClick={nextMonth}>Next <IconArrowRight /></button>
        </div>

        <button
          className="btn-primary btn-sm"
          onClick={() => {
            if (!currentData) return
            if (window.confirm(`Download Excel report for ${monthLabel}?`)) exportExcel()
          }}
          disabled={exporting !== null || !currentData}
        >
          {exporting === 'xlsx' ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <IconDownload />
              Export Excel
            </>
          )}
        </button>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Phones Sold" value={s.count || 0} sub={`${MONTH_NAMES[selectedMonth]}`}
          color="text-primary" icon={IconPhone}
        />
        <StatCard
          label="Total Revenue"
          value={`৳${formatCurrency(s.amount)}`}
          color="text-success"
          icon={IconCurrency}
        />
        <StatCard
          label="Net Profit"
          value={`৳${formatCurrency(p.netProfit)}`}
          color={p.netProfit >= 0 ? 'text-success' : 'text-danger'}
          icon={IconProfit}
        />
        <StatCard
          label="Cash Balance"
          value={`৳${formatCurrency(c.balance)}`}
          color={c.balance >= 0 ? 'text-main-text' : 'text-danger'}
          icon={IconWallet}
        />
      </div>

      {/* ── Sales ─────────────────────────────────────────────────────────── */}
      <SectionCard title="Sales Overview" icon={IconChart}>
        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-elev-bg rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-text">Cash Sales</span>
            <span className="text-base font-bold text-success">৳{formatCurrency(s.cashAmount)}</span>
            <span className="text-xs text-muted-text">{s.cashCount || 0} phones</span>
          </div>
          <div className="bg-elev-bg rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-text">Baki Sales</span>
            <span className="text-base font-bold text-warning">৳{formatCurrency(s.bakiAmount)}</span>
            <span className="text-xs text-muted-text">{s.bakiCount || 0} phones</span>
          </div>
          <div className="bg-elev-bg rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-text">vs Last Month</span>
            <span className={`text-base font-bold ${(s.amount || 0) >= (ps.amount || 0) ? 'text-success' : 'text-danger'}`}>
              {pctChange(s.amount, ps.amount)}
            </span>
            <span className="text-xs text-muted-text">total sales</span>
          </div>
          <div className="bg-elev-bg rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-text">Avg. Sale Price</span>
            <span className="text-base font-bold text-main-text">
              {s.count > 0 ? `৳${formatCurrency(Math.round(s.amount / s.count))}` : '—'}
            </span>
            <span className="text-xs text-muted-text">per phone</span>
          </div>
        </div>

        {/* Brand Breakdown */}
        {s.brandBreakdown && Object.keys(s.brandBreakdown).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <IconBrand />
              <p className="text-xs font-semibold text-sec-text uppercase tracking-wide">Brand Breakdown</p>
            </div>
            <div className="space-y-1.5">
              {Object.entries(s.brandBreakdown)
                .sort(([, a], [, b]) => b.amount - a.amount)
                .map(([brand, data]) => {
                  const pct = s.amount > 0 ? ((data.amount / s.amount) * 100).toFixed(1) : '0'
                  return (
                    <div key={brand} className="flex items-center justify-between py-2 px-3 rounded-lg bg-elev-bg">
                      <div className="flex items-center gap-3">
                        <div className="w-20 text-sm font-medium text-main-text truncate">{brand}</div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-text">{pct}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-main-text">৳{formatCurrency(data.amount)}</span>
                        <span className="text-xs text-muted-text ml-2">{data.count}pc</span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Baki ─────────────────────────────────────────────────────────── */}
      <SectionCard title="Baki & Credit" icon={IconReceipt}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-elev-bg rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-text">New Baki Created</span>
            <span className="text-lg font-bold text-warning">{b.newBakiCount || 0}</span>
            <span className="text-xs text-muted-text">৳{formatCurrency(b.newBakiAmount)}</span>
          </div>
          <div className="bg-elev-bg rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-text">Cleared This Month</span>
            <span className="text-lg font-bold text-success">৳{formatCurrency(b.clearedAmount)}</span>
            <span className="text-xs text-muted-text">payments received</span>
          </div>
          <div className="bg-elev-bg rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-text">Total Outstanding</span>
            <span className="text-lg font-bold text-danger">৳{formatCurrency(b.outstanding)}</span>
            <span className="text-xs text-muted-text">all-time unpaid</span>
          </div>
        </div>
        <ComparisonRow label="Baki Cleared (vs Last Month)" current={b.clearedAmount} previous={pb.clearedAmount} />
      </SectionCard>

      {/* ── Cash Flow ───────────────────────────────────────────────────── */}
      <SectionCard title="Cash Flow" icon={IconWallet}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="bg-elev-bg rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-text">Investment</span>
            <span className="text-base font-bold text-primary">৳{formatCurrency(c.investment)}</span>
          </div>
          <div className="bg-elev-bg rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-text">Withdrawals</span>
            <span className="text-base font-bold text-warning">৳{formatCurrency(c.withdrawals)}</span>
          </div>
          <div className="bg-elev-bg rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-text">Expenses</span>
            <span className="text-base font-bold text-danger">৳{formatCurrency(c.expenses)}</span>
          </div>
          <div className="bg-elev-bg rounded-lg p-3 flex flex-col gap-1">
            <span className="text-xs text-muted-text">Net Flow</span>
            <span className={`text-base font-bold ${c.netFlow >= 0 ? 'text-success' : 'text-danger'}`}>
              ৳{formatCurrency(c.netFlow)}
            </span>
          </div>
        </div>
        {/* Current balance bar */}
        <div className="bg-elev-bg rounded-lg p-3 flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-sec-text">Current Cash Balance</span>
          <span className={`text-xl font-bold ${c.balance >= 0 ? 'text-success' : 'text-danger'}`}>
            ৳{formatCurrency(c.balance)}
          </span>
        </div>
        <ComparisonRow label="Net Cash Flow" current={c.netFlow} previous={pc.netFlow} />
        <ComparisonRow label="Expenses" current={c.expenses} previous={pc.expenses} invertColors={true} />
      </SectionCard>

      {/* ── Profit & Loss ────────────────────────────────────────────────── */}
      <SectionCard title="Profit & Loss" icon={IconTrendUp}>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-elev-bg rounded-xl p-4 flex flex-col gap-1 border border-border">
            <span className="text-xs text-muted-text">Gross Profit</span>
            <span className={`text-xl font-bold ${p.grossProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              ৳{formatCurrency(p.grossProfit)}
            </span>
            <span className="text-xs text-muted-text">revenue − buy price</span>
          </div>
          <div className="bg-elev-bg rounded-xl p-4 flex flex-col gap-1 border border-border">
            <span className="text-xs text-muted-text">Expenses</span>
            <span className="text-xl font-bold text-danger">৳{formatCurrency(c.expenses)}</span>
            <span className="text-xs text-muted-text">this month</span>
          </div>
          <div className="bg-primary/10 rounded-xl p-4 flex flex-col gap-1 border border-primary/20">
            <span className="text-xs text-primary">Net Profit</span>
            <span className={`text-2xl font-bold ${p.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
              ৳{formatCurrency(p.netProfit)}
            </span>
            <span className="text-xs text-muted-text">gross − expenses</span>
          </div>
        </div>
        <ComparisonRow label="Net Profit" current={p.netProfit} previous={pp.netProfit} />
        <ComparisonRow label="Gross Profit" current={p.grossProfit} previous={pp.grossProfit} />
      </SectionCard>

      {/* ── vs Last Month ────────────────────────────────────────────────── */}
      <SectionCard title={`vs ${MONTH_NAMES[selectedMonth === 0 ? 11 : selectedMonth - 1]} ${selectedMonth === 0 ? selectedYear - 1 : selectedYear}`} icon={IconChart}>
        <ComparisonRow label="Total Sales Amount" current={s.amount} previous={ps.amount} />
        <ComparisonRow label="Phones Sold" current={s.count} previous={ps.count} isCurrency={false} />
        <ComparisonRow label="Cash Sales" current={s.cashAmount} previous={ps.cashAmount} />
        <ComparisonRow label="Baki Sales" current={s.bakiAmount} previous={ps.bakiAmount} />
        <ComparisonRow label="Baki Cleared" current={b.clearedAmount} previous={pb.clearedAmount} />
        <ComparisonRow label="Net Cash Flow" current={c.netFlow} previous={pc.netFlow} />
        <ComparisonRow label="Expenses" current={c.expenses} previous={pc.expenses} invertColors={true} />
        <ComparisonRow label="Net Profit" current={p.netProfit} previous={pp.netProfit} />
        <ComparisonRow label="Current Balance" current={c.balance} previous={pc.balance} />
      </SectionCard>

    </div>
  )
}
