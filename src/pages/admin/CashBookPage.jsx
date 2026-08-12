import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const TX_TYPE_CONFIG = {
  investment: {
    label: 'Investment',
    dot: 'bg-blue-400',
    bg: 'bg-[#60A5FA20] text-[#60A5FA] border-[#60A5FA50]',
    direction: 'in',
  },
  sale_cash: {
    label: 'Sale Cash',
    dot: 'bg-emerald-400',
    bg: 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]',
    direction: 'in',
  },
  credit_payment_received: {
    label: 'Baki Payment',
    dot: 'bg-teal-400',
    bg: 'bg-[#2DD4BF20] text-[#2DD4BF] border-[#2DD4BF50]',
    direction: 'in',
  },
  withdrawal: {
    label: 'Withdrawal',
    dot: 'bg-amber-400',
    bg: 'bg-[#FBBF2420] text-[#FBBF24] border-[#FBBF2450]',
    direction: 'out',
  },
  expense: {
    label: 'Expense',
    dot: 'bg-red-400',
    bg: 'bg-[#F8717120] text-[#F87171] border-[#F8717150]',
    direction: 'out',
  },
  refund: {
    label: 'Refund',
    dot: 'bg-red-400',
    bg: 'bg-[#F8717120] text-[#F87171] border-[#F8717150]',
    direction: 'out',
  },
}

const MONEY_IN_TYPES = ['investment', 'sale_cash', 'credit_payment_received']
const MONEY_OUT_TYPES = ['withdrawal', 'expense', 'refund']
const MANUAL_TYPES = ['investment', 'withdrawal', 'expense']

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function SkeletonCard() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="h-5 w-24 rounded bg-[#1E2A3A] animate-pulse" />
          <div className="h-3 w-16 rounded bg-[#1E2A3A] animate-pulse" />
        </div>
        <div className="h-5 w-16 rounded-full bg-[#1E2A3A] animate-pulse" />
      </div>
      <div className="h-6 w-20 rounded bg-[#1E2A3A] animate-pulse" />
    </div>
  )
}

