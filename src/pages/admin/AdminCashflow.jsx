import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { ToastContainer, showToast } from '../../components/admin/Toast'
import { supabase } from '../../lib/supabase'
import React from 'react'
import { Plus, Save, X, ArrowUp, ArrowRight, Edit2, Trash2, ChevronDown, History } from 'lucide-react'

function formatBDT(n) {
  return '\u09F3' + Number(n || 0).toLocaleString('en-IN')
}

const TX_TYPES = [
  { value: 'investment', label: 'Investment', direction: 'in', hint: 'Money put into the business', manual: true },
  { value: 'withdrawal', label: 'Withdrawal', direction: 'out', hint: 'Money taken out for personal use', manual: true },
  { value: 'expense', label: 'Expense', direction: 'out', hint: 'Business expense (rent, salary, etc.)', manual: true },
  { value: 'sale_cash', label: 'Sale (Cash)', direction: 'in', hint: 'Auto-created from POS sales', manual: false },
  { value: 'sale_baki_paid', label: 'Baki Payment Received', direction: 'in', hint: 'Auto-created from customer payments', manual: false },
  { value: 'credit_payment_received', label: 'Credit Payment', direction: 'in', hint: 'Auto from credits', manual: false },
  { value: 'refund', label: 'Refund', direction: 'out', hint: 'Auto from returned sales', manual: false },
  { value: 'opening_balance', label: 'Opening Balance', direction: 'in', hint: 'Starting capital', manual: true },
  { value: 'cash_in', label: 'Other Cash In', direction: 'in', hint: 'Miscellaneous income', manual: true },
  { value: 'cash_out', label: 'Other Cash Out', direction: 'out', hint: 'Miscellaneous expense', manual: true },
]

const MANUAL_TYPES = TX_TYPES.filter((t) => t.manual).map((t) => t.value)

