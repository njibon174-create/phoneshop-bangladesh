import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

const BRANDS = ['Samsung', 'Xiaomi', 'Realme', 'Vivo', 'Oppo', 'iTel', 'Symphony', 'Walton', 'Apple', 'Other']

function validateIMEI(imei) {
  if (!imei || imei.length < 14 || imei.length > 16) return false
  return /^\d+$/.test(imei)
}

export default function EditPhone({ phone, onSuccess, onCancel }) {
  const [brand, setBrand] = useState(phone.brand || '')
  const [customBrand, setCustomBrand] = useState('')
  const [model, setModel] = useState(phone.model || '')
  const [imei, setImei] = useState(phone.imei || '')
  const [buyPrice, setBuyPrice] = useState(phone.buy_price || '')
  const [mrp, setMrp] = useState(phone.mrp || '')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [imeiError, setImeiError] = useState('')

  const isOtherBrand = !BRANDS.slice(0, -1).includes(brand) && brand !== ''

  function validate() {
    const errs = {}
    const finalBrand = brand === 'Other' || isOtherBrand
      ? customBrand.trim() || brand
      : brand
    if (!finalBrand) errs.brand = 'Brand is required'
    if (!model.trim()) errs.model = 'Model is required'
    if (!validateIMEI(imei)) errs.imei = 'IMEI must be 14–16 digits'
    if (!buyPrice || Number(buyPrice) <= 0) errs.buyPrice = 'Valid buy price is required'
    if (!mrp || Number(mrp) <= 0) errs.mrp = 'Valid MRP is required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setImeiError('')
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    const finalBrand = isOtherBrand ? customBrand.trim() : brand
    setLoading(true)

    const { error } = await supabase
      .from('phones')
      .update({
        brand: finalBrand,
        model: model.trim(),
        imei: imei.trim(),
        buy_price: Number(buyPrice),
        mrp: Number(mrp),
      })
      .eq('id', phone.id)

    setLoading(false)

    if (error) {
      if (error.code === '23505') {
        setImeiError('This IMEI is already registered.')
      } else {
        setImeiError(error.message)
      }
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Brand */}
      <div>
        <label className="label">Brand</label>
        <select
          className={`input ${errors.brand ? 'input-error' : ''}`}
          value={isOtherBrand ? 'Other' : brand}
          onChange={e => { setBrand(e.target.value); setErrors(p => ({ ...p, brand: '' })) }}
        >
          <option value="">Select brand</option>
          {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        {errors.brand && <p className="mt-1 text-xs text-red-500">{errors.brand}</p>}
        {(brand === 'Other' || isOtherBrand) && (
          <input
            type="text"
            className={`input mt-2`}
            placeholder="Enter brand name"
            value={isOtherBrand ? customBrand || brand : customBrand}
            onChange={e => { setCustomBrand(e.target.value); setErrors(p => ({ ...p, brand: '' })) }}
          />
        )}
      </div>

      {/* Model */}
      <div>
        <label className="label">Model</label>
        <input
          type="text"
          className={`input ${errors.model ? 'input-error' : ''}`}
          value={model}
          onChange={e => { setModel(e.target.value); setErrors(p => ({ ...p, model: '' })) }}
        />
        {errors.model && <p className="mt-1 text-xs text-red-500">{errors.model}</p>}
      </div>

      {/* IMEI */}
      <div>
        <label className="label">IMEI</label>
        <input
          type="text"
          className={`input font-mono ${errors.imei || imeiError ? 'input-error' : ''}`}
          value={imei}
          maxLength={16}
          onChange={e => { setImei(e.target.value.replace(/\D/g, '')); setErrors(p => ({ ...p, imei: '' })); setImeiError('') }}
        />
        {(errors.imei || imeiError) && <p className="mt-1 text-xs text-red-500">{imeiError || errors.imei}</p>}
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Buy Price (৳)</label>
          <input
            type="number"
            className={`input ${errors.buyPrice ? 'input-error' : ''}`}
            min="0"
            step="1"
            value={buyPrice}
            onChange={e => { setBuyPrice(e.target.value); setErrors(p => ({ ...p, buyPrice: '' })) }}
          />
          {errors.buyPrice && <p className="mt-1 text-xs text-red-500">{errors.buyPrice}</p>}
        </div>
        <div>
          <label className="label">MRP (৳)</label>
          <input
            type="number"
            className={`input ${errors.mrp ? 'input-error' : ''}`}
            min="0"
            step="1"
            value={mrp}
            onChange={e => { setMrp(e.target.value); setErrors(p => ({ ...p, mrp: '' })) }}
          />
          {errors.mrp && <p className="mt-1 text-xs text-red-500">{errors.mrp}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
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
