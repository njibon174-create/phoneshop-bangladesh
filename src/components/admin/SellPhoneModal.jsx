import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Save, X } from 'lucide-react'

function formatBDT(n) {
  return '৳' + Number(n || 0).toLocaleString('en-IN')
}

export function SellPhoneModal({ phone, onSuccess, onCancel }) {
  const [sellPrice, setSellPrice] = useState(String(phone.mrp || ''))
  const [paymentType, setPaymentType] = useState('cash')
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function validate() {
    const errs = {}
    if (!sellPrice || Number(sellPrice) <= 0) errs.sellPrice = 'Valid sell price required'
    if (paymentType === 'baki' && !buyerName.trim()) errs.buyerName = 'Buyer name required for credit sale'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const sellPriceNum = Number(sellPrice)
    const today = new Date().toISOString().slice(0, 10)

    // 1. Update phone status
    const { error: phoneErr } = await supabase
      .from('phones').update({ status: 'sold' }).eq('id', phone.id)
    if (phoneErr) { setLoading(false); setErrors({ _form: phoneErr.message }); return }

    // 2. Insert sale
    const { data: saleData, error: saleErr } = await supabase.from('sales').insert({
      phone_id: phone.id,
      sell_price: sellPriceNum,
      cost_price: phone.buy_price || 0,
      payment_type: paymentType,
      buyer_name: paymentType === 'baki' ? buyerName.trim() : null,
      buyer_phone: paymentType === 'baki' ? buyerPhone.trim() || null : null,
      status: 'completed',
      sale_date: today,
    }).select().single()
    if (saleErr) { setLoading(false); setErrors({ _form: saleErr.message }); return }

    // 3. Cash sale → insert cash transaction; Baki → insert credit
    if (paymentType === 'cash') {
      await supabase.from('cash_transactions').insert({
        type: 'sale_cash',
        direction: 'in',
        amount: sellPriceNum,
        note: `Sale: ${phone.brand} ${phone.model}`,
        transaction_date: today,
      })
    } else {
      await supabase.from('credits').insert({
        sale_id: saleData.id,
        customer_name: buyerName.trim(),
        customer_phone: buyerPhone.trim() || null,
        total_due: sellPriceNum,
        paid_amount: 0,
        remaining: sellPriceNum,
        status: 'pending',
      })
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-sec-bg border border-border rounded-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-main-text">Sell phone</h3>
          <button type="button" onClick={onCancel} className="text-muted-text hover:text-main-text"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-elev-bg border border-border rounded-lg p-3">
            <p className="text-xs text-muted-text">Phone</p>
            <p className="font-semibold text-main-text">{phone.brand} {phone.model}</p>
            <p className="text-xs text-sec-text font-mono">{phone.imei || '—'}</p>
            <p className="text-xs text-muted-text mt-1">MRP: <span className="text-main-text">{formatBDT(phone.mrp)}</span> · Buy: <span className="text-main-text">{formatBDT(phone.buy_price)}</span></p>
          </div>

          <div>
            <label className="block text-xs font-medium text-sec-text mb-1.5">Sell price (BDT) *</label>
            <input type="number" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className={`input ${errors.sellPrice ? 'border-danger' : ''}`} />
            {errors.sellPrice && <p className="text-xs text-danger mt-1">{errors.sellPrice}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-sec-text mb-1.5">Payment type</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPaymentType('cash')} className={`py-2 rounded-lg text-sm font-medium ${paymentType === 'cash' ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' : 'bg-elev-bg text-sec-text border border-border'}`}>Cash</button>
              <button type="button" onClick={() => setPaymentType('baki')} className={`py-2 rounded-lg text-sm font-medium ${paymentType === 'baki' ? 'bg-warning/20 text-warning border border-warning/30' : 'bg-elev-bg text-sec-text border border-border'}`}>Baki (Credit)</button>
            </div>
          </div>

          {paymentType === 'baki' && (
            <>
              <div>
                <label className="block text-xs font-medium text-sec-text mb-1.5">Buyer name *</label>
                <input type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className={`input ${errors.buyerName ? 'border-danger' : ''}`} />
                {errors.buyerName && <p className="text-xs text-danger mt-1">{errors.buyerName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-sec-text mb-1.5">Buyer phone</label>
                <input type="text" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} className="input" />
              </div>
            </>
          )}

          {errors._form && <p className="text-danger text-sm">{errors._form}</p>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {loading ? 'Saving…' : 'Complete sale'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
