import { useEffect, useState, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { ToastContainer, showToast } from '../../components/admin/Toast'
import BarcodeScanner from '../../components/admin/BarcodeScanner'
import { SellPhoneModal } from '../../components/admin/SellPhoneModal'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Save, X, Package, Search, Camera, Trash2, ShoppingCart, LayoutGrid, List as ListIcon } from 'lucide-react'

function formatBDT(n) {
  return '\u09F3' + Number(n || 0).toLocaleString('en-IN')
}

export function AdminInventory() {
  const [phones, setPhones] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [viewMode, setViewMode] = useState('cards')
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [selling, setSelling] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [adjusting, setAdjusting] = useState(null)
  const [adjustQty, setAdjustQty] = useState(0)
  const [form, setForm] = useState({ brand: '', model: '', imei: '', buy_price: 0, mrp: 0, status: 'in_stock', product_id: '' })
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

  const brands = [...new Set(phones.map((p) => p.brand).filter(Boolean))].sort()

  const filtered = phones.filter((p) => {
    if (search) {
      const q = search.trim().toLowerCase()
      if (!`${p.brand} ${p.model} ${p.imei || ''}`.toLowerCase().includes(q)) return false
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (brandFilter !== 'all' && p.brand !== brandFilter) return false
    return true
  })

  function startEdit(p) {
    setEditing(p.id)
    setForm({ brand: p.brand, model: p.model, imei: p.imei || '', buy_price: p.buy_price, mrp: p.mrp, status: p.status, product_id: p.product_id || '' })
    setCreating(false); setMsg(null)
  }

  function startCreate() {
    setCreating(true); setEditing(null)
    setForm({ brand: '', model: '', imei: '', buy_price: 0, mrp: 0, status: 'in_stock', product_id: '' })
    setMsg(null)
  }
  function cancel() { setEditing(null); setCreating(false) }

  function handleScanResult(code) {
    setShowScanner(false)
    const cleaned = (code || '').replace(/\D/g, '')
    if (!cleaned) { setSearch(code); return }
    const match = phones.find((p) => (p.imei || '').replace(/\D/g, '') === cleaned)
    if (match) {
      if (match.status === 'in_stock') { setSelling(match); showToast(`Found ${match.brand} ${match.model}`, 'success') }
      else if (match.status === 'sold') showToast('This phone is already sold.', 'error')
      else if (match.status === 'returned') showToast('This phone is marked returned.', 'info')
      else if (match.status === 'defective') showToast('This phone is marked defective.', 'error')
    } else {
      setSearch(cleaned)
      showToast(`No exact match - narrowed search to "${cleaned}".`, 'info')
    }
  }

  async function save() {
    const payload = {
      brand: form.brand.trim(), model: form.model.trim(),
      imei: form.imei.trim() || null, buy_price: Number(form.buy_price) || 0, mrp: Number(form.mrp) || 0,
      status: form.status, product_id: form.product_id || null,
    }
    if (!payload.brand || !payload.model) { setMsg({ type: 'error', text: 'Brand and model are required' }); return }
    if (payload.imei && (payload.imei.length < 14 || payload.imei.length > 16 || !/^\d+$/.test(payload.imei))) {
      setMsg({ type: 'error', text: 'IMEI must be 14-16 digits' }); return
    }
    let err, savedId
    if (creating) {
      const r = await supabase.from('phones').insert(payload).select().single()
      err = r.error; savedId = r.data?.id
    } else {
      const r = await supabase.from('phones').update(payload).eq('id', editing).select().single()
      err = r.error; savedId = r.data?.id
    }
    if (err) {
      if (err.code === '23505') setMsg({ type: 'error', text: 'This IMEI is already registered.' })
      else setMsg({ type: 'error', text: err.message }); return
    }
    if (payload.product_id) {
      const { data: phonesForProduct } = await supabase
        .from('phones').select('id').eq('product_id', payload.product_id).eq('status', 'in_stock')
      await supabase.from('inventory').upsert({
        product_id: payload.product_id, stock_count: (phonesForProduct || []).length, low_stock_at: 5,
      }, { onConflict: 'product_id' })
    }
    cancel(); load(); showToast(creating ? 'Phone added.' : 'Phone updated.', 'success')
  }

  async function del(p) {
    if (!confirm(`Delete ${p.brand} ${p.model}?`)) return
    const { error } = await supabase.from('phones').delete().eq('id', p.id)
    if (error) showToast('Delete failed: ' + error.message, 'error')
    else { showToast('Phone deleted.', 'success'); load() }
  }

  async function quickStatus(p, newStatus) {
    await supabase.from('phones').update({ status: newStatus }).eq('id', p.id)
    showToast(`Status: ${newStatus.replace('_', ' ')}`, 'success'); load()
  }

  async function adjustStock() {
    if (!adjusting) return
    const { data: cur } = await supabase.from('inventory').select('stock_count').eq('product_id', adjusting.product_id).maybeSingle()
    const newCount = Math.max(0, Number(cur?.stock_count || 0) + Number(adjustQty))
    await supabase.from('inventory').upsert({
      product_id: adjusting.product_id, stock_count: newCount, low_stock_at: 5,
    }, { onConflict: 'product_id' })
    setAdjusting(null); setAdjustQty(0); showToast(`Stock: ${newCount}`, 'success'); load()
  }

  function handleSellSuccess() { setSelling(null); showToast('Sale completed!', 'success'); load() }

  return (
    <AdminLayout title="Inventory" subtitle="PhoneLedger-style IMEI-tracked stock" actions={
      <div className="flex gap-2">
        <button onClick={() => setShowScanner(true)} className="btn-secondary text-sm py-2 px-3 inline-flex items-center gap-1"><Camera className="w-4 h-4" /> Scan</button>
        {!creating && !editing && <button onClick={startCreate} className="btn-primary text-sm py-2 px-3 inline-flex items-center gap-1"><Plus className="w-4 h-4" /> Add Phone</button>}
      </div>
    }>
      <ToastContainer />
      {msg && <div className={`card p-3 mb-4 text-sm ${msg.type === 'error' ? 'text-danger' : 'text-success'}`}>{msg.text}</div>}

      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-main-text mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-neon-green" /> Storefront stock (quick adjust)</h2>
        <p className="text-xs text-sec-text mb-3">For quick adjustments when you don't need full IMEI tracking.</p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {products.slice(0, 30).map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-elev-bg rounded-lg">
              <div className="min-w-0">
                <p className="text-sm text-main-text truncate">{p.brand_name} {p.name}</p>
                <p className="text-[10px] text-muted-text">{formatBDT(p.price_bdt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <span className={`badge text-xs ${p.stock_count === 0 ? 'bg-error/20 text-error' : p.stock_count <= 5 ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>{p.stock_count}</span>
                <button onClick={() => { setAdjusting(p); setAdjustQty(1) }} className="btn-secondary text-xs py-1 px-2">Adjust</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {adjusting && (
        <div className="card p-5 mb-6 border-neon-green/30">
          <h3 className="font-semibold text-main-text mb-3">Adjust stock for {adjusting.brand_name} {adjusting.name}</h3>
          <p className="text-sm text-sec-text mb-3">Current: {adjusting.stock_count}. Positive = add, negative = remove.</p>
          <div className="flex gap-2">
            <input type="number" value={adjustQty} onChange={(e) => setAdjustQty(Number(e.target.value))} className="input flex-1" />
            <button onClick={adjustStock} className="btn-primary px-4 py-2 flex items-center gap-2"><Save className="w-4 h-4" /> Apply</button>
            <button onClick={() => { setAdjusting(null); setAdjustQty(0) }} className="btn-secondary px-4 py-2"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {showScanner && <BarcodeScanner onScan={handleScanResult} onClose={() => setShowScanner(false)} />}
      {selling && <SellPhoneModal phone={selling} onSuccess={handleSellSuccess} onCancel={() => setSelling(null)} />}

      <h2 className="text-lg font-semibold text-main-text mb-3 mt-8 flex items-center justify-between">
        <span>Phone units ({filtered.length})</span>
        <div className="flex gap-1">
          <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-neon-green/20 text-neon-green' : 'text-muted-text hover:text-main-text'}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-neon-green/20 text-neon-green' : 'text-muted-text hover:text-main-text'}`}><ListIcon className="w-4 h-4" /></button>
        </div>
      </h2>

      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-elev-bg border border-border rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-text" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brand, model, IMEI..." className="flex-1 bg-transparent text-sm text-main-text outline-none placeholder:text-muted-text" />
          {search && <button onClick={() => setSearch('')} className="text-xs text-muted-text hover:text-main-text">Clear</button>}
        </div>
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="input sm:w-40">
          <option value="all">All brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input sm:w-40">
          <option value="all">All status</option>
          <option value="in_stock">In stock</option>
          <option value="sold">Sold</option>
          <option value="returned">Returned</option>
          <option value="defective">Defective</option>
        </select>
      </div>

      {(creating || editing) && (
        <div className="card p-5 mb-4">
          <h3 className="font-semibold text-main-text mb-3">{creating ? 'New phone unit' : 'Edit phone unit'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">Brand *</label><input type="text" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="input" placeholder="e.g. Samsung" /></div>
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">Model *</label><input type="text" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} className="input" placeholder="e.g. Galaxy S24 Ultra" /></div>
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">IMEI</label><input type="text" value={form.imei} onChange={(e) => setForm((f) => ({ ...f, imei: e.target.value.replace(/\D/g, '') }))} className="input font-mono text-xs" placeholder="14-16 digits" maxLength="16" /></div>
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">Buy price</label><input type="number" value={form.buy_price} onChange={(e) => setForm((f) => ({ ...f, buy_price: e.target.value }))} className="input" /></div>
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">MRP</label><input type="number" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} className="input" /></div>
            <div><label className="block text-xs font-medium text-sec-text mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="input">
                <option value="in_stock">In stock</option><option value="sold">Sold</option><option value="returned">Returned</option><option value="defective">Defective</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-sec-text mb-1.5">Linked storefront product (auto-syncs stock count)</label>
              <select value={form.product_id} onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))} className="input">
                <option value="">- Not linked -</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.brand_name} {p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="btn-primary text-sm py-2 px-4 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            <button onClick={cancel} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center"><p className="text-5xl mb-3">📦</p><p className="text-sec-text">No phone units match.</p></div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-main-text truncate">{p.brand} {p.model}</p>
                  <p className="text-[10px] text-muted-text font-mono">{p.imei || '-'}</p>
                </div>
                <span className={`shrink-0 badge text-[10px] ${p.status === 'in_stock' ? 'bg-success/20 text-success' : p.status === 'sold' ? 'bg-neon-blue/20 text-neon-blue' : p.status === 'returned' ? 'bg-warning/20 text-warning' : 'bg-error/20 text-error'}`}>{p.status.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-xs mb-3">
                <span className="text-sec-text">Buy: {formatBDT(p.buy_price)}</span>
                <span className="text-main-text font-bold">MRP: {formatBDT(p.mrp)}</span>
              </div>
              <div className="flex gap-1 pt-2 border-t border-border">
                {p.status === 'in_stock' && (
                  <button onClick={() => setSelling(p)} className="flex-1 text-xs py-1.5 rounded bg-neon-green/20 text-neon-green hover:bg-neon-green/30 flex items-center justify-center gap-1"><ShoppingCart className="w-3 h-3" /> Sell</button>
                )}
                <button onClick={() => startEdit(p)} className="px-2 text-xs py-1.5 rounded bg-elev-bg text-sec-text hover:text-main-text"><Edit2 className="w-3 h-3" /></button>
                <button onClick={() => del(p)} className="px-2 text-xs py-1.5 rounded bg-elev-bg text-muted-text hover:text-danger"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-elev-bg">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-text">
                <th className="px-4 py-3">Brand</th><th className="px-4 py-3">Model</th><th className="px-4 py-3">IMEI</th>
                <th className="px-4 py-3 text-right">Buy</th><th className="px-4 py-3 text-right">MRP</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-elev-bg/50">
                  <td className="px-4 py-3 font-medium text-main-text">{p.brand}</td>
                  <td className="px-4 py-3 text-sec-text">{p.model}</td>
                  <td className="px-4 py-3 text-muted-text font-mono text-xs">{p.imei || '-'}</td>
                  <td className="px-4 py-3 text-right text-sec-text">{formatBDT(p.buy_price)}</td>
                  <td className="px-4 py-3 text-right text-main-text font-semibold">{formatBDT(p.mrp)}</td>
                  <td className="px-4 py-3">
                    <select value={p.status} onChange={(e) => quickStatus(p, e.target.value)} className={`text-xs px-2 py-1 rounded border ${p.status === 'in_stock' ? 'bg-success/10 text-success border-success/30' : p.status === 'sold' ? 'bg-neon-blue/10 text-neon-blue border-neon-blue/30' : p.status === 'returned' ? 'bg-warning/10 text-warning border-warning/30' : 'bg-error/10 text-error border-error/30'}`}>
                      <option value="in_stock">In stock</option><option value="sold">Sold</option><option value="returned">Returned</option><option value="defective">Defective</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {p.status === 'in_stock' && <button onClick={() => setSelling(p)} className="px-2 text-xs py-1.5 rounded bg-neon-green/20 text-neon-green hover:bg-neon-green/30"><ShoppingCart className="w-3.5 h-3.5" /></button>}
                      <button onClick={() => startEdit(p)} className="px-2 text-xs py-1.5 rounded bg-elev-bg text-sec-text hover:text-main-text"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(p)} className="px-2 text-xs py-1.5 rounded bg-elev-bg text-muted-text hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
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