function EditHistorySection({ history }) {
  const [expanded, setExpanded] = useState(false)
  if (!history || history.length === 0) return null

  return (
    <div className="border-t border-[#1E3A5F] pt-2">
      <button
        className="flex items-center justify-between w-full text-xs text-[#9CA3AF] hover:text-[#60A5FA] transition-colors py-1"
        onClick={() => setExpanded(v => !v)}
      >
        <span className="inline-flex items-center gap-1">
          <span className="text-[#60A5FA]">●</span>
          {history.length} edit{history.length !== 1 ? 's' : ''} made
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {history.map(h => (
            <div key={h.id} className="flex items-center justify-between rounded-lg bg-[#1E2A3A] border border-[#1E3A5F] px-3 py-2">
              <div>
                {h.old_amount !== h.new_amount && (
                  <p className="text-sm text-[#E5E7EB]">
                    ৳{formatCurrency(h.old_amount)} → <span className="font-medium text-[#E5E7EB]">৳{formatCurrency(h.new_amount)}</span>
                  </p>
                )}
                {h.old_note !== h.new_note && (
                  <p className="text-xs text-[#9CA3AF]">
                    {h.old_note || '—'} → <span className="text-[#9CA3AF]">{h.new_note || '—'}</span>
                  </p>
                )}
                {h.old_amount === h.new_amount && h.old_note === h.new_note && (
                  <p className="text-xs text-[#9CA3AF] italic">No visible changes</p>
                )}
              </div>
              <p className="text-xs text-[#9CA3AF] whitespace-nowrap ml-3">{formatDateTime(h.edited_at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TransactionCard({ tx, onEdit, editHistory }) {
  const cfg = TX_TYPE_CONFIG[tx.type] || { label: tx.type, dot: 'bg-slate-400', bg: 'bg-[#1E2A3A] text-[#9CA3AF] border-[#1E3A5F]', direction: 'out' }
  const isIn = cfg.direction === 'in'
  const canEdit = MANUAL_TYPES.includes(tx.type)
  const history = editHistory[tx.id] || []

  return (
    <div className="card p-4 flex flex-col gap-3 border border-[#1E3A5F] hover:border-[#39FF8850] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              className="btn btn-sm text-[#9CA3AF] border border-[#1E3A5F] hover:border-[#60A5FA50]"
              onClick={() => onEdit(tx)}
              title="Edit"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Edit
            </button>
          )}
          <p className={`text-lg font-bold ${isIn ? 'text-[#39FF88]' : 'text-[#F87171]'}`}>
            {isIn ? '+' : '−'}৳{formatCurrency(tx.amount)}
          </p>
        </div>
      </div>

      {/* Note */}
      {tx.note && (
        <p className="text-sm text-[#9CA3AF]">{tx.note}</p>
      )}

      {/* Footer: Date + Edit history */}
      <div className="flex items-center justify-between pt-1 mt-auto">
        <p className="text-xs text-[#9CA3AF]">{formatDate(tx.transaction_date)}</p>
        {history.length > 0 && (
          <EditHistorySection history={history} />
        )}
      </div>
    </div>
  )
}

function TransactionForm({ tx, onSuccess, onCancel }) {
  const isEdit = !!tx
  const [txType, setTxType] = useState(tx?.type || 'investment')
  const [amount, setAmount] = useState(tx ? String(tx.amount) : '')
  const [note, setNote] = useState(tx?.note || '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const TYPES = [
    { value: 'investment', label: 'Investment', hint: 'Money put into the business' },
    { value: 'withdrawal', label: 'Withdrawal', hint: 'Money taken out for personal use' },
    { value: 'expense', label: 'Expense', hint: 'Business expense (rent, bills, etc.)' },
  ]

  function validate() {
    const errs = {}
    const amt = Number(amount)
    if (!amount || amt <= 0) errs.amount = 'Amount must be greater than 0'
    if (txType === 'expense' && !note.trim()) errs.note = 'Note is required for expenses'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const payload = {
      type: txType,
      amount: Number(amount),
      note: note.trim() || null,
    }

    let error
    if (isEdit) {
      // Log edit before updating
      await supabase.from('cash_transaction_edits').insert({
        transaction_id: tx.id,
        old_amount: tx.amount,
        new_amount: Number(amount),
        old_note: tx.note || null,
        new_note: note.trim() || null,
      })

      const { error: err } = await supabase
        .from('cash_transactions')
        .update(payload)
        .eq('id', tx.id)
      error = err
    } else {
      const today = new Date().toISOString().split('T')[0]
      const { error: err } = await supabase.from('cash_transactions').insert({
        ...payload,
        transaction_date: today,
      })
      error = err
    }

    setLoading(false)
    if (error) {
      setErrors({ _form: error.message })
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors._form && (
        <div className="px-4 py-3 rounded-lg bg-[#F8717120] border border-[#F8717150] text-sm text-[#F87171]">
          {errors._form}
        </div>
      )}

      {/* Type selector */}
      <div>
        <label className="label">Transaction Type</label>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                txType === t.value
                  ? t.value === 'investment'
                    ? 'bg-[#60A5FA20] border-[#60A5FA50] text-[#60A5FA]'
                    : t.value === 'withdrawal'
                      ? 'bg-[#FBBF2420] border-[#FBBF2450] text-[#FBBF24]'
                      : 'bg-[#F8717120] border-[#F8717150] text-[#F87171]'
                  : 'bg-[#1E2A3A] border-[#1E3A5F] text-[#9CA3AF] hover:border-[#60A5FA50]'
              }`}
              onClick={() => setTxType(t.value)}
              disabled={isEdit}
            >
              {t.label}
            </button>
          ))}
        </div>
        {isEdit && (
          <p className="text-xs text-[#9CA3AF] mt-1">Type cannot be changed after creation</p>
        )}
        {!isEdit && TYPES.find(t => t.value === txType) && (
          <p className="text-xs text-[#9CA3AF] mt-1">
            {TYPES.find(t => t.value === txType).hint}
          </p>
        )}
      </div>

      {/* Amount */}
      <div>
        <label className="label">Amount (৳)</label>
        <input
          type="number"
          className={`input ${errors.amount ? 'input-error' : ''}`}
          placeholder="0"
          min="0"
          step="1"
          value={amount}
          onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: '' })) }}
        />
        {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
      </div>

      {/* Note */}
      <div>
        <label className="label">
          Note {txType !== 'expense' && <span className="text-[#9CA3AF] font-normal">(optional)</span>}
        </label>
        <input
          type="text"
          className={`input ${errors.note ? 'input-error' : ''}`}
          placeholder={txType === 'investment' ? 'e.g. Initial capital' : txType === 'withdrawal' ? 'e.g. Personal withdrawal' : 'e.g. Shop rent, Electricity bill…'}
          value={note}
          onChange={e => { setNote(e.target.value); setErrors(p => ({ ...p, note: '' })) }}
        />
        {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        )}
        <button
          type="submit"
          className="btn bg-[#1E2A3A] text-[#E5E7EB] border border-[#1E3A5F] hover:border-[#60A5FA50] disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (isEdit ? 'Saving…' : 'Adding…') : isEdit ? 'Save Changes' : 'Add Transaction'}
        </button>
      </div>
    </form>
  )
}

export default function CashBookPage() {
  const [transactions, setTransactions] = useState([])
  const [editHistory, setEditHistory] = useState({}) // keyed by transaction_id
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('cash_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) console.error('CashBook fetch error:', error)
    setTransactions(data || [])

    // Fetch edit history for manual transactions
    if (data && data.length > 0) {
      const manualIds = data.filter(t => MANUAL_TYPES.includes(t.type)).map(t => t.id)
      if (manualIds.length > 0) {
        const { data: history } = await supabase
          .from('cash_transaction_edits')
          .select('*')
          .in('transaction_id', manualIds)
          .order('edited_at', { ascending: false })

        if (history) {
          const keyed = {}
          history.forEach(h => {
            if (!keyed[h.transaction_id]) keyed[h.transaction_id] = []
            keyed[h.transaction_id].push(h)
          })
          setEditHistory(keyed)
        }
      }
    }

    setLoading(false)
  }

  useEffect(() => { fetchTransactions() }, [])

  function openAddModal() {
    setEditingTx(null)
    setShowModal(true)
  }

  function openEditModal(tx) {
    setEditingTx(tx)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingTx(null)
  }

  async function handleFormSuccess() {
    closeModal()
    showToast(editingTx ? 'Transaction updated!' : 'Transaction added!')
    fetchTransactions()
  }

  const filtered = transactions.filter(tx => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q || (tx.note || '').toLowerCase().includes(q)
    const cfg = TX_TYPE_CONFIG[tx.type]
    const dir = cfg?.direction || 'out'
    if (directionFilter === 'in') return matchSearch && dir === 'in'
    if (directionFilter === 'out') return matchSearch && dir === 'out'
    return matchSearch
  })

  const totalCashIn = transactions
    .filter(t => MONEY_IN_TYPES.includes(t.type))
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const totalCashOut = transactions
    .filter(t => MONEY_OUT_TYPES.includes(t.type))
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const currentBalance = totalCashIn - totalCashOut

  const totalInvestment = transactions
    .filter(t => t.type === 'investment')
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const totalSalesCash = transactions
    .filter(t => t.type === 'sale_cash' || t.type === 'credit_payment_received')
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  const totalWithdrawalsExpenses = transactions
    .filter(t => t.type === 'withdrawal' || t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount || 0), 0)

  return (
    <div className="space-y-5">
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
        <div className="stat-card border-2 border-[#1E3A5F]">
          <span className="stat-label">Current Balance</span>
          <span className={`stat-value ${currentBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ৳{formatCurrency(currentBalance)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Investment</span>
          <span className="stat-value text-blue-400">৳{formatCurrency(totalInvestment)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Sales Cash In</span>
          <span className="stat-value text-emerald-400">৳{formatCurrency(totalSalesCash)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Withdrawn / Expenses</span>
          <span className="stat-value text-red-400">৳{formatCurrency(totalWithdrawalsExpenses)}</span>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            className="input pl-9"
            placeholder="Search notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input w-auto"
          value={directionFilter}
          onChange={e => setDirectionFilter(e.target.value)}
        >
          <option value="all">All Transactions</option>
          <option value="in">Money In</option>
          <option value="out">Money Out</option>
        </select>

        <button className="btn-primary ml-auto" onClick={openAddModal}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Add Transaction
        </button>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-[#9CA3AF]">
          {filtered.length === 0
            ? 'No transactions found'
            : `Showing ${filtered.length} of ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`
          }
        </p>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1E2A3A] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#E5E7EB]">No transactions yet</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Add investment, expenses, or withdrawals using the button above</p>
            </div>
          </div>
        )}

        {!loading && filtered.map(tx => (
          <TransactionCard
            key={tx.id}
            tx={tx}
            onEdit={openEditModal}
            editHistory={editHistory}
          />
        ))}
      </div>

      {/* Add / Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 shadow-2xl bg-[#1E2A3A]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#E5E7EB]">
                {editingTx ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <button className="btn-ghost btn-sm" onClick={closeModal}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <TransactionForm
              tx={editingTx}
              onSuccess={handleFormSuccess}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}
    </div>
  )
}
