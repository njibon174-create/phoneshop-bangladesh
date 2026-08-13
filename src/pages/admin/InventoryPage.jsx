import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import BarcodeScanner from '../../components/admin/BarcodeScanner'

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Add Stock Modal ─────────────────────────────────────────────────────────
function AddStockModal({ variant, onSuccess, onCancel }) {
  const [imeiList, setImeiList] = useState([''])
  const [buyPrice, setBuyPrice] = useState(variant?.buy_price_bdt || '')
  const [mrp, setMrp] = useState(variant?.mrp_bdt || '')
  const [condition, setCondition] = useState('new')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const imeiRefs = useRef([])

  function validateIMEI(imei) {
    if (!imei || imei.length < 14 || imei.length > 16) return false
    return /^\d+$/.test(imei)
  }

  function handleScanResult(code) {
    setShowScanner(false)
    const cleaned = (code || '').replace(/\D/g, '')
    if (!cleaned) return
    // Fill first empty slot
    const idx = imeiList.findIndex(i => !i.trim())
    if (idx >= 0) {
      const updated = [...imeiList]
      updated[idx] = cleaned
      setImeiList(updated)
    } else {
      setImeiList(prev => [...prev, cleaned])
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const valid = imeiList.map(i => i.trim()).filter(Boolean)
    if (valid.length === 0) { setError('Enter at least one IMEI.'); return }
    const invalid = valid.find(i => !validateIMEI(i))
    if (invalid) { setError(`Invalid IMEI: ${invalid} (must be 14–16 digits)`); return }

    setLoading(true)
    const rows = valid.map(imei => ({
      variant_id: variant.id,
      imei,
      buy_price_bdt: Number(buyPrice) || null,
      mrp_bdt: Number(mrp) || null,
      status: 'in_stock',
      condition,
    }))

    const { error: err } = await supabase.from('inventory_units').insert(rows)
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess({ count: valid.length })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#E5E7EB]">Add Stock — {variant?.variant_name}</h3>
        <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="p-3 rounded-lg bg-[#1a2744] border border-[#1E3A5F] text-xs text-[#9CA3AF]">
        <strong className="text-[#E5E7EB]">{variant?.product_name}</strong>
        <span className="mx-1">·</span>
        Color: {variant?.color || '—'} · RAM: {variant?.ram_gb || '—'}GB · ROM: {variant?.rom_gb || '—'}GB
        <span className="mx-1">·</span>
        MRP: ৳{formatCurrency(variant?.mrp_bdt)}
        <span className="mx-1">·</span>
        Stock: <span className="text-[#39FF88]">{variant?.stock_count || 0}</span>
      </div>

      {error && <div className="px-3 py-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>}

      {/* IMEI inputs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label">IMEI(s)</label>
          <button type="button" className="btn-ghost btn-sm text-xs" onClick={() => setImeiList(prev => [...prev, ''])}>
            + Add another
          </button>
        </div>
        <div className="space-y-2">
          {imeiList.map((imei, i) => (
            <div key={i} className="flex gap-2">
              <input
                ref={el => imeiRefs.current[i] = el}
                type="text"
                className="input flex-1 font-mono text-sm"
                placeholder={`IMEI ${i + 1} (14–16 digits)`}
                value={imei}
                maxLength={16}
                onChange={e => {
                  const updated = [...imeiList]
                  updated[i] = e.target.value.replace(/\D/g, '')
                  setImeiList(updated)
                }}
              />
              <button type="button" className="btn-ghost btn-sm" onClick={() => setShowScanner(true)} title="Scan barcode">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
              </button>
              {imeiList.length > 1 && (
                <button type="button" className="btn-ghost btn-sm text-red-400" onClick={() => setImeiList(prev => prev.filter((_, j) => j !== i))}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Buy Price (৳)</label>
          <input type="number" className="input" value={buyPrice} min="0" placeholder="0"
            onChange={e => setBuyPrice(e.target.value)} />
        </div>
        <div>
          <label className="label">MRP (৳)</label>
          <input type="number" className="input" value={mrp} min="0" placeholder="0"
            onChange={e => setMrp(e.target.value)} />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="label">Condition</label>
        <select className="input" value={condition} onChange={e => setCondition(e.target.value)}>
          <option value="new">New</option>
          <option value="refurbished">Refurbished</option>
          <option value="used">Used</option>
        </select>
      </div>

      {showScanner && (
        <div className="border border-[#00D4FF]/30 rounded-lg p-2">
          <BarcodeScanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-[#1E3A5F]">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Adding…' : `Add ${imeiList.filter(i => i.trim()).length} Unit${imeiList.filter(i => i.trim()).length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </form>
  )
}

// ─── Sell Modal ───────────────────────────────────────────────────────────────
function SellUnitModal({ unit, onSuccess, onCancel }) {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [sellPrice, setSellPrice] = useState(unit?.mrp_bdt || '')
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!customerName.trim()) { setError('Customer name is required.'); return }
    if (!customerPhone.trim()) { setError('Phone number is required.'); return }
    if (!sellPrice || Number(sellPrice) <= 0) { setError('Valid sell price is required.'); return }

    setLoading(true)
    const { error: err } = await supabase
      .from('inventory_units')
      .update({
        status: 'sold',
        sold_at: new Date().toISOString(),
        sold_to: customerName.trim(),
        sold_price_bdt: Number(sellPrice),
      })
      .eq('id', unit.id)
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[#E5E7EB]">Sell Phone</h3>
        <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <div className="p-3 rounded-lg bg-[#1a2744] border border-[#1E3A5F] text-xs">
        <strong className="text-[#E5E7EB]">{unit?.variant_name}</strong>
        <span className="mx-1">·</span>
        IMEI: <span className="font-mono">{unit?.imei}</span>
        <span className="mx-1">·</span>
        MRP: ৳{formatCurrency(unit?.mrp_bdt)}
      </div>

      {error && <div className="px-3 py-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-xs">{error}</div>}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Customer Name</label>
          <input type="text" className="input" value={customerName} placeholder="Full name"
            onChange={e => setCustomerName(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label">Phone</label>
          <input type="tel" className="input" value={customerPhone} placeholder="01XXXXXXXXX"
            onChange={e => setCustomerPhone(e.target.value)} />
        </div>
        <div>
          <label className="label">Sell Price (৳)</label>
          <input type="number" className="input" value={sellPrice} min="0"
            onChange={e => setSellPrice(e.target.value)} />
        </div>
        <div>
          <label className="label">Payment</label>
          <select className="input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="cod">COD</option>
            <option value="bkash">bKash</option>
            <option value="nagad">Nagad</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-[#1E3A5F]">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Processing…' : 'Complete Sale'}
        </button>
      </div>
    </form>
  )
}

// ─── Main InventoryPage ───────────────────────────────────────────────────────
export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [variants, setVariants] = useState([])
  const [inventoryUnits, setInventoryUnits] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('in_stock')
  const [viewMode, setViewMode] = useState('variants') // 'variants' | 'units'
  const [toast, setToast] = useState(null)
  const [addStockVariant, setAddStockVariant] = useState(null)
  const [sellUnit, setSellUnit] = useState(null)
  const [expandedProduct, setExpandedProduct] = useState(null)
  const [showScanner, setShowScanner] = useState(false)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  async function fetchAll() {
    setLoading(true)
    const [p, v, u, b] = await Promise.all([
      supabase.from('products_with_variants').select('*').order('brand_name, name'),
      supabase.from('variants_with_stock').select('*').order('product_name, variant_name'),
      supabase.from('inventory_units').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('brands').select('id, name').order('name'),
    ])
    setProducts(p.data || [])
    setVariants(v.data || [])
    setInventoryUnits(u.data || [])
    setBrands(b.data || [])
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  async function handleAddStockSuccess({ count }) {
    setAddStockVariant(null)
    showToast(`Added ${count} unit${count !== 1 ? 's' : ''} to stock.`)
    fetchAll()
  }

  async function handleSellSuccess() {
    setSellUnit(null)
    showToast('Sale completed!')
    fetchAll()
  }

  async function handleDeleteUnit(unit) {
    const { error } = await supabase.from('inventory_units').delete().eq('id', unit.id)
    if (error) showToast('Delete failed: ' + error.message, 'error')
    else { showToast('Unit deleted.'); fetchAll() }
  }

  function handleScanResult(code) {
    setShowScanner(false)
    const cleaned = (code || '').replace(/\D/g, '')
    if (!cleaned) return
    // Find matching unit
    const match = inventoryUnits.find(u => u.imei && u.imei.replace(/\D/g, '').endsWith(cleaned))
    if (match) {
      if (match.status === 'in_stock') setSellUnit(match)
      else showToast(`This unit is ${match.status}.`, 'error')
    } else {
      setSearch(cleaned)
      showToast(`No IMEI match — showing units containing "${cleaned}".`)
    }
  }

  const unitsFiltered = inventoryUnits.filter(u => {
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    const q = search.trim().toLowerCase()
    const matchSearch = !q || (u.imei || '').toLowerCase().includes(q) || (u.variant_name || '').toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const variantsWithSearch = variants.filter(v => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (v.product_name || '').toLowerCase().includes(q) ||
           (v.variant_name || '').toLowerCase().includes(q) ||
           (v.brand_name || '').toLowerCase().includes(q)
  })

  // Group variants by product
  const groupedByProduct = variantsWithSearch.reduce((acc, v) => {
    if (!acc[v.product_id]) acc[v.product_id] = { product_name: v.product_name, brand_name: v.brand_name, variants: [] }
    acc[v.product_id].variants.push(v)
    return acc
  }, {})

  return (
    <div className="space-y-4">

      {/* ─── Toast ─── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl text-sm font-medium border ${
          toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-[#39FF88]/10 border-[#39FF88]/30 text-[#39FF88]'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* ─── Toolbar ─── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <input type="text" className="input pl-9 w-full" placeholder="Search by IMEI, model, variant…"
            value={search} onChange={e => setSearch(e.target.value)} />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4B5563]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>

        {/* Scan */}
        <button className="btn-ghost btn-sm border border-[#1E3A5F]" onClick={() => setShowScanner(true)} title="Scan barcode">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
          </svg>
          Scan
        </button>

        {/* Status filter */}
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="sold">Sold</option>
          <option value="reserved">Reserved</option>
          <option value="returned">Returned</option>
          <option value="damaged">Damaged</option>
        </select>

        {/* View toggle */}
        <div className="flex rounded-lg border border-[#1E3A5F] overflow-hidden">
          <button className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'variants' ? 'bg-[#00D4FF]/10 text-[#00D4FF]' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'}`}
            onClick={() => setViewMode('variants')}>By Variant</button>
          <button className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'units' ? 'bg-[#00D4FF]/10 text-[#00D4FF]' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'}`}
            onClick={() => setViewMode('units')}>By IMEI</button>
        </div>
      </div>

      {/* ─── Scanner Modal ─── */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="card w-full max-w-sm p-4 my-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#E5E7EB]">Scan Barcode / IMEI</h3>
              <button className="btn-ghost btn-sm" onClick={() => setShowScanner(false)}>✕</button>
            </div>
            <BarcodeScanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />
          </div>
        </div>
      )}

      {/* ─── BY VARIANT VIEW ─── */}
      {viewMode === 'variants' && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="card p-4 h-20 bg-[#1E2A3A] animate-pulse rounded-xl" />)}
            </div>
          ) : Object.keys(groupedByProduct).length === 0 ? (
            <div className="card p-8 text-center text-[#9CA3AF]">
              <p className="text-sm">No products found.{' '}
                <span className="text-[#00D4FF]">Go to Products tab to create a product first.</span>
              </p>
            </div>
          ) : Object.entries(groupedByProduct).map(([productId, { product_name, brand_name, variants: pvs }]) => (
            <div key={productId} className="card overflow-hidden">
              {/* Product header */}
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-[#1a2744]/50 transition-colors"
                onClick={() => setExpandedProduct(expandedProduct === productId ? null : productId)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1E3A5F] flex items-center justify-center overflow-hidden">
                    {pvs[0]?.image_url
                      ? <img src={pvs[0].image_url} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                      : <span className="text-lg">📱</span>
                    }
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#E5E7EB]">{brand_name} {product_name}</p>
                    <p className="text-xs text-[#9CA3AF]">{pvs.length} variant{pvs.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-[#9CA3AF]">
                      Stock: {pvs.reduce((s, v) => s + (v.stock_count || 0), 0)} units
                    </p>
                    <p className="text-xs text-[#9CA3AF]">
                      MRP: ৳{formatCurrency(pvs[0]?.mrp_bdt)} – ৳{formatCurrency(Math.max(...pvs.map(v => v.mrp_bdt || 0)))}
                    </p>
                  </div>
                  <svg className={`w-4 h-4 text-[#4B5563] transition-transform ${expandedProduct === productId ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </button>

              {/* Expanded variant rows */}
              {expandedProduct === productId && (
                <div className="border-t border-[#1E3A5F]">
                  {pvs.map(v => (
                    <div key={v.id} className="flex items-center justify-between px-4 py-3 border-b border-[#1E3A5F]/50 last:border-0 hover:bg-[#1a2744]/30">
                      <div className="flex items-center gap-3 min-w-0">
                        {v.image_url && (
                          <div className="w-8 h-8 rounded bg-[#1E3A5F] overflow-hidden shrink-0">
                            <img src={v.image_url} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs text-[#E5E7EB] font-medium truncate">{v.variant_name || `${v.color || ''} ${v.ram_gb || ''}GB/${v.rom_gb || ''}GB`.trim()}</p>
                          <p className="text-xs text-[#9CA3AF]">
                            Color: {v.color || '—'} · RAM: {v.ram_gb || '—'}GB · ROM: {v.rom_gb || '—'}GB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-[#39FF88]">{v.stock_count || 0} in stock</p>
                          <p className="text-xs text-[#9CA3AF]">৳{formatCurrency(v.mrp_bdt)}</p>
                        </div>
                        <button className="btn-primary btn-sm" onClick={() => setAddStockVariant(v)}>
                          + Add Stock
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── BY IMEI VIEW ─── */}
      {viewMode === 'units' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1E3A5F] text-left">
                {['IMEI', 'Variant', 'Status', 'Condition', 'Buy Price', 'MRP', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-[#9CA3AF]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="border-b border-[#1E3A5F]/50">
                    {[1,2,3,4,5,6,7].map(j => (
                      <td key={j} className="px-4 py-3"><div className="h-4 w-24 bg-[#1E2A3A] rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : unitsFiltered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#9CA3AF] text-sm">No units found.</td></tr>
              ) : unitsFiltered.map(u => (
                <tr key={u.id} className="border-b border-[#1E3A5F]/50 hover:bg-[#1a2744]/30">
                  <td className="px-4 py-3 font-mono text-xs text-[#E5E7EB]">{u.imei || '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#9CA3AF]">
                    <span className="text-[#E5E7EB]">{u.variant_name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                      u.status === 'in_stock' ? 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]' :
                      u.status === 'sold' ? 'bg-[#60A5FA20] text-[#60A5FA] border-[#60A5FA50]' :
                      u.status === 'returned' ? 'bg-[#FBBF2420] text-[#FBBF24] border-[#FBBF2450]' :
                      'bg-[#9CA3AF20] text-[#9CA3AF] border-[#9CA3AF50]'
                    }`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#9CA3AF] capitalize">{u.condition}</td>
                  <td className="px-4 py-3 text-xs text-[#9CA3AF]">৳{formatCurrency(u.buy_price_bdt)}</td>
                  <td className="px-4 py-3 text-xs text-[#E5E7EB]">৳{formatCurrency(u.mrp_bdt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {u.status === 'in_stock' && (
                        <button className="btn-primary btn-sm text-xs" onClick={() => setSellUnit(u)}>Sell</button>
                      )}
                      <button className="btn-ghost btn-sm text-xs text-red-400" onClick={() => handleDeleteUnit(u)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── Add Stock Modal ─── */}
      {addStockVariant && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="card w-full max-w-md p-6 shadow-2xl my-4 sm:my-8">
            <AddStockModal
              variant={addStockVariant}
              onSuccess={handleAddStockSuccess}
              onCancel={() => setAddStockVariant(null)}
            />
          </div>
        </div>
      )}

      {/* ─── Sell Unit Modal ─── */}
      {sellUnit && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="card w-full max-w-md p-6 shadow-2xl my-4 sm:my-8">
            <SellUnitModal
              unit={sellUnit}
              onSuccess={handleSellSuccess}
              onCancel={() => setSellUnit(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
