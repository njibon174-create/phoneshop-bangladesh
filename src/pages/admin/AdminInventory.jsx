import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Save, X, Package, AlertTriangle, Search } from 'lucide-react'

function formatBDT(n) {
  return '৳' + Number(n || 0).toLocaleString('en-IN')
}

export function AdminInventory() {
  const [phones, setPhones] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ brand: '', model: '', imei: '', buy_price: 0, mrp: 0, status: 'in_stock', product_id: '' })
  const [adjusting, setAdjusting] = useState(null)
  const [adjustQty, setAdjustQty] = useState(0)
  const [msg, setMsg] = useState(null)

  async function load() {
    setLoading(true)
    const [phonesData, productsData] = await Promise.all([
      supabase.from('phones').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, brand_name, price_bdt, stock_count, is_active').eq('is_active', true).order('name'),
    ])
    setPhones(phonesData.data || [])
    setProducts(productsData.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = phones.filter((p) => {
    if (search && !`${p.brand} ${p.model} ${p.imei || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  function startEdit(p) {
    setEditing(p.id)
    setForm({ brand: p.brand, model: p.model, imei: p.imei || '', buy_price: p.buy_price, mrp: p.mrp, status: p.status, product_id: p.product_id || '' })
    setCreating(false)
    setMsg(null)
  }

  function startCreate() {
    setCreating(true)
    setEditing(null)
    setForm({ brand: '', model: '', imei: '', buy_price: 0, mrp: 0, status: 'in_stock', product_id: '' })
    setMsg(null)
  }

  function cancel() {
    setEditing(null)
    setCreating(false)
  }

  async function save() {
    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      imei: form.imei.trim() || null,
      buy_price: Number(form.buy_price) || 0,
      mrp: Number(form.mrp) || 0,
      status: form.status,
      product_id: form.product_id || null,
    }
    if (!payload.brand || !payload.model) return setMsg({ type: 'error', text: 'Brand and model are required' })

    let err, savedId
    if (creating) {
      const r = await supabase.from('phones').insert(payload).select().single()
      err = r.error; savedId = r.data?.id
    } else {
      const r = await supabase.from('phones').update(payload).eq('id', editing).select().single()
      err = r.error; savedId = r.data?.id
    }
    if (err) return setMsg({ type: 'error', text: err.message })

    // If linked to product, sync storefront inventory count
    if (payload.product_id) {
      await supabase.rpc('sync_inventory_from_phones', { p_product_id: payload.product_id }).then(() => {})
      // Fallback: just count in_stock rows for that product
      const { data: phonesForProduct } = await supabase
        .from('phones')
        .select('id')
        .eq('product_id', payload.product_id)
        .eq('status', 'in_stock')
      const count = (phonesForProduct || []).length
      await supabase.from('inventory').upsert({
        product_id: payload.product_id,
        stock_count: count,
        low_stock_at: 5,
      }, { onConflict: 'product_id' })
    }

    cancel()
    load()
    setMsg({ type: 'success', text: 'Saved!' })
  }

  async function quickStatus(p, newStatus) {
    await supabase.from('phones').update({ status: newStatus }).eq('id', p.id)
    load()
  }

  async function adjustStock() {
    if (!adjusting) return
    await supabase.rpc('increment_inventory_stock', { p_product_id: adjusting.product_id, p_delta: adjustQty }).then(() => {})
    // Fallback direct
    const { data: cur } = await supabase.from('inventory').select('stock_count').eq('product_id', adjusting.product_id).maybeSingle()
    const newCount = Math.max(0, Number(cur?.stock_count || 0) + Number(adjustQty))
    await supabase.from('inventory').upsert({
      product_id: adjusting.product_id,
      stock_count: newCount,
      low_stock_at: 5,
    }, { onConflict: 'product_id' })
    setAdjusting(null)
    setAdjustQty(0)
    load()
  }

  return (
    <AdminLayout title="Inventory" subtitle="PhoneLedger-style stock tracking — each phone unit has its own row" actions={
      !creating && !editing && (
        <button onClick={startCreate} className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Add Phone Unit
        </button>
      )
    }>
      {msg && (
        <div className={`card p-3 mb-4 text-sm ${msg.type === 'error' ? 'text-danger' : 'text-success'}`}>{msg.text}</div>
      )}

      {/* Quick stock adjuster per product (storefront stock count) */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-main-text mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-neon-green" />
          Storefront stock levels
        </h2>
        <p className="text-xs text-sec-text mb-3">
          Adjust storefront inventory count for any product. Use this to add/remove stock without tracking IMEIs.
        </p>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {products.slice(0, 30).map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-elev-bg rounded-lg">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-main-text truncate">{p.brand_name} {p.name}</p>
                <p className="text-[10px] text-muted-text">{formatBDT(p.price_bdt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className={`badge text-xs ${
                  p.stock_count === 0 ? 'bg-error/20 text-error' :
                  p.stock_count <= 5 ? 'bg-warning/20 text-warning' :
                  'bg-success/20 text-success'
                }`}>{p.stock_count}</span>
                <button onClick={() => { setAdjusting(p); setAdjustQty(1) }} className="btn-secondary text-xs py-1 px-2">Adjust</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {adjusting && (
        <div className="card p-5 mb-6 border-neon-green/30">
          <h3 className="font-semibold text-main-text mb-3">Adjust stock for {adjusting.brand_name} {adjusting.name}</h3>
          <p className="text-sm text-sec-text mb-3">Current: {adjusting.stock_count}. Enter positive to add, negative to remove.</p>
          <div className="flex gap-2">
            <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(Number(e.target.value))} className="input flex-1" />
            <button onClick={adjustStock} className="btn-primary px-4 py-2 flex items-center gap-2"><Save className="w-4 h-4" /> Apply</button>
            <button onClick={() => { setAdjusting(null); setAdjustQty(0) }} className="btn-secondary px-4 py-2"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <h2 className="text-lg font-semibold text-main-text mb-3 mt-8">Phone units (IMEI-tracked)</h2>

      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-elev-bg border border-border rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-text" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by brand, model, IMEI..." className="flex-1 bg-transparent text-sm text-main-text outline-none placeholder:text-muted-text" />
        </div>
        <div className="flex gap-1 flex-wrap">
          {[
            ['all', 'All'],
            ['in_stock', 'In stock'],
            ['sold', 'Sold'],
            ['returned', 'Returned'],
            ['defective', 'Defective'],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              className={`px-3 py-1.5 text-xs rounded-lg ${
                statusFilter === k ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' :
                'bg-elev-bg text-sec-text border border-border'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {(creating || editing) && (
        <div className="card p-5 mb-4">
          <h3 className="font-semibold text-main-text mb-3">{creating ? 'New phone unit' : 'Edit phone unit'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">Brand *</label>
              <input type="text" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">Model *</label>
              <input type="text" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">IMEI</label>
              <input type="text" value={form.imei} onChange={(e) => setForm((f) => ({ ...f, imei: e.target.value }))} className="input font-mono text-xs" placeholder="15-digit IMEI" />
            </div>
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">Buy price</label>
              <input type="number" value={form.buy_price} onChange={(e) => setForm((f) => ({ ...f, buy_price: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">MRP</label>
              <input type="number" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="input">
                <option value="in_stock">In stock</option>
                <option value="sold">Sold</option>
                <option value="returned">Returned</option>
                <option value="defective">Defective</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-sec-text mb-1.5">Linked storefront product</label>
              <select value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))} className="input">
                <option value="">— Not linked (just tracking this unit) —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.brand_name} {p.name}</option>)}
              </select>
              <p className="text-[10px] text-muted-text mt-1">
                Link to a storefront product so stock count auto-syncs.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="btn-primary text-sm py-2 px-4 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            <button onClick={cancel} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-elev-bg">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-text">
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">IMEI</th>
                <th className="px-4 py-3 text-right">Buy</th>
                <th className="px-4 py-3 text-right">MRP</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-8 text-center text-sec-text">No phone units match.</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-elev-bg/50">
                  <td className="px-4 py-3 font-medium text-main-text">{p.brand}</td>
                  <td className="px-4 py-3 text-sec-text">{p.model}</td>
                  <td className="px-4 py-3 text-muted-text font-mono text-xs">{p.imei || '—'}</td>
                  <td className="px-4 py-3 text-right text-sec-text">{formatBDT(p.buy_price)}</td>
                  <td className="px-4 py-3 text-right text-main-text font-semibold">{formatBDT(p.mrp)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={(e) => quickStatus(p, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border ${
                        p.status === 'in_stock' ? 'bg-success/10 text-success border-success/30' :
                        p.status === 'sold' ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30' :
                        p.status === 'returned' ? 'bg-warning/10 text-warning border-warning/30' :
                        'bg-error/10 text-error border-error/30'
                      }`}
                    >
                      <option value="in_stock">In stock</option>
                      <option value="sold">Sold</option>
                      <option value="returned">Returned</option>
                      <option value="defective">Defective</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(p)} className="btn-secondary p-2"><Edit2 className="w-4 h-4" /></button>
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