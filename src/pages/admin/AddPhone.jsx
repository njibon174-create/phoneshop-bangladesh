import { useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import BarcodeScanner from '../../components/admin/BarcodeScanner'

const BRANDS = ['Samsung', 'Xiaomi', 'Realme', 'Vivo', 'Oppo', 'iTel', 'Symphony', 'Walton', 'Apple', 'Other']

function validateIMEI(imei) {
  if (!imei) return false
  if (imei.length < 14 || imei.length > 16) return false
  return /^\d+$/.test(imei)
}

export default function AddPhone({ onSuccess, onCancel }) {
  const [brand, setBrand] = useState('')
  const [customBrand, setCustomBrand] = useState('')
  const [model, setModel] = useState('')
  const [variant, setVariant] = useState('Standard')
  // MULTI-IMEI: one row per unit, plus bulk paste & scan
  const [imeiList, setImeiList] = useState([''])
  const [buyPrice, setBuyPrice] = useState('')
  const [mrp, setMrp] = useState('')
  const [warranty, setWarranty] = useState('12')
  const [imageUrl, setImageUrl] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)
  const [isBestseller, setIsBestseller] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [msg, setMsg] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const imeiRefs = useRef([])

  function validate() {
    const errs = {}
    const finalBrand = brand === 'Other' ? customBrand.trim() : brand
    if (!finalBrand) errs.brand = 'Brand is required'
    if (!model.trim()) errs.model = 'Model is required'
    if (!buyPrice || Number(buyPrice) <= 0) errs.buyPrice = 'Valid buy price is required'
    if (!mrp || Number(mrp) <= 0) errs.mrp = 'Valid MRP is required'
    // Validate each IMEI individually
    for (const [idx, imei] of imeiList.entries()) {
      const trimmed = (imei || '').trim()
      if (trimmed && !validateIMEI(trimmed)) {
        errs[`imei_${idx}`] = `Row ${idx + 1}: IMEI must be 14–16 digits`
      }
    }
    const validImeis = imeiList.map(i => i.trim()).filter(Boolean)
    if (validImeis.length > 1 && new Set(validImeis).size !== validImeis.length) {
      errs.imeis_unique = 'Duplicate IMEIs in list — each must be unique'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMsg(null)
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const finalBrand = brand === 'Other' ? customBrand.trim() : brand
    // Build rows — one per IMEI; or one model-only row if none entered.
    // Adding to inventory automatically makes the phone visible in the front shop.
    const validImeis = imeiList.map(i => i.trim()).filter(Boolean)
    const baseRow = {
      brand: finalBrand,
      model: model.trim(),
      variant: variant.trim() || 'Standard',
      buy_price: Number(buyPrice),
      mrp: Number(mrp),
      warranty_months: Number(warranty) || 12,
      image_url: imageUrl.trim() || null,
      is_featured: isFeatured,
      is_bestseller: isBestseller,
      status: 'in_stock',
    }
    const rows = validImeis.length > 0
      ? validImeis.map(imei => ({ ...baseRow, imei }))
      : [{ ...baseRow, imei: null }]

    const { error } = await supabase.from('phones').insert(rows)
    setLoading(false)

    if (error) {
      if (error.code === '23505') {
        setErrors({ _form: 'One or more IMEIs are already in inventory' })
      } else {
        setErrors({ _form: error.message })
      }
      return
    }

    setMsg({
      type: 'success',
      text: `${rows.length} phone${rows.length > 1 ? 's' : ''} added — they will appear in the front shop automatically.`,
    })
    // Reset form
    setBrand(''); setCustomBrand(''); setModel(''); setVariant('Standard')
    setImeiList(['']); setBuyPrice(''); setMrp(''); setWarranty('12')
    setImageUrl(''); setIsFeatured(false); setIsBestseller(false)
    setTimeout(() => onSuccess(), 1500)
  }

  // ── IMEI row helpers ──
  function addImeiRow() {
    setImeiList(arr => {
      const next = [...arr, '']
      setTimeout(() => imeiRefs.current[next.length - 1]?.focus(), 50)
      return next
    })
  }
  function removeImeiRow(i) {
    setImeiList(arr => arr.length === 1 ? arr : arr.filter((_, idx) => idx !== i))
  }
  function setImeiValue(i, v) {
    setImeiList(arr => arr.map((x, idx) => idx === i ? v.replace(/\D/g, '') : x))
  }
  function bulkPaste() {
    const text = prompt('Paste IMEIs — one per line, or comma-separated:')
    if (!text) return
    const lines = text.split(/[\n,]+/).map(l => l.trim()).filter(Boolean)
    if (!lines.length) return
    setImeiList(arr => {
      const newArr = [...arr]
      // Replace trailing empty row, then append
      if (newArr[newArr.length - 1] === '') newArr.pop()
      return [...newArr, ...lines]
    })
  }
  function onScan(code) {
    setShowScanner(false)
    const cleaned = (code || '').replace(/\D/g, '')
    if (!cleaned) return
    setImeiList(arr => {
      // put into first empty slot or add a new row
      const idx = arr.findIndex(v => !v.trim())
      if (idx >= 0) return arr.map((v, i) => i === idx ? cleaned : v)
      return [...arr, cleaned]
    })
    setMsg({ type: 'success', text: `Scanned IMEI ${cleaned} added to list` })
    setTimeout(() => setMsg(null), 2000)
  }

  const filledCount = imeiList.filter(i => i.trim()).length

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Brand + Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Brand</label>
          <select
            className={`input ${errors.brand ? 'input-error' : ''}`}
            value={brand}
            onChange={e => { setBrand(e.target.value); setErrors(p => ({ ...p, brand: '' })) }}
          >
            <option value="">Select brand</option>
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          {errors.brand && <p className="mt-1 text-xs text-red-500">{errors.brand}</p>}
          {brand === 'Other' && (
            <input
              type="text"
              className={`input mt-2 ${errors.brand ? 'input-error' : ''}`}
              placeholder="Enter brand name"
              value={customBrand}
              onChange={e => { setCustomBrand(e.target.value); setErrors(p => ({ ...p, brand: '' })) }}
            />
          )}
        </div>
        <div>
          <label className="label">Model</label>
          <input
            type="text"
            className={`input ${errors.model ? 'input-error' : ''}`}
            placeholder="e.g. Galaxy S24 Ultra"
            value={model}
            onChange={e => { setModel(e.target.value); setErrors(p => ({ ...p, model: '' })) }}
          />
          {errors.model && <p className="mt-1 text-xs text-red-500">{errors.model}</p>}
        </div>
      </div>

      {/* Variant + Warranty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Variant / Spec</label>
          <input type="text" className="input" placeholder="e.g. 256GB Natural Titanium" value={variant} onChange={e => setVariant(e.target.value)} />
        </div>
        <div>
          <label className="label">Warranty (months)</label>
          <input type="number" className="input" min="0" value={warranty} onChange={e => setWarranty(e.target.value)} placeholder="12" />
        </div>
      </div>

      {/* IMEI list — multi-row with bulk paste + scan */}
      <div className="rounded-xl bg-elev-bg border border-border p-4">
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <label className="label !mb-0">IMEI Numbers <span className="text-muted-text font-normal">(one per unit — leave empty for model-only entry)</span></label>
          <div className="flex gap-2">
            <button type="button" onClick={bulkPaste} className="btn-secondary btn-sm">Bulk Paste</button>
            <button type="button" onClick={addImeiRow} className="btn-secondary btn-sm bg-success/15 text-success border border-success/30">+ Add Row</button>
          </div>
        </div>
        <div className="space-y-2">
          {imeiList.map((imei, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-xs text-sec-text font-mono w-8 shrink-0 mt-2.5">#{i + 1}</span>
              <input
                ref={el => imeiRefs.current[i] = el}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                className={`input font-mono flex-1 text-sm ${errors[`imei_${i}`] || errors.imeis_unique ? 'input-error' : ''}`}
                placeholder={i === 0 ? 'Scan or type IMEI (15–16 digits)' : 'Optional — leave blank to skip this unit'}
                value={imei}
                maxLength={16}
                onChange={e => { setImeiValue(i, e.target.value); setErrors(p => ({ ...p, [`imei_${i}`]: '', imeis_unique: '' })) }}
              />
              {imeiList.length > 1 && (
                <button type="button" onClick={() => removeImeiRow(i)} className="btn-ghost btn-sm text-danger hover:bg-danger/15" title="Remove row">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {errors.imeis_unique && <p className="mt-2 text-xs text-red-500">{errors.imeis_unique}</p>}
        <p className="text-[11px] text-muted-text mt-2">
          {filledCount > 0
            ? `${filledCount} phone${filledCount > 1 ? 's' : ''} will be added to inventory.`
            : 'No IMEIs entered — will create one model-only row.'}
          {' '}Each unit appears in the front shop automatically.
        </p>
      </div>

      {/* IMEI Scan button */}
      <button type="button" onClick={() => setShowScanner(true)} className="btn-secondary w-full inline-flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Scan IMEI Barcode
      </button>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Buy Price (৳)</label>
          <input type="number" className={`input ${errors.buyPrice ? 'input-error' : ''}`} placeholder="0" min="0" step="1" value={buyPrice} onChange={e => { setBuyPrice(e.target.value); setErrors(p => ({ ...p, buyPrice: '' })) }} />
          {errors.buyPrice && <p className="mt-1 text-xs text-red-500">{errors.buyPrice}</p>}
        </div>
        <div>
          <label className="label">MRP (৳)</label>
          <input type="number" className={`input ${errors.mrp ? 'input-error' : ''}`} placeholder="0" min="0" step="1" value={mrp} onChange={e => { setMrp(e.target.value); setErrors(p => ({ ...p, mrp: '' })) }} />
          {errors.mrp && <p className="mt-1 text-xs text-red-500">{errors.mrp}</p>}
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label className="label">Image URL (front shop)</label>
        <input type="text" className="input" placeholder="https://..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-sec-text cursor-pointer">
          <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} className="accent-neon-green w-4 h-4" />
          Featured (homepage)
        </label>
        <label className="flex items-center gap-2 text-xs text-sec-text cursor-pointer">
          <input type="checkbox" checked={isBestseller} onChange={e => setIsBestseller(e.target.checked)} className="accent-neon-green w-4 h-4" />
          Bestseller
        </label>
      </div>

      {errors._form && (
        <div className="px-4 py-3 rounded-lg bg-danger/15 border border-danger/30 text-sm text-danger">{errors._form}</div>
      )}
      {msg && (
        <div className="px-4 py-3 rounded-lg bg-success/15 border border-success/30 text-sm text-success">{msg.text}</div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Adding…' : `Add ${filledCount > 0 ? filledCount : 1} Phone${filledCount !== 1 ? 's' : ''}`}
        </button>
      </div>

      {showScanner && (
        <BarcodeScanner title="Scan IMEI Barcode" onScan={onScan} onClose={() => setShowScanner(false)} />
      )}
    </form>
  )
}
