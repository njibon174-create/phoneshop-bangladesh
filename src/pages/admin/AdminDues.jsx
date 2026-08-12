import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { ToastContainer, showToast } from '../../components/admin/Toast'
import { supabase } from '../../lib/supabase'
import { Plus, DollarSign, X, Save, ChevronDown, ChevronRight, Phone, Calendar, Ban } from 'lucide-react'

function formatBDT(n) {
  return '\u09F3' + Number(n || 0).toLocaleString('en-IN')
}

const STATUS_CONFIG = {
  pending: { label: 'Unpaid', bg: 'bg-warning/20 text-warning' },
  partial: { label: 'Partial', bg: 'bg-info/20 text-info' },
  cleared: { label: 'Cleared', bg: 'bg-success/20 text-success' },
  cancelled: { label: 'Cancelled', bg: 'bg-muted-text/20 text-muted-text' },
}

export function AdminDues() {
  const [credits, setCredits] = useState([])
  const [phones, setPhones] = useState({})
  const [payments, setPayments] = useState({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [paying, setPaying] = useState(null)
  const [payAmount, setPayAmount] = useState(0)
  const [payNote, setPayNote] = useState('')
  const [expanded, setExpanded] = useState({})
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', total_due: 0, notes: '' })

  async function load() {
    setLoading(true)
    const { data: creditsData } = await supabase.from('credits').select('*').order('created_at', { ascending: false })
    setCredits(creditsData || [])

    // Get linked sales
    if (creditsData?.length) {
      const saleIds = creditsData.map((c) => c.sale_id).filter(Boolean)
      if (saleIds.length) {
        const { data: salesData } = await supabase.from('sales').select('id, phone_id, sell_price, payment_type, sale_date').in('id', saleIds)
        const { data: phonesData } = await supabase.from('phones').select('id, brand, model, imei').in('id', (salesData || []).map((s) => s.phone_id).filter(Boolean))
        const phoneMap = {}
        for (const p of phonesData || []) phoneMap[p.id] = p
        setPhones(phoneMap)
      }

      // Get payments for all credits
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
    const { error } = await supabase.from('credits').insert({
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim() || null,
      total_due: Number(form.total_due),
      paid_amount: 0,
      remaining: Number(form.total_due),
      notes: form.notes.trim() || null,
      status: 'pending',
    })
    if (error) { showToast('Failed: ' + error.message, 'error'); return }
    setCreating(false)
    setForm({ customer_name: '', customer_phone: '', total_due: 0, notes: '' })
    showToast('Credit added.', 'success')
    load()
  }

  async function recordPayment() {
    if (!paying || payAmount <= 0) return
    const newPaid = Number(paying.paid_amount) + payAmount
    const newRemaining = Math.max(0, Number(paying.total_due) - newPaid)
    const newStatus = newRemaining === 0 ? 'cleared' : newPaid > 0 ? 'partial' : 'pending'
    await supabase.from('credit_payments').insert({
      credit_id: paying.id, amount: payAmount, notes: payNote.trim() || null,
    })
    await supabase.from('cash_transactions').insert({
      type: 'sale_baki_paid', direction: 'in', amount: payAmount,
      note: `Payment from ${paying.customer_name}`, reference_id: paying.id,
      transaction_date: new Date().toISOString().slice(0, 10),
    })
    await supabase.from('credits').update({
      paid_amount: newPaid, remaining: newRemaining, status: newStatus,
    }).eq('id', paying.id)
    setPaying(null); setPayAmount(0); setPayNote('')
    showToast(`Payment of ${formatBDT(payAmount)} recorded.`, 'success')
    load()
  }

  async function cancelCredit(c) {
    if (!confirm(`Cancel credit for ${c.customer_name}? This cannot be undone.`)) return
    await supabase.from('credits').update({ status: 'cancelled', remaining: 0 }).eq('id', c.id)
    showToast('Credit cancelled.', 'success')
    load()
  }

  async function remove(c) {
    if (!confirm(`Delete credit record for ${c.customer_name}? This cannot be undone.`)) return
    await supabase.from('credits').delete().eq('id', c.id)
    showToast('Credit deleted.', 'success')
    load()
  }

  const totalDue = credits.filter((c) => c.status !== 'cancelled' && c.status !== 'cleared').reduce((s, c) => s + Number(c.remaining || 0), 0)
  const totalCollected = credits.reduce((s, c) => s + Number(c.paid_amount || 0), 0)
  const pendingCount = credits.filter((c) => c.status === 'pending').length
  const partialCount = credits.filter((c) => c.status === 'partial').length
  const overdueCount = credits.filter((c) => c.remaining > 0 && c.status !== 'cancelled' && c.status !== 'cleared' && new Date(c.created_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length

  return (
    <AdminLayout title="Dues (Baki)" subtitle="Customer credits and outstanding payments" actions={
      !creating && <button onClick={() => setCreating(true)} className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4"><Plus className="w-4 h-4" /> Add Credit</button>
    }>
      <ToastContainer />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Outstanding</p><p className="text-2xl font-bold text-warning">{formatBDT(totalDue)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Collected</p><p className="text-2xl font-bold text-neon-green">{formatBDT(totalCollected)}</p></div>
        <div className="card p-4"><p className="text-xs text-sec-text uppercase">Pending / Partial</p><p className="text-2xl font-bold text-main-text">{pendingCount} / {partialCount}</p></div>
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
        <div className="card p-12 text-center"><p className="text-5xl mb-3">⏰</p><p className="text-sec-text">No credits tracked yet.</p></div>
      ) : (
        <div className="space-y-3">
          {credits.map((c) => {
            const creditPayments = payments[c.id] || []
            const isExpanded = expanded[c.id]
            return (
              <div key={c.id} className="card overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <button onClick={() => setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }))} className="text-muted-text hover:text-main-text">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-main-text">{c.customer_name}</p>
                    <p className="text-xs text-muted-text">
                      {c.customer_phone && <span className="mr-2"><Phone className="w-3 h-3 inline" /> {c.customer_phone}</span>}
                      <span><Calendar className="w-3 h-3 inline" /> {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      {c.notes && <span className="ml-2 italic">"{c.notes}"</span>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-sec-text">Total {formatBDT(c.total_due)}</p>
                    <p className="text-sm text-neon-green">Paid {formatBDT(c.paid_amount)}</p>
                    <p className="text-base font-bold text-warning">Due {formatBDT(c.remaining)}</p>
                  </div>
                  <span className={`shrink-0 badge text-[10px] ${STATUS_CONFIG[c.status]?.bg || ''}`}>{STATUS_CONFIG[c.status]?.label || c.status}</span>
                </div>

                {isExpanded && (
                  <div className="border-t border-border p-4 bg-elev-bg/30 space-y-3">
                    {creditPayments.length > 0 ? (
                      <div>
                        <p className="text-xs text-muted-text uppercase mb-2">Payment history</p>
                        <div className="space-y-1">
                          {creditPayments.map((p) => (
                            <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                              <div>
                                <p className="text-main-text font-semibold">{formatBDT(p.amount)}</p>
                                {p.notes && <p className="text-xs text-muted-text italic">"{p.notes}"</p>}
                              </div>
                              <p className="text-xs text-sec-text">{new Date(p.paid_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-text italic">No payments recorded yet.</p>
                    )}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      {c.remaining > 0 && c.status !== 'cancelled' && (
                        <button onClick={() => { setPaying(c); setPayAmount(Number(c.remaining)) }} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Record Payment</button>
                      )}
                      {c.status !== 'cancelled' && c.status !== 'cleared' && (
                        <button onClick={() => cancelCredit(c)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"><Ban className="w-3 h-3" /> Cancel Credit</button>
                      )}
                      <button onClick={() => remove(c)} className="btn-ghost p-1.5 text-danger hover:bg-danger/10"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
