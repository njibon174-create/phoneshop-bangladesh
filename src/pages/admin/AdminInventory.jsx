import { useEffect, useState, useCallback } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { ToastContainer, showToast } from '../../components/admin/Toast'
import BarcodeScanner from '../../components/admin/BarcodeScanner'
import SellPhoneModal from '../../components/admin/SellPhoneModal'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Save, X, Package, Search, Camera, Trash2, ShoppingCart, LayoutGrid, List as ListIcon, ScanLine, Check, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

function formatBDT(n) {
  return '\u09F3' + Number(n || 0).toLocaleString('en-IN')
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
    display: '',
    refresh_rate_hz: '',
    chip: '',
    os: '',
    ram_gb: '',
    storage_gb: '',
    rear_camera: '',
    front_camera: '',
    video_4k: '',
    battery_mah: '',
    charging_w: '',
    wireless_charging_w: '',
    weight_g: '',
    ip_rating: '',
    five_g: '',
    colors: '',
  },
}

const SPEC_FIELDS = [
  ['display', 'Display'],
  ['refresh_rate_hz', 'Refresh rate (Hz)'],
  ['chip', 'Processor / Chip'],
  ['os', 'Operating system'],
  ['ram_gb', 'RAM (GB)'],
  ['storage_gb', 'Storage (GB)'],
  ['rear_camera', 'Rear camera'],
  ['front_camera', 'Front camera'],
  ['video_4k', 'Video'],
  ['battery_mah', 'Battery (mAh)'],
  ['charging_w', 'Charging (W)'],
  ['wireless_charging_w', 'Wireless charging (W)'],
  ['weight_g', 'Weight (g)'],
  ['ip_rating', 'IP rating'],
  ['five_g', '5G'],
  ['colors', 'Colors available'],
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
  const [formError, setFormError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [imeiScannerOpen, setImeiScannerOpen] = useState(false)
  const [selling, setSelling] = useState(null)
  const [scanResult, setScanResult] = useState(null)
  const [expanded, setExpanded] = useState({})

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

  const filtered = phones.filter((p) => {
    if (brandFilter !== 'all' && p.brand !== brandFilter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      if (!((p.brand || '').toLowerCase().includes(s) ||
            (p.model || '').toLowerCase().includes(s) ||
            (p.variant || '').toLowerCase().includes(s) ||
            (p.imei || '').includes(s))) return false
    }
    return true
  })

  // Aggregate stats by (brand, model, variant) — this is what shows on storefront
  const storefrontProducts = (() => {
    const map = new Map()
    for (const p of phones) {
      const key = `${p.brand}|${p.model}|${p.variant || ''}`
      if (!map.has(key)) {
        map.set(key, {
          brand: p.brand, model: p.model, variant: p.variant || 'Standard',
          units: [], is_featured: false, is_bestseller: false, image_url: p.image_url,
          buy_price: 0, mrp: 0, cost_price: 0, compare_at_price: p.compare_at_price,
          warranty_months: p.warranty_months || 12, specs: p.specs,
        })
      }
      const agg = map.get(key)
      agg.units.push(p)
      if (p.is_featured) agg.is_featured = true
      if (p.is_bestseller) agg.is_bestseller = true
      if (!agg.image_url && p.image_url) agg.image_url = p.image_url
      if (!agg.specs || Object.keys(agg.specs).length === 0) agg.specs = p.specs
    }
    return [...map.values()].map((a) => {
      const inStock = a.units.filter((u) => u.status === 'in_stock')
      const mrp = inStock.length > 0 ? Math.max(...inStock.map((u) => u.mrp || 0)) : Math.max(...a.units.map((u) => u.mrp || 0))
      const cost = inStock.length > 0 ? Math.max(...inStock.map((u) => u.cost_price || u.buy_price || 0)) : 0
      return {
        ...a,
        in_stock: inStock.length,
        total: a.units.length,
        sold: a.units.filter((u) => u.status === 'sold').length,
        mrp, cost_price: cost,
      }
    }).sort((a, b) => (b.in_stock > 0 ? 1 : 0) - (a.in_stock > 0 ? 1 : 0) || a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model))
  })()

  // Group phones by storefront product
  const groupedPhones = (() => {
    const groups = new Map()
    for (const p of filtered) {
      const key = `${p.brand}|${p.model}|${p.variant || ''}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(p)
    }
    return [...groups.entries()]
  })()

  function openAdd() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, specs: { ...EMPTY_FORM.specs } })
    setFormError(null)
    setShowAddForm(true)
  }

  function openEdit(p) {
    setEditingId(p.id)
    setForm({
      brand: p.brand || '',
      model: p.model || '',
      variant: p.variant || '',
      imei: p.imei || '',
      buy_price: p.buy_price || '',
      mrp: p.mrp || '',
      compare_at_price: p.compare_at_price || '',
      cost_price: p.cost_price || '',
      warranty_months: p.warranty_months || 12,
      image_url: p.image_url || '',
      is_featured: !!p.is_featured,
      is_bestseller: !!p.is_bestseller,
      specs: { ...EMPTY_FORM.specs, ...(p.specs || {}) },
    })
    setFormError(null)
    setShowAddForm(true)
  }

  function closeForm() {
    setShowAddForm(false); setEditingId(null); setFormError(null)
  }

  async function save() {
    setFormError(null)
    // Validate
    if (!form.brand.trim()) { setFormError('Brand is required'); return }
    if (!form.model.trim()) { setFormError('Model is required'); return }
    if (!form.imei.trim()) { setFormError('IMEI is required — each unit must have a unique IMEI'); return }
    if (form.imei.length < 14) { setFormError('IMEI must be at least 14 digits'); return }
    if (!form.mrp || Number(form.mrp) <= 0) { setFormError('MRP (selling price) is required'); return }
    if (!form.buy_price || Number(form.buy_price) <= 0) { setFormError('Buy price is required'); return }
    if (Number(form.buy_price) > Number(form.mrp)) { setFormError('Buy price cannot exceed MRP'); return }

    // Clean specs - drop empty values
    const cleanSpecs = {}
    for (const [k, v] of Object.entries(form.specs)) {
      if (v && String(v).trim()) cleanSpecs[k] = String(v).trim()
    }

    const payload = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      variant: form.variant.trim() || 'Standard',
      imei: form.imei.trim(),
      buy_price: Number(form.buy_price),
      mrp: Number(form.mrp),
      compare_at_price: form.compare_at_price ? Number(form.compare_at_price) : null,
      cost_price: form.cost_price ? Number(form.cost_price) : Number(form.buy_price),
      warranty_months: Number(form.warranty_months) || 12,
      image_url: form.image_url.trim() || null,
      is_featured: form.is_featured,
      is_bestseller: form.is_bestseller,
      specs: cleanSpecs,
      status: 'in_stock',
      is_active: true,
    }

    if (editingId) {
      const { error } = await supabase.from('phones').update(payload).eq('id', editingId)
      if (error) {
        if (error.code === '23505') setFormError('This IMEI already exists in the system.')
        else setFormError(error.message)
        return
      }
      showToast('Phone updated.', 'success')
    } else {
      const { error } = await supabase.from('phones').insert(payload)
      if (error) {
        if (error.code === '23505') setFormError('This IMEI already exists in the system.')
        else setFormError(error.message)
        return
      }
      showToast('Phone added — it will appear on the storefront now.', 'success')
    }
    closeForm()
    load()
  }

  async function del(p) {
    if (!confirm(`Delete ${p.brand} ${p.model} (IMEI ${p.imei})? This cannot be undone.`)) return
    await supabase.from('phones').delete().eq('id', p.id)
    showToast('Phone deleted.', 'success')
    load()
  }

  async function toggleFeatured(p) {
    await supabase.from('phones').update({ is_featured: !p.is_featured }).eq('id', p.id)
    load()
  }

  async function toggleBestseller(p) {
    await supabase.from('phones').update({ is_bestseller: !p.is_bestseller }).eq('id', p.id)
    load()
  }

  function handleScanResult(code) {
    setScanResult(code)
    setShowScanner(false)
    // Check if this IMEI already exists
    const found = phones.find((p) => p.imei === code)
    if (found) {
      showToast(`IMEI found: ${found.brand} ${found.model} (${found.status})`, 'info')
    } else {
      showToast('New IMEI — fill in the form to add this phone', 'success')
      setForm((f) => ({ ...f, imei: code }))
      setShowAddForm(true)
    }
  }

  function handleSellSuccess() {
    setSelling(null)
    load()
    showToast('Phone sold successfully', 'success')
  }

  const totalUnits = phones.length
  const inStockCount = phones.filter((p) => p.status === 'in_stock').length
  const soldCount = phones.filter((p) => p.status === 'sold').length
  const storefrontProductCount = storefrontProducts.length
  const storefrontInStockCount = storefrontProducts.filter((s) => s.in_stock > 0).length
  const stockValue = phones.filter((p) => p.status === 'in_stock').reduce((sum, p) => sum + Number(p.mrp || 0), 0)
  const totalCost = phones.filter((p) => p.status === 'in_stock').reduce((sum, p) => sum + Number(p.cost_price || p.buy_price || 0), 0)
  const potentialProfit = stockValue - totalCost

  const allBrandNames = [...new Set(phones.map((p) => p.brand))].sort()

  return (
    <AdminLayout title="Inventory & Storefront" subtitle="Every phone you add here appears on the storefront automatically" actions={
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setShowScanner(true)} className="btn-secondary text-sm py-2 px-3 inline-flex items-center gap-1">
          <ScanLine className="w-4 h-4" /> Scan IMEI
        </button>
        {!showAddForm && <button onClick={openAdd} className="btn-primary text-sm py-2 px-3 inline-flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Phone
        </button>}
      </div>
    }>
      <ToastContainer />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="card p-4">
          <p className="text-xs text-sec-text uppercase">Storefront products</p>
          <p className="text-xl font-bold text-main-text">{storefrontProductCount}</p>
          <p className="text-[10px] text-muted-text">{storefrontInStockCount} in stock</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-sec-text uppercase">Total phone units</p>
          <p className="text-xl font-bold text-main-text">{totalUnits}</p>
          <p className="text-[10px] text-muted-text">{inStockCount} in stock / {soldCount} sold</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-sec-text uppercase">Stock value</p>
          <p className="text-xl font-bold text-main-text">{formatBDT(stockValue)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-sec-text uppercase">Cost basis</p>
          <p className="text-xl font-bold text-sec-text">{formatBDT(totalCost)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-sec-text uppercase">Potential profit</p>
          <p className="text-xl font-bold text-neon-green">{formatBDT(potentialProfit)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-sec-text uppercase">Unique models</p>
          <p className="text-xl font-bold text-neon-blue">{storefrontProductCount}</p>
        </div>
      </div>

      {formError && (
        <div className="card p-3 mb-4 text-danger text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {formError}
        </div>
      )}

      {showAddForm && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-main-text">
              {editingId ? 'Edit Phone' : 'Add Phone — appears on storefront immediately'}
            </h3>
            <button onClick={closeForm} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-main-text mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-neon-green" /> Identification
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="label">Brand *</label>
                  <input list="brand-list" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} className="input" placeholder="Apple, Samsung, Xiaomi..." />
                  <datalist id="brand-list">
                    {brands.map((b) => <option key={b.id} value={b.name} />)}
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Model *</label>
                    <input type="text" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} className="input" placeholder="iPhone 15 Pro Max" />
                  </div>
                  <div>
                    <label className="label">Variant / Color</label>
                    <input type="text" value={form.variant} onChange={(e) => setForm((f) => ({ ...f, variant: e.target.value }))} className="input" placeholder="Natural Titanium" />
                  </div>
                </div>
                <div>
                  <label className="label">IMEI * (unique — 14-16 digits)</label>
                  <div className="flex gap-1">
                    <input type="text" value={form.imei} onChange={(e) => setForm((f) => ({ ...f, imei: e.target.value.replace(/\D/g, '') }))} className="input font-mono text-xs flex-1" placeholder="353000001234567" maxLength="16" />
                    <button type="button" onClick={() => setImeiScannerOpen(true)} className="btn-secondary p-2 shrink-0" title="Scan IMEI barcode">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-text mt-1">Each IMEI is unique. Same model+variant with different IMEIs = multiple stock units.</p>
                </div>
                <div>
                  <label className="label">Image URL</label>
                  <input type="url" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className="input" placeholder="https://..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} className="accent-neon-green" />
                    <span>Featured</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_bestseller} onChange={(e) => setForm((f) => ({ ...f, is_bestseller: e.target.checked }))} className="accent-neon-green" />
                    <span>Bestseller</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-main-text mb-3 flex items-center gap-2">
                <span className="text-neon-green">৳</span> Pricing
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="label">Buy price (your cost) *</label>
                  <input type="number" value={form.buy_price} onChange={(e) => setForm((f) => ({ ...f, buy_price: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">MRP (selling price) *</label>
                  <input type="number" value={form.mrp} onChange={(e) => setForm((f) => ({ ...f, mrp: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Compare-at price (optional, for strikethrough)</label>
                  <input type="number" value={form.compare_at_price} onChange={(e) => setForm((f) => ({ ...f, compare_at_price: e.target.value }))} className="input" placeholder="Higher than MRP to show as deal" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label">Cost price (optional)</label>
                    <input type="number" value={form.cost_price} onChange={(e) => setForm((f) => ({ ...f, cost_price: e.target.value }))} className="input" placeholder="Defaults to buy price" />
                  </div>
                  <div>
                    <label className="label">Warranty (months)</label>
                    <input type="number" value={form.warranty_months} onChange={(e) => setForm((f) => ({ ...f, warranty_months: e.target.value }))} className="input" />
                  </div>
                </div>
                {form.mrp && form.buy_price && Number(form.mrp) > 0 && Number(form.buy_price) > 0 && (
                  <div className="card p-3 bg-elev-bg/50 text-sm">
                    <div className="flex justify-between">
                      <span className="text-sec-text">Profit per unit:</span>
                      <span className="font-semibold text-neon-green">
                        {formatBDT(Number(form.mrp) - Number(form.buy_price))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sec-text">Margin:</span>
                      <span className="font-semibold text-neon-green">
                        {(((Number(form.mrp) - Number(form.buy_price)) / Number(form.mrp)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-main-text mb-3">Specifications</h4>
            <p className="text-xs text-muted-text mb-3">Fill in what you know — these appear on the product detail page. Empty fields are hidden.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SPEC_FIELDS.map(([key, label]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type="text" value={form.specs[key] || ''} onChange={(e) => setForm((f) => ({ ...f, specs: { ...f.specs, [key]: e.target.value } }))} className="input text-sm" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button onClick={save} className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2">
              <Save className="w-4 h-4" /> {editingId ? 'Save changes' : 'Add phone to inventory + storefront'}
            </button>
            <button onClick={closeForm} className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card p-4 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brand, model, IMEI..." className="input pl-10" />
        </div>
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="input w-auto">
          <option value="all">All brands</option>
          {allBrandNames.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
          <option value="all">All status</option>
          <option value="in_stock">In stock</option>
          <option value="sold">Sold</option>
          <option value="returned">Returned</option>
          <option value="defective">Defective</option>
        </select>
        <div className="flex gap-1 ml-auto">
          <button onClick={() => setView('cards')} className={"btn-ghost p-2 " + (view === 'cards' ? 'text-neon-green' : '')} title="Cards">
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button onClick={() => setView('table')} className={"btn-ghost p-2 " + (view === 'table' ? 'text-neon-green' : '')} title="Table">
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="card p-4 animate-pulse h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-3">📦</p>
          <p className="text-sec-text mb-2">No phone units match.</p>
          <p className="text-xs text-muted-text">Click "Add Phone" to add a new unit — it will show on the storefront.</p>
        </div>
      ) : view === 'cards' ? (
        <div className="space-y-3">
          {groupedPhones.map(([key, units]) => {
            const sample = units[0]
            const inStock = units.filter((u) => u.status === 'in_stock').length
            const isExpanded = expanded[key]
            const mrp = sample.mrp || 0
            const buy = sample.buy_price || 0
            return (
              <div key={key} className="card overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <button onClick={() => setExpanded((e) => ({ ...e, [key]: !e[key] }))} className="btn-ghost p-1 shrink-0">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {sample.image_url ? (
                    <img src={sample.image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-elev-bg" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-elev-bg flex items-center justify-center text-2xl">📱</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-main-text">{sample.brand} {sample.model}</p>
                      {sample.variant && <span className="badge text-[10px] bg-elev-bg text-sec-text">{sample.variant}</span>}
                      {sample.is_featured && <span className="badge text-[10px] bg-neon-blue/20 text-neon-blue">Featured</span>}
                      {sample.is_bestseller && <span className="badge text-[10px] bg-neon-green/20 text-neon-green">Bestseller</span>}
                    </div>
                    <p className="text-xs text-sec-text">
                      {inStock > 0 ? <span className="text-success">{inStock} in stock</span> : <span className="text-danger">Out of stock</span>}
                      {' · '}
                      {units.length - inStock} sold · MRP {formatBDT(mrp)} · Buy {formatBDT(buy)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-text">Profit/unit</p>
                    <p className="text-sm font-semibold text-neon-green">{formatBDT(mrp - buy)}</p>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-elev-bg/50 text-xs text-muted-text uppercase">
                        <tr>
                          <th className="px-4 py-2 text-left">IMEI</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-right">Buy</th>
                          <th className="px-4 py-2 text-right">MRP</th>
                          <th className="px-4 py-2 text-right">Cost</th>
                          <th className="px-4 py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {units.map((u) => (
                          <tr key={u.id} className="hover:bg-elev-bg/30">
                            <td className="px-4 py-2 font-mono text-xs">{u.imei}</td>
                            <td className="px-4 py-2">
                              <span className={"badge text-[10px] " + (
                                u.status === 'in_stock' ? 'bg-success/20 text-success' :
                                u.status === 'sold' ? 'bg-elev-bg text-sec-text' :
                                u.status === 'returned' ? 'bg-warning/20 text-warning' :
                                'bg-error/20 text-error'
                              )}>{u.status}</span>
                            </td>
                            <td className="px-4 py-2 text-right text-xs">{formatBDT(u.buy_price)}</td>
                            <td className="px-4 py-2 text-right text-xs">{formatBDT(u.mrp)}</td>
                            <td className="px-4 py-2 text-right text-xs">{formatBDT(u.cost_price)}</td>
                            <td className="px-4 py-2 text-right">
                              <div className="flex justify-end gap-1">
                                {u.status === 'in_stock' && (
                                  <button onClick={() => setSelling(u)} className="btn-ghost p-1.5 text-neon-green" title="Sell">
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button onClick={() => openEdit(u)} className="btn-ghost p-1.5" title="Edit">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => del(u)} className="btn-ghost p-1.5 text-danger hover:bg-danger/10" title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="bg-elev-bg text-xs uppercase tracking-wider text-muted-text">
              <tr>
                <th className="px-4 py-3 text-left">Brand</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-left">Variant</th>
                <th className="px-4 py-3 text-left">IMEI</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Buy</th>
                <th className="px-4 py-3 text-right">MRP</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-elev-bg/30">
                  <td className="px-4 py-3 text-sm text-main-text">{p.brand}</td>
                  <td className="px-4 py-3 text-sm text-main-text">{p.model}</td>
                  <td className="px-4 py-3 text-sm text-sec-text">{p.variant || '-'}</td>
                  <td className="px-4 py-3 text-sm font-mono text-xs text-muted-text">{p.imei}</td>
                  <td className="px-4 py-3">
                    <span className={"badge text-[10px] " + (
                      p.status === 'in_stock' ? 'bg-success/20 text-success' :
                      p.status === 'sold' ? 'bg-elev-bg text-sec-text' :
                      p.status === 'returned' ? 'bg-warning/20 text-warning' :
                      'bg-error/20 text-error'
                    )}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-xs">{formatBDT(p.buy_price)}</td>
                  <td className="px-4 py-3 text-right text-xs">{formatBDT(p.mrp)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {p.status === 'in_stock' && (
                        <button onClick={() => setSelling(p)} className="btn-ghost p-1.5 text-neon-green" title="Sell">
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => openEdit(p)} className="btn-ghost p-1.5" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => del(p)} className="btn-ghost p-1.5 text-danger hover:bg-danger/10" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showScanner && <BarcodeScanner onScan={handleScanResult} onClose={() => setShowScanner(false)} title="Scan IMEI barcode" />}
      {imeiScannerOpen && (
        <BarcodeScanner
          title="Scan IMEI for new phone"
          onScan={(code) => { setForm((f) => ({ ...f, imei: code.replace(/\D/g, '') })); setImeiScannerOpen(false); showToast('IMEI captured', 'success') }}
          onClose={() => setImeiScannerOpen(false)}
        />
      )}
      {selling && <SellPhoneModal phone={selling} onSuccess={handleSellSuccess} onCancel={() => setSelling(null)} />}
    </AdminLayout>
  )
}
