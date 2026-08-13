import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function EditPhone({ phone, brands = [], onSuccess, onCancel }) {
  const [brand, setBrand] = useState(phone.brand || '')
  const [customBrand, setCustomBrand] = useState('')
  const [model, setModel] = useState(phone.model || '')
  const [variant, setVariant] = useState(phone.variant || 'Standard')
  const [shortDesc, setShortDesc] = useState(phone.short_desc || '')
  const [longDesc, setLongDesc] = useState(phone.long_desc || '')
  const [colors, setColors] = useState(phone.colors || '')
  const [specs, setSpecs] = useState({
    display: phone.specs?.display || '',
    chip: phone.specs?.chip || '',
    os: phone.specs?.os || '',
    ram_gb: phone.specs?.ram_gb || '',
    storage_gb: phone.specs?.storage_gb || '',
    rear_camera: phone.specs?.rear_camera || '',
    front_camera: phone.specs?.front_camera || '',
    battery_mah: phone.specs?.battery_mah || '',
    charging_w: phone.specs?.charging_w || '',
    wireless_charging_w: phone.specs?.wireless_charging_w || '',
    refresh_rate_hz: phone.specs?.refresh_rate_hz || '',
    weight_g: phone.specs?.weight_g || '',
    ip_rating: phone.specs?.ip_rating || '',
    '5g': phone.specs?.['5g'] || '',
  })
  const [buyPrice, setBuyPrice] = useState(phone.buy_price || '')
  const [mrp, setMrp] = useState(phone.mrp || '')
  const [compareAtPrice, setCompareAtPrice] = useState(phone.compare_at_price || '')
  const [warranty, setWarranty] = useState(String(phone.warranty_months || '12'))
  const [imageUrl, setImageUrl] = useState(phone.primary_image_url || '')
  const [isFeatured, setIsFeatured] = useState(phone.is_featured || false)
  const [isBestseller, setIsBestseller] = useState(phone.is_bestseller || false)
  const [status, setStatus] = useState(phone.status || 'in_stock')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const isOtherBrand = brand && !brands.includes(brand)

  function updateSpec(key, value) {
    setSpecs(prev => ({ ...prev, [key]: value }))
  }

  function validate() {
    const errs = {}
    const finalBrand = brand === 'Other' || isOtherBrand ? customBrand.trim() : brand
    if (!finalBrand) errs.brand = 'Brand is required'
    if (!model.trim()) errs.model = 'Model is required'
    if (!buyPrice || Number(buyPrice) <= 0) errs.buyPrice = 'Valid buy price is required'
    if (!mrp || Number(mrp) <= 0) errs.mrp = 'Valid MRP is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    const finalBrand = isOtherBrand ? customBrand.trim() : brand

    const payload = {
      brand: finalBrand,
      model: model.trim(),
      variant: variant.trim() || 'Standard',
      short_desc: shortDesc.trim() || null,
      long_desc: longDesc.trim() || null,
      colors: colors.trim() || null,
      specs: {
        display: specs.display || null,
        chip: specs.chip || null,
        os: specs.os || null,
        ram_gb: specs.ram_gb || null,
        storage_gb: specs.storage_gb || null,
        rear_camera: specs.rear_camera || null,
        front_camera: specs.front_camera || null,
        battery_mah: specs.battery_mah || null,
        charging_w: specs.charging_w || null,
        wireless_charging_w: specs.wireless_charging_w || null,
        refresh_rate_hz: specs.refresh_rate_hz || null,
        weight_g: specs.weight_g || null,
        ip_rating: specs.ip_rating || null,
        '5g': specs['5g'] || null,
      },
      buy_price: Number(buyPrice),
      mrp: Number(mrp),
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      warranty_months: Number(warranty) || 12,
      primary_image_url: imageUrl.trim() || null,
      is_featured: isFeatured,
      is_bestseller: isBestseller,
      status,
    }

    setLoading(true)
    const { error } = await supabase
      .from('phones')
      .update(payload)
      .eq('id', phone.id)
    setLoading(false)

    if (error) {
      setErrors({ submit: error.message })
      return
    }

    onSuccess()
  }

  const specFields = [
    { key: 'display', label: 'Display', placeholder: 'e.g. 6.7" OLED 120Hz' },
    { key: 'chip', label: 'Chip / Processor', placeholder: 'e.g. Apple A17 Pro' },
    { key: 'os', label: 'Operating System', placeholder: 'e.g. iOS 17' },
    { key: 'ram_gb', label: 'RAM (GB)', placeholder: 'e.g. 8' },
    { key: 'storage_gb', label: 'Storage (GB)', placeholder: 'e.g. 256' },
    { key: 'rear_camera', label: 'Rear Camera', placeholder: 'e.g. 48MP + 12MP' },
    { key: 'front_camera', label: 'Front Camera', placeholder: 'e.g. 12MP' },
    { key: 'battery_mah', label: 'Battery (mAh)', placeholder: 'e.g. 4422' },
    { key: 'charging_w', label: 'Charging (W)', placeholder: 'e.g. 27' },
    { key: 'wireless_charging_w', label: 'Wireless Charging (W)', placeholder: 'e.g. 15' },
    { key: 'refresh_rate_hz', label: 'Refresh Rate (Hz)', placeholder: 'e.g. 120' },
    { key: 'weight_g', label: 'Weight (g)', placeholder: 'e.g. 221' },
    { key: 'ip_rating', label: 'IP Rating', placeholder: 'e.g. IP68' },
    { key: '5g', label: '5G', placeholder: 'e.g. Yes / No' },
  ]

  const inputClass = 'input w-full bg-[#0D1B2A] border border-[#1E3A5F] text-[#E5E7EB] placeholder-[#4B5563] focus:border-[#00D4FF] focus:outline-none transition-colors rounded-lg px-3 py-2'
  const labelClass = 'block text-xs font-medium text-[#9CA3AF] mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">

      {errors.submit && (
        <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
          {errors.submit}
        </div>
      )}

      {/* IMEI — read only */}
      <div>
        <label className={labelClass}>IMEI <span className="text-[#4B5563]">(cannot change)</span></label>
        <input type="text" className={`${inputClass} opacity-60 cursor-not-allowed`} value={phone.imei || ''} readOnly />
      </div>

      {/* Brand */}
      <div>
        <label className={labelClass}>Brand</label>
        <select
          className={`${inputClass} ${errors.brand ? 'border-red-500' : ''}`}
          value={isOtherBrand ? 'Other' : brand}
          onChange={e => { setBrand(e.target.value); setErrors(p => ({ ...p, brand: '' })) }}
        >
          <option value="">Select brand</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
          <option value="Other">Other (custom)</option>
        </select>
        {errors.brand && <p className="mt-1 text-xs text-red-500">{errors.brand}</p>}
        {(brand === 'Other' || isOtherBrand) && (
          <input type="text" className={`${inputClass} mt-2`} placeholder="Enter brand name"
            value={isOtherBrand ? customBrand || brand : customBrand}
            onChange={e => { setCustomBrand(e.target.value); setErrors(p => ({ ...p, brand: '' })) }} />
        )}
      </div>

      {/* Model + Variant */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Model</label>
          <input type="text" className={`${inputClass} ${errors.model ? 'border-red-500' : ''}`} value={model}
            onChange={e => { setModel(e.target.value); setErrors(p => ({ ...p, model: '' })) }} />
          {errors.model && <p className="mt-1 text-xs text-red-500">{errors.model}</p>}
        </div>
        <div>
          <label className={labelClass}>Variant</label>
          <input type="text" className={inputClass} value={variant} placeholder="e.g. Standard"
            onChange={e => setVariant(e.target.value)} />
        </div>
      </div>

      {/* Short Description */}
      <div>
        <label className={labelClass}>Short Description</label>
        <input type="text" className={inputClass} value={shortDesc} placeholder="e.g. Apple flagship with A17 Pro chip"
          onChange={e => setShortDesc(e.target.value)} />
      </div>

      {/* Colors */}
      <div>
        <label className={labelClass}>Colors</label>
        <input type="text" className={inputClass} value={colors} placeholder="e.g. Black, Blue, Silver"
          onChange={e => setColors(e.target.value)} />
      </div>

      {/* Prices */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>Buy Price (৳)</label>
          <input type="number" className={`${inputClass} ${errors.buyPrice ? 'border-red-500' : ''}`} value={buyPrice} min="0"
            onChange={e => { setBuyPrice(e.target.value); setErrors(p => ({ ...p, buyPrice: '' })) }} />
          {errors.buyPrice && <p className="mt-1 text-xs text-red-500">{errors.buyPrice}</p>}
        </div>
        <div>
          <label className={labelClass}>MRP (৳)</label>
          <input type="number" className={`${inputClass} ${errors.mrp ? 'border-red-500' : ''}`} value={mrp} min="0"
            onChange={e => { setMrp(e.target.value); setErrors(p => ({ ...p, mrp: '' })) }} />
          {errors.mrp && <p className="mt-1 text-xs text-red-500">{errors.mrp}</p>}
        </div>
        <div>
          <label className={labelClass}>Compare Price (৳)</label>
          <input type="number" className={inputClass} value={compareAtPrice} min="0" placeholder="Optional"
            onChange={e => setCompareAtPrice(e.target.value)} />
        </div>
      </div>

      {/* Warranty + Status */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Warranty (months)</label>
          <input type="number" className={inputClass} value={warranty} min="0"
            onChange={e => setWarranty(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="in_stock">In Stock</option>
            <option value="sold">Sold</option>
            <option value="returned">Returned</option>
          </select>
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label className={labelClass}>Image URL</label>
        <input type="url" className={inputClass} value={imageUrl} placeholder="https://..."
          onChange={e => setImageUrl(e.target.value)} />
        {imageUrl && (
          <div className="mt-2 w-16 h-16 rounded-lg overflow-hidden bg-[#1E3A5F] flex items-center justify-center">
            <img src={imageUrl} alt="preview" className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
          </div>
        )}
      </div>

      {/* Featured / Bestseller */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-[#00D4FF]" checked={isFeatured}
            onChange={e => setIsFeatured(e.target.checked)} />
          <span className="text-xs text-[#9CA3AF]">Featured</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="accent-[#00D4FF]" checked={isBestseller}
            onChange={e => setIsBestseller(e.target.checked)} />
          <span className="text-xs text-[#9CA3AF]">Bestseller</span>
        </label>
      </div>

      {/* Long Description */}
      <div>
        <label className={labelClass}>Long Description</label>
        <textarea className={`${inputClass} min-h-[80px] resize-y`} value={longDesc}
          placeholder="Full product page description..."
          onChange={e => setLongDesc(e.target.value)} />
      </div>

      {/* Specifications */}
      <div>
        <h3 className="text-sm font-semibold text-[#E5E7EB] mb-3">Specifications</h3>
        <div className="space-y-3">
          {specFields.map(field => (
            <div key={field.key}>
              <label className={labelClass}>{field.label}</label>
              <input type="text" className={inputClass} value={specs[field.key] || ''}
                placeholder={field.placeholder}
                onChange={e => updateSpec(field.key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E3A5F] sticky bottom-0 bg-[#0A1628] pb-1">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        )}
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
