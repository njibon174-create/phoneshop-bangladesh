import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { Plus, Save, X, ArrowUp, ArrowDown } from 'lucide-react'

function formatBDT(n) {
  return '৳' + Number(n || 0).toLocaleString('en-IN')
}

const TX_TYPES = [
  { value: 'cash_in', label: 'Cash In', direction: 'in', desc: 'Other cash received (e.g. capital injection)' },
  { value: 'cash_out', label: 'Cash Out', direction: 'out', desc: 'Cash spent (e.g. rent, salary)' },
  { value: 'expense', label: 'Expense', direction: 'out', desc: 'Business expense' },
  { value: 'sale_cash', label: 'Sale (cash)', direction: 'in', desc: 'Auto from POS sales' },
  { value: 'sale_baki_paid', label: 'Baki Payment Received', direction: 'in', desc: 'Auto from customer payments' },
  { value: 'opening_balance', label: 'Opening Balance', direction: 'in', desc: 'Starting capital' },
]

export function AdminCashflow() {
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({
    type: 'cash_in', amount: 0, note: '', transaction_date: new Date().toISOString().slice(0, 10)
  })
  const [msg, setMsg] = useState(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('cash_transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500)
    setTxs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function save() {
    setMsg(null)
    const txType = TX_TYPES.find((t) => t.value === form.type)
    const payload = {
      type: form.type,
      direction: txType?.direction || 'in',
      amount: Number(form.amount) || 0,
      note: form.note.trim() || null,
      transaction_date: form.transaction_date,
    }
    if (payload.amount <= 0) return setMsg({ type: 'error', text: 'Amount must be positive' })
    const { error } = await supabase.from('cash_transactions').insert(payload)
    if (error) return setMsg({ type: 'error', text: error.message })
    setCreating(false)
    setForm({ type: 'cash_in', amount: 0, note: '', transaction_date: new Date().toISOString().slice(0, 10) })
    load()
    setMsg({ type: 'success', text: 'Saved!' })
  }

  async function del(id) {
    if (!confirm('Delete this cash transaction?')) return
    await supabase.from('cash_transactions').delete().eq('id', id)
    load()
  }

  const filtered = filter === 'all' ? txs : txs.filter((t) => t.direction === filter)

  const totalIn = txs.filter((t) => t.direction === 'in').reduce((s, t) => s + Number(t.amount || 0), 0)
  const totalOut = txs.filter((t) => t.direction === 'out').reduce((s, t) => s + Number(t.amount || 0), 0)
  const balance = totalIn - totalOut

  return (
    <AdminLayout title="Cash Flow" subtitle="Track cash in & out" actions={
      !creating && (
        <button onClick={() => setCreating(true)} className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      )
    }>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Total In</p><p className="text-2xl font-bold text-neon-green flex items-center gap-1"><ArrowDown className="w-4 h-4" />{formatBDT(totalIn)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Total Out</p><p className="text-2xl font-bold text-danger flex items-center gap-1"><ArrowUp className="w-4 h-4" />{formatBDT(totalOut)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Balance</p><p className={`text-2xl font-bold ${balance >= 0 ? 'text-main-text' : 'text-danger'}`}>{formatBDT(balance)}</p></div>
      </div>

      {msg && <div className={`card p-3 mb-4 text-sm ${msg.type === 'error' ? 'text-danger' : 'text-success'}`}>{msg.text}</div>}

      {creating && (
        <div className="card p-5 mb-4">
          <h3 className="font-semibold text-main-text mb-3">New transaction</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">Type *</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input">
                {TX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
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
            <button onClick={() => setCreating(false)} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      <div className="card p-4 mb-4 flex gap-1 flex-wrap">
        {[
          ['all', 'All'],
          ['in', 'In'],
          ['out', 'Out'],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 text-xs rounded-lg ${filter === k ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-elev-bg text-sec-text border border-border'}`}
          >{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-5xl mb-3">💰</p><p className="text-sec-text">No cash transactions yet.</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-elev-bg">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-text">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-elev-bg/30">
                  <td className="px-4 py-3 text-sm text-sec-text whitespace-nowrap">{new Date(t.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[10px] ${t.direction === 'in' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                      {TX_TYPES.find((x) => x.value === t.type)?.label || t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-sec-text">{t.note || '—'}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${t.direction === 'in' ? 'text-neon-green' : 'text-danger'}`}>
                    {t.direction === 'in' ? '+' : '−'}{formatBDT(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => del(t.id)} className="btn-ghost p-1.5 text-danger hover:bg-danger/10"><X className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}