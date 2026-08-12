import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { ToastContainer, showToast } from '../../components/admin/Toast'
import BarcodeScanner from '../../components/admin/BarcodeScanner'
import { SellPhoneModal } from '../../components/admin/SellPhoneModal'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Save, X, Package, Search, Camera, Trash2, ShoppingCart, LayoutGrid, List as ListIcon, ScanLine, Check, AlertCircle, ChevronDown, ChevronRight, Search as SearchIcon, Tag, DollarSign, Hash } from 'lucide-react'

function formatBDT(n) {
  return '৳' + Number(n || 0).toLocaleString('en-IN')
}

const EMPTY_FORM = {
  brand: '',
  model: '',
  variant: '',
  imei: '',
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
  const [imeiList, setImeiList] = useState([''])
  const [formError, setFormError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [selling, setSelling] = useState(null)
  const [expanded, setExpanded] = useState({})

  // === SCAN-AND-SELL FLOW ===
  // scanMode: 'find' (find existing phone) | 'add' (add new phone IMEI)
  const [scanMode, setScanMode] = useState(null)
  const [scannedImei, setScannedImei] = useState('')
  const [scannedMatch, setScannedMatch] = useState(null)
  const [scannedLoading, setScannedLoading] = useState(false)
  const [manualImeiInput, setManualImeiInput] = useState('')
  const scanInputRef = useRef(null)

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

  // Look up an IMEI in the inventory. Looks in BOTH `phones` table (the
  // inventory/IMEI ledger) and `products` table (the storefront catalog).
  const lookupImei = useCallback(async (imei) => {
    if (!imei || imei.length < 4) return
    setScannedLoading(true)
    setScannedMatch(null)
    try {
      // 1) Exact match in phones (inventory) — preferred source for sold units
      const { data: phoneRows, error: phoneErr } = await supabase
        .from('phones')
        .select('*')
        .eq('imei', imei)
        .limit(1)
      if (phoneErr) throw phoneErr
      if (phoneRows && phoneRows.length > 0) {
        setScannedMatch({ type: 'phone', data: phoneRows[0] })
        setScannedLoading(false)
        return
      }
      // 2) Fallback: match in products catalog by IMEI field (rare but possible)
      const { data: productRows, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('imei', imei)
        .limit(1)
      if (prodErr) throw prodErr
      if (productRows && productRows.length > 0) {
        setScannedMatch({ type: 'product', data: productRows[0] })
      } else {
        setScannedMatch({ type: 'none', imei })
      }
    } catch (e) {
      console.error('IMEI lookup failed:', e)
      setScannedMatch({ type: 'error', imei, error: e.message })
    }
    setScannedLoading(false)
  }, [])

  // When user closes the scanner, jump straight into the scan flow
  function openScanAndSell() {
    setScanMode('find')
    setScannedImei('')
    setScannedMatch(null)
    setManualImeiInput('')
    setShowScanner(true)
  }

  function handleScanResult(decodedText) {
    setShowScanner(false)
    const trimmed = (decodedText || '').trim()
    setScannedImei(trimmed)
    lookupImei(trimmed)
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualImeiInput.trim()) return
    setScannedImei(manualImeiInput.trim())
    lookupImei(manualImeiInput.trim())
  }

  function clearScan() {
    setScannedImei('')
    setScannedMatch(null)
    setManualImeiInput('')
  }

  // Quick-sell the scanned phone
  function sellScannedPhone() {
    if (!scannedMatch || scannedMatch.type !== 'phone') return
    // Already sold?
    if (scannedMatch.data.status === 'sold') {
      showToast('This phone is already marked as sold.', 'warn')
      return
    }
    setSelling(scannedMatch.data)
  }

  // Stats
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

  // === ADD-PHONE FLOW ===
  async function savePhone(e) {
    e.preventDefault()
    setFormError(null)
    if (!form.brand) { setFormError('Brand is required'); return }
    if (!form.model) { setFormError('Model is required'); return }
    if (!form.mrp || Number(form.mrp) <= 0) { setFormError('MRP (selling price) is required'); return }

    const payload = {
      brand: form.brand,
      model: form.model,
      variant: form.variant || 'Standard',
      imei: form.imei || null,
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
    }

    let err
    if (editingId) {
      const r = await supabase.from('phones').update(payload).eq('id', editingId)
      err = r.error
    } else {
      const r = await supabase.from('phones').insert(payload)
      err = r.error
    }
    if (err) { setFormError(err.message); return }
    setShowAddForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setMsg({ type: 'success', text: editingId ? 'Phone updated' : 'Phone added to inventory' })
    setTimeout(() => setMsg(null), 3000)
    load()
  }

  function startEdit(p) {
    setEditingId(p.id)
    setForm({
      brand: p.brand || '',
      model: p.model || '',
      variant: p.variant || '',
      imei: p.imei || '',
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
    setShowAddForm(true)
  }

  function cancelEdit() {
    setShowAddForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError(null)
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
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={openScanAndSell}
            className="bg-gradient-to-r from-neon-green to-neon-blue text-black font-semibold text-sm py-2 px-4 inline-flex items-center gap-2 rounded-lg shadow-lg hover:shadow-neon-green/30 transition-all"
          >
            <ScanLine className="w-5 h-5" />
            Scan IMEI to Sell
          </button>
          <button
            onClick={() => { setShowAddForm(!showAddForm); if (showAddForm) cancelEdit() }}
            className="btn-secondary text-sm py-2 px-3 inline-flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add Phone
          </button>
        </div>
      }
    >
      <ToastContainer />

      {/* === SCAN-AND-SELL PANEL === */}
      {(scanMode || scannedImei || scannedMatch) && (
        <div className="card p-5 mb-6 border-2 border-neon-green/30 bg-gradient-to-br from-neon-green/5 to-neon-blue/5">
          <div className="flex items-start justify-between mb-4 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center text-black">
                <ScanLine className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-main-text">Scan IMEI to Sell Locally</h2>
                <p className="text-xs text-sec-text">Find a phone in your inventory by its IMEI barcode, then sell it.</p>
              </div>
            </div>
            <button onClick={clearScan} className="btn-ghost p-1.5" aria-label="Close scan panel">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Step 1: Choose scan method */}
          {!scannedImei && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setShowScanner(true)}
                className="card-hover p-5 text-left bg-surfaceElevated border border-border hover:border-neon-green transition-colors"
              >
                <Camera className="w-7 h-7 text-neon-green mb-2" />
                <p className="font-semibold text-main-text mb-1">Scan with Camera</p>
                <p className="text-xs text-sec-text">Use your phone's camera to scan the IMEI barcode on the box.</p>
              </button>
              <form onSubmit={handleManualSubmit} className="card-hover p-5 bg-surfaceElevated border border-border hover:border-neon-blue transition-colors">
                <Hash className="w-7 h-7 text-neon-blue mb-2" />
                <p className="font-semibold text-main-text mb-1">Enter IMEI Manually</p>
                <p className="text-xs text-sec-text mb-2">Type or paste the 15-digit IMEI number.</p>
                <input
                  ref={scanInputRef}
                  type="text"
                  value={manualImeiInput}
                  onChange={(e) => setManualImeiInput(e.target.value)}
                  placeholder="e.g. 356789123456789"
                  className="input w-full text-sm font-mono"
                  inputMode="numeric"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!manualImeiInput.trim()}
                  className="btn-primary text-xs py-1.5 px-3 mt-2 w-full disabled:opacity-40"
                >
                  Find Phone
                </button>
              </form>
            </div>
          )}

          {/* Step 2: Show scanned IMEI + loading state */}
          {scannedImei && scannedLoading && (
            <div className="bg-surface border border-border rounded-xl p-5 flex items-center gap-3">
              <div className="animate-pulse w-10 h-10 bg-neon-green/20 rounded-lg" />
              <div className="flex-1">
                <p className="text-xs text-sec-text">Looking up IMEI</p>
                <p className="font-mono font-semibold text-main-text">{scannedImei}</p>
              </div>
            </div>
          )}

          {/* Step 3a: Phone found — show details + sell button */}
          {scannedMatch && scannedMatch.type === 'phone' && (
            <div className="bg-surface border-2 border-neon-green/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-5 h-5 text-neon-green" />
                <span className="text-xs font-semibold text-neon-green uppercase tracking-wider">Phone Found in Inventory</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-[10px] text-sec-text uppercase">Brand</p>
                  <p className="font-semibold text-main-text">{scannedMatch.data.brand}</p>
                </div>
                <div>
                  <p className="text-[10px] text-sec-text uppercase">Model</p>
                  <p className="font-semibold text-main-text">{scannedMatch.data.model}</p>
                </div>
                <div>
                  <p className="text-[10px] text-sec-text uppercase">Variant</p>
                  <p className="font-semibold text-main-text">{scannedMatch.data.variant || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-sec-text uppercase">Status</p>
                  <span className={`badge text-xs ${scannedMatch.data.status === 'sold' ? 'bg-error/20 text-error' : scannedMatch.data.status === 'reserved' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                    {scannedMatch.data.status === 'sold' ? 'Sold' : scannedMatch.data.status === 'reserved' ? 'Reserved' : 'In Stock'}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] text-sec-text uppercase">IMEI</p>
                  <p className="font-mono text-xs text-main-text">{scannedMatch.data.imei}</p>
                </div>
                <div>
                  <p className="text-[10px] text-sec-text uppercase">MRP</p>
                  <p className="font-semibold text-main-text">{formatBDT(scannedMatch.data.mrp)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-sec-text uppercase">Cost</p>
                  <p className="font-semibold text-main-text">{formatBDT(scannedMatch.data.buy_price || scannedMatch.data.cost_price)}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {scannedMatch.data.status === 'sold' ? (
                  <button
                    disabled
                    className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-1 opacity-50 cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" /> Already Sold
                  </button>
                ) : (
                  <button
                    onClick={sellScannedPhone}
                    className="btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" /> Sell This Phone
                  </button>
                )}
                <button onClick={clearScan} className="btn-secondary text-sm py-2 px-4">Scan Another</button>
              </div>
            </div>
          )}

          {/* Step 3b: Phone not found */}
          {scannedMatch && scannedMatch.type === 'none' && (
            <div className="bg-surface border-2 border-warning/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-warning" />
                <span className="text-xs font-semibold text-warning uppercase tracking-wider">No Phone Found</span>
              </div>
              <p className="text-sm text-sec-text mb-2">
                No phone with IMEI <span className="font-mono text-main-text">{scannedMatch.imei}</span> is in your inventory.
              </p>
              <p className="text-xs text-sec-text mb-4">
                Either this IMEI was never added to inventory, or the customer is bringing a phone you haven't logged yet.
              </p>
              <div className="flex gap-2 flex-wrap">
                <button onClick={clearScan} className="btn-primary text-sm py-2 px-4">Try Another IMEI</button>
              </div>
            </div>
          )}

          {/* Step 3c: Error */}
          {scannedMatch && scannedMatch.type === 'error' && (
            <div className="bg-surface border-2 border-error/40 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-error" />
                <span className="text-xs font-semibold text-error uppercase tracking-wider">Lookup Error</span>
              </div>
              <p className="text-sm text-sec-text mb-3">{scannedMatch.error}</p>
              <button onClick={clearScan} className="btn-secondary text-sm py-2 px-4">Try Again</button>
            </div>
          )}
        </div>
      )}

      {/* === STATS BAR === */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-xs text-sec-text uppercase mb-1">In Stock</p>
          <p className="text-2xl font-bold text-neon-green">{stats.inStock}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-sec-text uppercase mb-1">Sold</p>
          <p className="text-2xl font-bold text-main-text">{stats.sold}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-sec-text uppercase mb-1">Reserved</p>
          <p className="text-2xl font-bold text-warning">{stats.reserved}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-sec-text uppercase mb-1">Inventory Value</p>
          <p className="text-xl font-bold text-main-text">{formatBDT(stats.inventoryValue)}</p>
        </div>
      </div>

      {/* === FILTERS === */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-sec-text" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IMEI, brand, model..."
            className="input flex-1 text-sm"
          />
        </div>
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
        <div className="flex bg-surfaceElevated rounded-lg p-1">
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

      {/* === ADD/EDIT FORM === */}
      {showAddForm && (
        <form onSubmit={savePhone} className="card p-5 mb-6 space-y-4">
          <h3 className="font-bold text-main-text">{editingId ? 'Edit Phone' : 'Add Phone to Inventory'}</h3>
          {formError && <div className="bg-error/20 text-error p-3 rounded text-sm">{formError}</div>}
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
              <label className="label">IMEI</label>
              <input type="text" value={form.imei} onChange={(e) => setForm((f) => ({ ...f, imei: e.target.value }))} className="input font-mono" placeholder="15-digit IMEI" />
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
            <div>
              <label className="label">Image URL</label>
              <input type="text" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className="input" placeholder="https://..." />
            </div>
          </div>

          <details className="bg-surfaceElevated rounded-lg p-3">
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

          <div className="flex gap-2 flex-wrap">
            <button type="submit" className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-1">
              <Save className="w-4 h-4" /> {editingId ? 'Update' : 'Add Phone'}
            </button>
            <button type="button" onClick={cancelEdit} className="btn-secondary text-sm py-2 px-4">Cancel</button>
          </div>
        </form>
      )}

      {/* === INVENTORY LIST === */}
      {loading ? (
        <div className="card p-12 text-center text-sec-text">Loading inventory...</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 mx-auto text-sec-text mb-3" />
          <p className="text-sec-text mb-2">No phones match your filters</p>
          <p className="text-xs text-sec-text">Add phones to your inventory or scan an IMEI to find one.</p>
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="card p-4">
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
                <span className={`badge text-[10px] ${p.status === 'sold' ? 'bg-error/20 text-error' : p.status === 'reserved' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                  {p.status === 'sold' ? 'Sold' : p.status === 'reserved' ? 'Reserved' : 'In Stock'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <p className="text-sec-text">IMEI</p>
                  <p className="font-mono text-main-text truncate">{p.imei || '—'}</p>
                </div>
                <div>
                  <p className="text-sec-text">MRP</p>
                  <p className="font-semibold text-main-text">{formatBDT(p.mrp)}</p>
                </div>
              </div>
              <div className="flex gap-1">
                {p.status !== 'sold' && (
                  <button onClick={() => setSelling(p)} className="btn-ghost p-1.5 text-neon-green" title="Sell">
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => startEdit(p)} className="btn-ghost p-1.5" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => deletePhone(p.id)} className="btn-ghost p-1.5 text-error" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-sec-text border-b border-border">
                <th className="p-3">Brand / Model</th>
                <th className="p-3">Variant</th>
                <th className="p-3">IMEI</th>
                <th className="p-3">MRP</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-surfaceElevated/40">
                  <td className="p-3">
                    <p className="font-semibold text-main-text">{p.brand} {p.model}</p>
                  </td>
                  <td className="p-3 text-sec-text">{p.variant || '—'}</td>
                  <td className="p-3 font-mono text-xs text-main-text">{p.imei || '—'}</td>
                  <td className="p-3 font-semibold text-main-text">{formatBDT(p.mrp)}</td>
                  <td className="p-3">
                    <span className={`badge text-[10px] ${p.status === 'sold' ? 'bg-error/20 text-error' : p.status === 'reserved' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {p.status !== 'sold' && (
                        <button onClick={() => setSelling(p)} className="btn-ghost p-1.5 text-neon-green" title="Sell">
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => startEdit(p)} className="btn-ghost p-1.5"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => deletePhone(p.id)} className="btn-ghost p-1.5 text-error"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
