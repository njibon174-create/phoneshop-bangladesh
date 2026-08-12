import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { Plus, DollarSign, X, Save } from 'lucide-react'

function formatBDT(n) {
  return '৳' + Number(n || 0).toLocaleString('en-IN')
}

export function AdminDues() {
  const [credits, setCredits] = useState([])
  const [payments, setPayments] = useState({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [paying, setPaying] = useState(null)
  const [payAmount, setPayAmount] = useState(0)
  const [payNote, setPayNote] = useState('')
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', total_due: 0, notes: '' })

  async function load() {
    setLoading(true)
    const { data: creditsData } = await supabase.from('credits').select('*').order('created_at', { ascending: false })
    setCredits(creditsData || [])
    if (creditsData?.length) {
      const ids = creditsData.map((c) => c.id)
      const { data: paymentsData } = await supabase.from('credit_payments').select('*').in('credit_id', ids).order('paid_at', { ascending: false })
      const grouped = {}
      for (const p of paymentsData || []) {
        (grouped[p.credit_id] = grouped[p.credit_id] || []).push(p)
      }
      setPayments(grouped)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.customer_name || form.total_due <= 0) return
    await supabase.from('credits').insert({
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim() || null,
      total_due: Number(form.total_due),
      paid_amount: 0,
      remaining: Number(form.total_due),
      notes: form.notes.trim() || null,
      status: 'pending',
    })
    setCreating(false)
    setForm({ customer_name: '', customer_phone: '', total_due: 0, notes: '' })
    load()
  }

  async function recordPayment() {
    if (!paying || payAmount <= 0) return
    const newPaid = Number(paying.paid_amount) + payAmount
    const newRemaining = Math.max(0, Number(paying.total_due) - newPaid)
    const newStatus = newRemaining === 0 ? 'cleared' : newPaid > 0 ? 'partial' : 'pending'
    await supabase.from('credit_payments').insert({
      credit_id: paying.id,
      amount: payAmount,
      notes: payNote.trim() || null,
    })
    // Record cash in
    await supabase.from('cash_transactions').insert({
      type: 'sale_baki_paid',
      direction: 'in',
      amount: payAmount,
      note: `Payment from ${paying.customer_name}`,
      reference_id: paying.id,
      transaction_date: new Date().toISOString().slice(0, 10),
    })
    await supabase.from('credits').update({
      paid_amount: newPaid,
      remaining: newRemaining,
      status: newStatus,
    }).eq('id', paying.id)
    setPaying(null)
    setPayAmount(0)
    setPayNote('')
    load()
  }

  async function remove(c) {
    if (!confirm(`Delete credit record for ${c.customer_name}? This cannot be undone.`)) return
    await supabase.from('credits').delete().eq('id', c.id)
    load()
  }

  const totalDue = credits.reduce((s, c) => s + Number(c.remaining || 0), 0)
  const totalCollected = credits.reduce((s, c) => s + Number(c.paid_amount || 0), 0)
  const pendingCount = credits.filter((c) => c.status === 'pending').length
  const overdueCount = credits.filter((c) => c.remaining > 0 && new Date(c.created_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length

  return (
    <AdminLayout title="Dues (Baki)" subtitle="Track customer credits and outstanding payments" actions={
      !creating && (
        <button onClick={() => setCreating(true)} className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Add Credit
        </button>
      )
    }>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Total outstanding</p><p className="text-2xl font-bold text-warning">{formatBDT(totalDue)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Collected</p><p className="text-2xl font-bold text-neon-green">{formatBDT(totalCollected)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Pending</p><p className="text-2xl font-bold text-main-text">{pendingCount}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Over 30 days</p><p className="text-2xl font-bold text-danger">{overdueCount}</p></div>
      </div>

      {creating && (
        <div className="card p-5 mb-4">
          <h3 className="font-semibold text-main-text mb-3">New credit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">Customer name *</label><input type="text" value={form.customer_name} onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))} className="input" /></div>
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">Phone</label><input type="text" value={form.customer_phone} onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))} className="input" /></div>
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">Total due *</label><input type="number" value={form.total_due} onChange={(e) => setForm((f) => ({ ...f, total_due: e.target.value }))} className="input" /></div>
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">Notes</label><input type="text" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={create} className="btn-primary text-sm py-2 px-4 flex items-center gap-2"><Save className="w-4 h-4" /> Create</button>
            <button onClick={() => setCreating(false)} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {paying && (
        <div className="card p-5 mb-4 border-neon-green/30">
          <h3 className="font-semibold text-main-text mb-3">Record payment from {paying.customer_name}</h3>
          <p className="text-sm text-sec-text mb-3">Outstanding: <span className="text-warning font-semibold">{formatBDT(paying.remaining)}</span></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">Amount *</label><input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} max={paying.remaining} className="input" /></div>
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">Note</label><input type="text" value={payNote} onChange={(e) => setPayNote(e.target.value)} placeholder="e.g. partial payment" className="input" /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={recordPayment} className="btn-primary text-sm py-2 px-4 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Record</button>
            <button onClick={() => setPaying(null)} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}</div>
      ) : credits.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-5xl mb-3">⏰</p><p className="text-sec-text">No credits tracked yet. Add one to start.</p></div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-elev-bg">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-text">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {credits.map((c) => (
                <tr key={c.id} className="hover:bg-elev-bg/30">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-main-text">{c.customer_name}</p>
                    {c.customer_phone && <p className="text-xs text-muted-text">{c.customer_phone}</p>}
                    {c.notes && <p className="text-[10px] text-textSubtle">{c.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-main-text">{formatBDT(c.total_due)}</td>
                  <td className="px-4 py-3 text-right text-neon-green">{formatBDT(c.paid_amount)}</td>
                  <td className="px-4 py-3 text-right font-bold text-warning">{formatBDT(c.remaining)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[10px] ${
                      c.status === 'cleared' ? 'bg-success/20 text-success' :
                      c.status === 'partial' ? 'bg-warning/20 text-warning' :
                      'bg-error/20 text-error'
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {c.remaining > 0 && (
                        <button onClick={() => { setPaying(c); setPayAmount(Number(c.remaining)) }} className="btn-primary text-xs py-1 px-2">Pay</button>
                      )}
                      <button onClick={() => remove(c)} className="btn-ghost p-1.5 text-danger hover:bg-danger/10"><X className="w-3.5 h-3.5" /></button>
                    </div>
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