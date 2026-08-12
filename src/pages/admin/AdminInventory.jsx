import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { ToastContainer, showToast } from '../../components/admin/Toast'
import BarcodeScanner from '../../components/admin/BarcodeScanner'
import { SellPhoneModal } from '../../components/admin/SellPhoneModal'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Save, X, Package, Search, Camera, Trash2, ShoppingCart, LayoutGrid, List as ListIcon, ScanLine, Check, AlertCircle, Hash, ChevronDown, ChevronRight } from 'lucide-react'

function formatBDT(n) {
  return '৳' + Number(n || 0).toLocaleString('en-IN')
}

const SPEC_FIELDS = [
  ['display', 'Display'], ['refresh_rate_hz', 'Refresh rate (Hz)'],
  ['chip', 'Processor / Chip'], ['os', 'Operating system'],
  ['ram_gb', 'RAM (GB)'], ['storage_gb', 'Storage (GB)'],
  ['rear_camera', 'Rear camera'], ['front_camera', 'Front camera'],
  ['video_4k', 'Video'], ['battery_mah', 'Battery (mAh)'],
  ['charging_w', 'Charging (W)'], ['wireless_charging_w', 'Wireless charging (W)'],
  ['weight_g', 'Weight (g)'], ['ip_rating', 'IP rating'],
  ['five_g', '5G'], ['colors', 'Colors available'],
]

const EMPTY_FORM = {
  brand: '',
  model: '',
  variant: 'Standard',
  buy_price: '',
  mrp: '',
  compare_at_price: '',
  cost_price: '',
  warranty_months: 12,
  image_url: '',
  is_featured: false,
  is_bestseller: false,
  specs: {
    display: '', refresh_rate_hz: '', chip: '', os: '',
    ram_gb: '', storage_gb: '', rear_camera: '', front_camera: '',
    video_4k: '', battery_mah: '', charging_w: '', wireless_charging_w: '',
    weight_g: '', ip_rating: '', five_g: '', colors: '',
  },
}

