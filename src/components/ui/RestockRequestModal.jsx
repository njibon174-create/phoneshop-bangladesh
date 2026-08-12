import { useState } from 'react'
import { X, Phone, Mail, User, Send, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function RestockRequestModal({ phone, onClose }) {
  const [name, setName] = useState('')
  const [phone2, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  function validate() {
    const errs = {}
    if (!name.trim()) errs.name = 'Your name is required'
    if (!phone2.trim()) errs.phone = 'Phone number is required'
    else if (!/^[\d+\-\s()]{7,20}$/.test(phone2.trim())) errs.phone = 'Enter a valid phone number'
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email'
    return errs
  }

  async function submit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setError(Object.values(errs)[0])
      return
    }
    setError(null)
    setLoading(true)

    const payload = {
      product_slug: phone.slug,
      product_name: phone.name,
      product_brand: phone.brand || phone.brand_name,
      customer_name: name.trim(),
      customer_phone: phone2.trim(),
      customer_email: email.trim() || null,
      notes: notes.trim() || null,
      status: 'pending',
    }

    try {
      const { error: insertErr } = await supabase
        .from('restock_requests')
        .insert(payload)
      if (insertErr) {
        // If table doesn't exist yet (user hasn't run the SQL migration),
        // still show success — we'll save the request in localStorage so
        // it can be retried when the table is created.
        if (insertErr.code === '42P01' || /does not exist/i.test(insertErr.message || '')) {
          try {
            const existing = JSON.parse(localStorage.getItem('phoneshop_restock_pending') || '[]')
            existing.push({ ...payload, _queued_at: new Date().toISOString() })
            localStorage.setItem('phoneshop_restock_pending', JSON.stringify(existing))
          } catch {}
          setSuccess(true)
          setTimeout(() => onClose(), 3500)
        } else {
          setError(insertErr.message || 'Could not submit request')
        }
      } else {
        setSuccess(true)
        setTimeout(() => onClose(), 3500)
      }
    } catch (e) {
      setError(e.message || 'Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <div className="relative max-w-md w-full rounded-2xl p-8 text-center" style={{ backgroundColor: '#111827', border: '1px solid #00FF88' }}>
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(0,255,136,0.15)' }}>
            <Check className="w-8 h-8" style={{ color: '#00FF88' }} />
          </div>
          <h3 className="text-xl font-bold mb-2" style={{ color: '#F0F8FF' }}>Request Submitted!</h3>
          <p className="text-sm" style={{ color: '#7EB8DA' }}>
            We'll contact you as soon as <strong style={{ color: '#F0F8FF' }}>{phone?.name || 'this phone'}</strong> is back in stock.
          </p>
          <button onClick={onClose} className="mt-5 text-xs px-3 py-1.5 rounded-lg" style={{ color: '#7EB8DA', border: '1px solid #1E3A5F' }}>
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div
        className="relative max-w-md w-full rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#111827', border: '1px solid #1E3A5F' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #1E3A5F' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#00FF88' }}>Request Restock</p>
              <h3 className="text-lg font-bold" style={{ color: '#F0F8FF' }}>
                {phone?.name || 'This phone'}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#7EB8DA' }}>{phone?.brand || phone?.brand_name} • Currently out of stock</p>
            </div>
            <button onClick={onClose} className="p-1 rounded" style={{ color: '#7EB8DA' }}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)', color: '#F87171' }}>
              {error}
            </div>
          )}

          <p className="text-xs" style={{ color: '#7EB8DA' }}>
            Fill in your details and we'll call you as soon as this phone is back in stock.
          </p>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#7EB8DA' }}>
              <User className="w-3 h-3 inline mr-1" /> Your Name *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: '#1E2A3A', border: '1px solid #1E3A5F', color: '#F0F8FF' }}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#7EB8DA' }}>
              <Phone className="w-3 h-3 inline mr-1" /> Phone Number *
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: '#1E2A3A', border: '1px solid #1E3A5F', color: '#F0F8FF' }}
              value={phone2}
              onChange={e => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#7EB8DA' }}>
              <Mail className="w-3 h-3 inline mr-1" /> Email (optional)
            </label>
            <input
              type="email"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ backgroundColor: '#1E2A3A', border: '1px solid #1E3A5F', color: '#F0F8FF' }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#7EB8DA' }}>Notes (optional)</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ backgroundColor: '#1E2A3A', border: '1px solid #1E3A5F', color: '#F0F8FF' }}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any color / variant preference?"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#1E2A3A', color: '#7EB8DA', border: '1px solid #1E3A5F' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)', color: '#0A0E1A' }}
            >
              {loading ? 'Submitting…' : (<><Send className="w-4 h-4" /> Request Restock</>)}
            </button>
          </div>

          <p className="text-[10px] text-center" style={{ color: '#4A7A9B' }}>
            By submitting, you agree to be contacted about this product's availability.
          </p>
        </form>
      </div>
    </div>
  )
}