export function AdminCashflow() {
  const [txs, setTxs] = useState([])
  const [edits, setEdits] = useState({})  // txId -> edit history
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ type: 'investment', amount: 0, note: '', transaction_date: new Date().toISOString().slice(0, 10) })
  const [expandedHistory, setExpandedHistory] = useState({})
  const [msg, setMsg] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('cash_transactions').select('*').order('transaction_date', { ascending: false }).order('created_at', { ascending: false }).limit(500)
    setTxs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function loadHistory(txId) {
    if (edits[txId]) return // cached
    const { data } = await supabase.from('cash_transaction_edits').select('*').eq('transaction_id', txId).order('edited_at', { ascending: false })
    setEdits((e) => ({ ...e, [txId]: data || [] }))
  }

  function startEdit(t) {
    setEditing(t.id)
    setForm({ type: t.type, amount: t.amount, note: t.note || '', transaction_date: t.transaction_date })
    setMsg(null)
  }

  function startCreate() {
    setCreating(true); setEditing(null)
    setForm({ type: 'investment', amount: 0, note: '', transaction_date: new Date().toISOString().slice(0, 10) })
    setMsg(null)
  }

  function cancel() { setCreating(false); setEditing(null) }

  async function save() {
    setMsg(null)
    const txType = TX_TYPES.find((t) => t.value === form.type)
    if (form.amount <= 0) { setMsg({ type: 'error', text: 'Amount must be positive' }); return }

    if (editing) {
      // Edit existing
      const oldTx = txs.find((t) => t.id === editing)
      if (!oldTx) return
      const oldAmount = Number(oldTx.amount)
      const newAmount = Number(form.amount)
      const payload = { type: form.type, amount: newAmount, note: form.note.trim() || null, transaction_date: form.transaction_date, direction: txType?.direction || oldTx.direction }
      const { error } = await supabase.from('cash_transactions').update(payload).eq('id', editing)
      if (error) { setMsg({ type: 'error', text: error.message }); return }
      // Log the edit
      if (oldAmount !== newAmount || oldTx.type !== form.type) {
        await supabase.from('cash_transaction_edits').insert({
          transaction_id: editing, old_amount: oldAmount, new_amount: newAmount,
          reason: form.type !== oldTx.type ? `Type changed: ${oldTx.type} \u2192 ${form.type}` : 'Amount changed',
        })
      }
      showToast('Transaction updated.', 'success')
    } else {
      // Create new
      const payload = { type: form.type, direction: txType?.direction || 'in', amount: Number(form.amount), note: form.note.trim() || null, transaction_date: form.transaction_date }
      const { error } = await supabase.from('cash_transactions').insert(payload)
      if (error) { setMsg({ type: 'error', text: error.message }); return }
      showToast('Transaction added.', 'success')
    }
    cancel(); load()
  }

  async function del(id) {
    if (!confirm('Delete this transaction? This cannot be undone.')) return
    await supabase.from('cash_transactions').delete().eq('id', id)
    showToast('Transaction deleted.', 'success')
    load()
  }

  const filtered = filter === 'all' ? txs : txs.filter((t) => t.direction === filter)
  const totalIn = txs.filter((t) => t.direction === 'in').reduce((s, t) => s + Number(t.amount || 0), 0)
  const totalOut = txs.filter((t) => t.direction === 'out').reduce((s, t) => s + Number(t.amount || 0), 0)
  const balance = totalIn - totalOut
  const investment = txs.filter((t) => t.type === 'investment').reduce((s, t) => s + Number(t.amount || 0), 0)
  const withdrawal = txs.filter((t) => t.type === 'withdrawal').reduce((s, t) => s + Number(t.amount || 0), 0)
  const expenses = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
  const refunds = txs.filter((t) => t.type === 'refund').reduce((s, t) => s + Number(t.amount || 0), 0)

  return (
    <AdminLayout title="Cash Flow" subtitle="Track cash in & out, investments, expenses" actions={
      !creating && !editing && <button onClick={startCreate} className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4"><Plus className="w-4 h-4" /> Add Transaction</button>
    }>
      <ToastContainer />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Total In</p><p className="text-xl font-bold text-neon-green flex items-center gap-1"><ArrowDown className="w-4 h-4" />{formatBDT(totalIn)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Total Out</p><p className="text-xl font-bold text-danger flex items-center gap-1"><ArrowUp className="w-4 h-4" />{formatBDT(totalOut)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Balance</p><p className={`text-xl font-bold ${balance >= 0 ? 'text-main-text' : 'text-danger'}`}>{formatBDT(balance)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Invested</p><p className="text-xl font-bold text-neon-blue">{formatBDT(investment)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Withdrawn</p><p className="text-xl font-bold text-warning">{formatBDT(withdrawal)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Expenses</p><p className="text-xl font-bold text-danger">{formatBDT(expenses)}</p></div>
      </div>

      {msg && <div className={`card p-3 mb-4 text-sm ${msg.type === 'error' ? 'text-danger' : 'text-success'}`}>{msg.text}</div>}

      {(creating || editing) && (
        <div className="card p-5 mb-4">
          <h3 className="font-semibold text-main-text mb-3">{editing ? 'Edit transaction' : 'New transaction'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">Type *</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input">
                {TX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label} {t.manual ? '' : '(auto)'}</option>)}
              </select>
              <p className="text-[10px] text-muted-text mt-1">{TX_TYPES.find((t) => t.value === form.type)?.hint}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">Amount *</label>
              <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">Date *</label>
              <input type="date" value={form.transaction_date} onChange={(e) => setForm((f) => ({ ...f, transaction_date: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">Note</label>
              <input type="text" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="input" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="btn-primary text-sm py-2 px-4 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            <button onClick={cancel} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      <div className="card p-4 mb-4 flex gap-1 flex-wrap">
        {[
          ['all', 'All'],
          ['in', 'In'],
          ['out', 'Out'],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 text-xs rounded-lg ${filter === k ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-elev-bg text-sec-text border border-border'}`}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-5xl mb-3">\u{1F4B0}</p><p className="text-sec-text">No transactions match.</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-elev-bg">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-text">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => {
                const canEdit = MANUAL_TYPES.includes(t.type)
                const isExpanded = expandedHistory[t.id]
                const history = edits[t.id] || []
                return (
                  <React.Fragment key={t.id}>
                    <tr className="hover:bg-elev-bg/30">
                      <td className="px-4 py-3 text-sm text-sec-text whitespace-nowrap">{new Date(t.transaction_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-[10px] ${t.direction === 'in' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                          {TX_TYPES.find((x) => x.value === t.type)?.label || t.type}
                        </span>
                        {t.type === 'refund' && <span className="ml-1 text-[10px] text-muted-text">(auto from return)</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-sec-text max-w-xs truncate">{t.note || '-'}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${t.direction === 'in' ? 'text-neon-green' : 'text-danger'}`}>
                        {t.direction === 'in' ? '+' : '\u2212'}{formatBDT(t.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {canEdit && (
                            <>
                              <button onClick={() => startEdit(t)} className="btn-ghost p-1.5" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => del(t.id)} className="btn-ghost p-1.5 text-danger hover:bg-danger/10" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                            </>
                          )}
                          {history.length > 0 && (
                            <button onClick={() => { setExpandedHistory((e) => ({ ...e, [t.id]: !isExpanded })); loadHistory(t.id) }} className="btn-ghost p-1.5" title="Edit history">
                              <History className={`w-3.5 h-3.5 ${isExpanded ? 'text-neon-blue' : ''}`} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && history.length > 0 && (
                      <tr className="bg-elev-bg/40">
                        <td colSpan="5" className="px-4 py-3">
                          <p className="text-xs text-muted-text uppercase mb-1">Edit history</p>
                          <div className="space-y-1">
                            {history.map((h) => (
                              <div key={h.id} className="text-xs text-sec-text flex justify-between">
                                <span>{h.reason}</span>
                                <span>{h.old_amount != null && `৳${h.old_amount} \u2192 ৳${h.new_amount}`} \u00B7 {new Date(h.edited_at).toLocaleString('en-GB')}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}