export function AdminInventory() {
  const [phones, setPhones] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState('cards')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  // === MULTI-IMEI ADD ===
  // One IMEI per row — lets you add 10 phones at once.
  const [imeiList, setImeiList] = useState([''])
  const [formError, setFormError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [selling, setSelling] = useState(null)
  const [expanded, setExpanded] = useState({})

  // === SCANNER ===
  // Small scan button next to the search bar opens the scanner.
  // Scanned IMEI is dropped into the search field; if a single match is found,
  // it scrolls into view and highlights the card.
  const [showScanner, setShowScanner] = useState(false)
  const searchInputRef = useRef(null)

  async function load() {
    setLoading(true)
    const [p, b] = await Promise.all([
      supabase.from('phones').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('brands').select('id, name, slug').order('name'),
    ])
    setPhones(p.data || [])
    setBrands(b.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // When a scan completes, put the IMEI in the search bar so the existing
  // search-and-filter logic brings the matching card to the top.
  function handleScanResult(decodedText) {
    setShowScanner(false)
    const trimmed = (decodedText || '').trim()
    if (!trimmed) return
    setSearch(trimmed)
    showToast(`Scanned IMEI: ${trimmed} — searching inventory…`, 'success')
    // Focus the search input so the user sees the value
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  function openScanner() {
    setShowScanner(true)
  }

  // Stats for the top stats bar
  const stats = useMemo(() => {
    const inStock = phones.filter((p) => p.status === 'in_stock').length
    const sold = phones.filter((p) => p.status === 'sold').length
    const reserved = phones.filter((p) => p.status === 'reserved').length
    const inventoryValue = phones
      .filter((p) => p.status === 'in_stock')
      .reduce((sum, p) => sum + Number(p.mrp || p.buy_price || 0), 0)
    return { inStock, sold, reserved, inventoryValue, total: phones.length }
  }, [phones])

  const filtered = phones.filter((p) => {
    if (brandFilter !== 'all' && p.brand !== brandFilter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const hay = `${p.brand} ${p.model} ${p.variant} ${p.imei}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })

  // === ADD/EDIT FLOW (with multi-IMEI) ===
  function startAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setImeiList([''])
    setShowAddForm(true)
  }

  function startEdit(p) {
    setEditingId(p.id)
    setForm({
      brand: p.brand || '',
      model: p.model || '',
      variant: p.variant || 'Standard',
      buy_price: p.buy_price ?? '',
      mrp: p.mrp ?? '',
      compare_at_price: p.compare_at_price ?? '',
      cost_price: p.cost_price ?? '',
      warranty_months: p.warranty_months ?? 12,
      image_url: p.image_url ?? '',
      is_featured: !!p.is_featured,
      is_bestseller: !!p.is_bestseller,
      specs: { ...EMPTY_FORM.specs, ...(p.specs || {}) },
    })
    setImeiList([p.imei || ''])
    setShowAddForm(true)
  }

  function cancelEdit() {
    setShowAddForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setImeiList([''])
    setFormError(null)
  }

  // Multi-IMEI helpers
  function addImeiRow() { setImeiList((arr) => [...arr, '']) }
  function removeImeiRow(i) { setImeiList((arr) => arr.filter((_, idx) => idx !== i)) }
  function setImeiValue(i, v) {
    setImeiList((arr) => arr.map((x, idx) => (idx === i ? v : x)))
  }
  function pasteImeiBulk(text) {
    // Accepts newline or comma separated IMEIs
    const lines = text.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean)
    if (lines.length === 0) return
    if (lines.length === 1) {
      setImeiValue(imeiList.length - 1, lines[0])
    } else {
      setImeiList((arr) => {
        // Replace last empty row with first value, append rest
        const newArr = [...arr]
        if (newArr[newArr.length - 1] === '') newArr.pop()
        return [...newArr, ...lines]
      })
    }
  }

  async function savePhones(e) {
    e.preventDefault()
    setFormError(null)
    if (!form.brand) { setFormError('Brand is required'); return }
    if (!form.model) { setFormError('Model is required'); return }
    if (!form.mrp || Number(form.mrp) <= 0) { setFormError('MRP (selling price) is required'); return }

    if (editingId) {
      // Single-row update — edit uses the first IMEI row
      const imei = (imeiList[0] || '').trim()
      const payload = {
        brand: form.brand,
        model: form.model,
        variant: form.variant || 'Standard',
        imei: imei || null,
        buy_price: form.buy_price ? Number(form.buy_price) : null,
        mrp: Number(form.mrp),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        warranty_months: Number(form.warranty_months) || 12,
        image_url: form.image_url || null,
        is_featured: form.is_featured,
        is_bestseller: form.is_bestseller,
        specs: form.specs,
      }
      const { error: err } = await supabase.from('phones').update(payload).eq('id', editingId)
      if (err) { setFormError(err.message); return }
      setMsg({ type: 'success', text: 'Phone updated' })
    } else {
      // Multi-row insert — one row per IMEI. Filter out empty rows.
      const rows = imeiList
        .map((imei) => ({ imei: imei.trim() }))
        .filter((r) => r.imei)
      if (rows.length === 0) {
        // Allow adding a "model-only" entry without IMEI
        rows.push({ imei: null })
      }
      const payload = rows.map((r) => ({
        brand: form.brand,
        model: form.model,
        variant: form.variant || 'Standard',
        imei: r.imei,
        buy_price: form.buy_price ? Number(form.buy_price) : null,
        mrp: Number(form.mrp),
        compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
        cost_price: form.cost_price ? Number(form.cost_price) : null,
        warranty_months: Number(form.warranty_months) || 12,
        image_url: form.image_url || null,
        is_featured: form.is_featured,
        is_bestseller: form.is_bestseller,
        specs: form.specs,
        status: 'in_stock',
      }))
      const { error: err } = await supabase.from('phones').insert(payload)
      if (err) { setFormError(err.message); return }
      setMsg({ type: 'success', text: `${payload.length} phone${payload.length > 1 ? 's' : ''} added to inventory` })
    }

    setShowAddForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setImeiList([''])
    setTimeout(() => setMsg(null), 3000)
    load()
  }

  async function deletePhone(id) {
    if (!confirm('Delete this phone from inventory?')) return
    await supabase.from('phones').delete().eq('id', id)
    load()
  }

  async function toggleBestseller(p) {
    await supabase.from('phones').update({ is_bestseller: !p.is_bestseller }).eq('id', p.id)
    load()
  }

  function handleSellSuccess() {
    setSelling(null)
    load()
  }

  return (
    <AdminLayout
      title="Inventory"
      subtitle={`${stats.total} phones tracked • ${stats.inStock} in stock • ${stats.sold} sold`}
      actions={
        <button onClick={startAdd} className="btn-primary text-sm py-2 px-3 inline-flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Phone
        </button>
      }
    >
      <ToastContainer />

      {/* === SEARCH + SCAN ROW === */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 bg-elev-bg border border-border rounded-lg px-3 py-2 flex-1">
          <Search className="w-4 h-4 text-muted-text shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by IMEI, brand, model, variant…"
            className="flex-1 bg-transparent text-sm text-main-text outline-none placeholder:text-muted-text"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-text hover:text-main-text" aria-label="Clear search">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={openScanner}
          title="Scan IMEI barcode"
          className="btn-secondary py-2 px-3 inline-flex items-center gap-1.5 border border-border"
        >
          <ScanLine className="w-4 h-4" />
          <span className="hidden sm:inline">Scan</span>
        </button>
      </div>

      {/* === STATS BAR === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="card p-3"><p className="text-[10px] text-sec-text uppercase">In Stock</p><p className="text-xl font-bold text-neon-green">{stats.inStock}</p></div>
        <div className="card p-3"><p className="text-[10px] text-sec-text uppercase">Sold</p><p className="text-xl font-bold text-main-text">{stats.sold}</p></div>
        <div className="card p-3"><p className="text-[10px] text-sec-text uppercase">Reserved</p><p className="text-xl font-bold text-warning">{stats.reserved}</p></div>
        <div className="card p-3"><p className="text-[10px] text-sec-text uppercase">Inventory Value</p><p className="text-lg font-bold text-main-text">{formatBDT(stats.inventoryValue)}</p></div>
      </div>

      {/* === FILTER ROW === */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="input text-sm">
          <option value="all">All brands</option>
          {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input text-sm">
          <option value="all">All status</option>
          <option value="in_stock">In Stock</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>
        <div className="flex bg-elev-bg rounded-lg p-1 border border-border">
          <button onClick={() => setView('cards')} className={`px-3 py-1 rounded text-xs ${view === 'cards' ? 'bg-neon-green/20 text-neon-green' : 'text-sec-text'}`}>
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('table')} className={`px-3 py-1 rounded text-xs ${view === 'table' ? 'bg-neon-green/20 text-neon-green' : 'text-sec-text'}`}>
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
          {msg.text}
        </div>
      )}

      {/* === ADD/EDIT FORM (multi-IMEI) === */}
      {showAddForm && (
        <form onSubmit={savePhones} className="card p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-bold text-main-text">{editingId ? 'Edit Phone' : 'Add Phone to Inventory'}</h3>
            {!editingId && (
              <span className="text-xs text-sec-text">Add multiple units by entering one IMEI per row below.</span>
            )}
          </div>
          {formError && <div className="bg-error/20 text-error p-3 rounded text-sm">{formError}</div>}

          {/* Shared fields for the model */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="label">Brand *</label>
              <select value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="input">
                <option value="">—</option>
                {brands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Model *</label>
              <input type="text" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} className="input" placeholder="e.g. iPhone 15 Pro Max" />
            </div>
            <div>
              <label className="label">Variant</label>
              <input type="text" value={form.variant} onChange={(e) => setForm((f) => ({ ...f, variant: e.target.value }))} className="input" placeholder="e.g. 256GB Natural Titanium" />
            </div>
            <div>
              <label className="label">Buy Price (Cost)</label>
              <input type="number" value={form.buy_price} onChange={(e) => setForm((f) => ({ ...f, buy_price: e.target.value }))} className="input" placeholder="0" />
            </div>
            <div>
              <label className="label">MRP (Selling Price) *</label>
              <input type="number" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} className="input" placeholder="0" />
            </div>
            <div>
              <label className="label">Warranty (months)</label>
              <input type="number" value={form.warranty_months} onChange={(e) => setForm((f) => ({ ...f, warranty_months: e.target.value }))} className="input" />
            </div>
            <div className="md:col-span-3">
              <label className="label">Image URL</label>
              <input type="text" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className="input" placeholder="https://..." />
            </div>
          </div>

          {/* IMEI list — multi-row for adding multiple units */}
          {!editingId && (
            <div className="bg-elev-bg rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <label className="text-sm font-semibold text-main-text flex items-center gap-1">
                  <Hash className="w-4 h-4" /> IMEI numbers (one per unit)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addImeiRow}
                    className="text-xs px-2 py-1 rounded border border-neon-green/30 bg-neon-green/10 text-neon-green hover:bg-neon-green/20"
                  >
                    + Add Row
                  </button>
                  <button
                    type="button"
                    onClick={() => pasteImeiBulk(prompt('Paste IMEIs (one per line, or comma-separated):') || '')}
                    className="text-xs px-2 py-1 rounded border border-neon-blue/30 bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20"
                  >
                    Bulk Paste
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {imeiList.map((imei, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-sec-text w-8 text-right shrink-0">#{i + 1}</span>
                    <input
                      type="text"
                      value={imei}
                      onChange={(e) => setImeiValue(i, e.target.value)}
                      placeholder="15-digit IMEI"
                      className="input text-sm font-mono flex-1"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                    {imeiList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImeiRow(i)}
                        className="btn-ghost p-1.5 text-error"
                        title="Remove row"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-text mt-2">
                {imeiList.filter((x) => x.trim()).length} IMEI{imeiList.filter((x) => x.trim()).length !== 1 ? 's' : ''} filled. Each becomes a separate inventory unit.
              </p>
            </div>
          )}

          {/* Single IMEI on edit */}
          {editingId && (
            <div className="bg-elev-bg rounded-lg p-4 border border-border">
              <label className="text-sm font-semibold text-main-text flex items-center gap-1 mb-2">
                <Hash className="w-4 h-4" /> IMEI
              </label>
              <input
                type="text"
                value={imeiList[0] || ''}
                onChange={(e) => setImeiValue(0, e.target.value)}
                placeholder="15-digit IMEI"
                className="input text-sm font-mono"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
          )}

          <details className="bg-elev-bg rounded-lg p-3 border border-border">
            <summary className="cursor-pointer text-sm font-semibold text-sec-text">Specifications (optional)</summary>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              {SPEC_FIELDS.map(([key, label]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input
                    type="text"
                    value={form.specs[key] || ''}
                    onChange={(e) => setForm((f) => ({ ...f, specs: { ...f.specs, [key]: e.target.value } }))}
                    className="input text-sm"
                  />
                </div>
              ))}
            </div>
          </details>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-sec-text cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} className="accent-neon-green" />
              Featured
            </label>
            <label className="flex items-center gap-2 text-xs text-sec-text cursor-pointer">
              <input type="checkbox" checked={form.is_bestseller} onChange={(e) => setForm((f) => ({ ...f, is_bestseller: e.target.checked }))} className="accent-neon-green" />
              Bestseller
            </label>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button type="submit" className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1">
              <Save className="w-4 h-4" />
              {editingId ? 'Update' : (imeiList.filter((x) => x.trim()).length > 1 ? `Add ${imeiList.filter((x) => x.trim()).length} Phones` : 'Add Phone')}
            </button>
            <button type="button" onClick={cancelEdit} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          </div>
        </form>
      )}

      {/* === INVENTORY LIST — CARDS === */}
      {loading ? (
        <div className="card p-12 text-center text-sec-text">Loading inventory...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-sec-text mb-3" />
          <p className="text-sec-text mb-2">
            {search ? `No phones match "${search}"` : 'No phones match your filters'}
          </p>
          <p className="text-xs text-sec-text">Try a different IMEI, or add phones to your inventory.</p>
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const isMatch = search && (p.imei === search.trim() || p.imei?.includes(search.trim()))
            return (
              <div
                key={p.id}
                className={`card p-4 transition-all hover:-translate-y-0.5 ${isMatch ? 'ring-2 ring-neon-green shadow-neon-green/20' : ''}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.model} className="w-14 h-14 rounded-lg object-cover bg-surfaceElevated" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-surfaceElevated flex items-center justify-center text-2xl">📱</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-sec-text">{p.brand}</p>
                    <p className="font-semibold text-main-text truncate">{p.model}</p>
                    <p className="text-xs text-sec-text truncate">{p.variant}</p>
                  </div>
                  <span className={`badge text-[10px] shrink-0 border ${p.status === 'sold' ? 'bg-error/20 text-error border-error/30' : p.status === 'reserved' ? 'bg-warning/20 text-warning border-warning/30' : 'bg-success/20 text-success border-success/30'}`}>
                    {p.status === 'sold' ? 'Sold' : p.status === 'reserved' ? 'Reserved' : 'In Stock'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-sec-text">IMEI</p>
                    <p className="font-mono text-main-text truncate" title={p.imei || ''}>{p.imei || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sec-text">MRP</p>
                    <p className="font-semibold text-main-text">{formatBDT(p.mrp)}</p>
                  </div>
                </div>
                {isMatch && (
                  <div className="mb-3 px-2 py-1 rounded bg-neon-green/10 text-neon-green text-xs text-center font-semibold border border-neon-green/30">
                    ✓ Scanned IMEI match
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  {p.status !== 'sold' && (
                    <button
                      onClick={() => setSelling(p)}
                      className="text-xs py-1.5 px-3 rounded border border-neon-green/40 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 inline-flex items-center gap-1"
                    >
                      <ShoppingCart className="w-3 h-3" /> Sell
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(p)}
                    className="text-xs py-1.5 px-3 rounded border border-border bg-elev-bg text-sec-text hover:text-main-text inline-flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => deletePhone(p.id)}
                    className="text-xs py-1.5 px-3 rounded border border-error/30 bg-error/10 text-error hover:bg-error/20 inline-flex items-center gap-1 ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="card p-4">
              <p className="text-xs text-sec-text mb-1">{p.brand}</p>
              <p className="font-semibold text-main-text">{p.model}</p>
              <p className="text-xs text-sec-text mb-2">{p.variant}</p>
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="font-mono text-main-text truncate">{p.imei || '—'}</span>
                <span className={`badge text-[10px] border ${p.status === 'sold' ? 'bg-error/20 text-error border-error/30' : p.status === 'reserved' ? 'bg-warning/20 text-warning border-warning/30' : 'bg-success/20 text-success border-success/30'}`}>
                  {p.status}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {p.status !== 'sold' && (
                  <button onClick={() => setSelling(p)} className="text-xs py-1.5 px-3 rounded border border-neon-green/40 bg-neon-green/10 text-neon-green hover:bg-neon-green/20 inline-flex items-center gap-1">
                    <ShoppingCart className="w-3 h-3" /> Sell
                  </button>
                )}
                <button onClick={() => startEdit(p)} className="text-xs py-1.5 px-3 rounded border border-border bg-elev-bg text-sec-text hover:text-main-text inline-flex items-center gap-1">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => deletePhone(p.id)} className="text-xs py-1.5 px-3 rounded border border-error/30 bg-error/10 text-error hover:bg-error/20 inline-flex items-center gap-1 ml-auto">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === SCANNER MODAL === */}
      {showScanner && (
        <BarcodeScanner
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
          title="Scan IMEI barcode"
        />
      )}

      {/* === SELL MODAL === */}
      {selling && (
        <SellPhoneModal
          phone={selling}
          onCancel={() => setSelling(null)}
          onSuccess={handleSellSuccess}
        />
      )}
    </AdminLayout>
  )
}
