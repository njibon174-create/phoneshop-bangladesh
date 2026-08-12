import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { Save } from 'lucide-react'

export function AdminSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  async function load() {
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
    if (data) {
      setSettings(data)
    } else {
      // Create default row
      const defaults = {
        store_name: 'PhoneShop BD',
        store_phone: '+880 1700-000000',
        store_email: 'support@phoneshop.bd',
        store_address: 'House 12, Road 7, Dhanmondi, Dhaka',
        store_hours: 'Sat-Thu 10:00 AM – 8:00 PM, Fri 2:00 PM – 8:00 PM',
        whatsapp_number: '+880 1700-000000',
        facebook_url: '',
        instagram_url: '',
        youtube_url: '',
        hero_badge: 'New Season Collection 2026',
        hero_headline: 'Bangladesh\'s Premium Phone Destination',
        hero_subheadline: 'From the latest iPhone to budget-friendly smartphones — authentic products, official warranty, and fast delivery across Bangladesh.',
        about_story: 'PhoneShop BD was founded by a group of friends who got tired of buying phones from local shops with no warranties, no price transparency...',
        about_value_authentic: 'We never sell counterfeit or refurbished-as-new phones.',
        about_value_warranty: 'Every phone comes with official manufacturer warranty.',
        about_value_delivery: 'Most orders delivered within 2-5 days, all over Bangladesh.',
        about_value_pricing: 'No hidden fees, no bait-and-switch, no surprises.',
        faq_q1: 'How do I place an order?',
        faq_a1: 'Browse our phones, click any phone to see details, add to cart, then proceed to checkout.',
        faq_q2: 'How long does delivery take?',
        faq_a2: 'For major cities: 2-3 business days. For other districts: 3-5 days.',
        faq_q3: 'What is your return policy?',
        faq_a3: '7-day returns for unused phones in original packaging.',
        faq_q4: 'Do phones come with warranty?',
        faq_a4: 'Yes. All new phones come with official manufacturer warranty.',
        faq_q5: 'Can I pick up my order in person?',
        faq_a5: 'Yes! Choose "Shop Pickup" at checkout. Your phone will be ready at our Dhaka store within 1 hour.',
        faq_q6: 'Do you have a store I can visit?',
        faq_a6: 'Yes. Our flagship store is at House 12, Road 7, Dhanmondi, Dhaka.',
        faq_q7: 'Are the phones original?',
        faq_a7: '100% original. We source directly from brand-authorized distributors.',
        faq_q8: 'Can I track my order?',
        faq_a8: 'Yes. After dispatch, you\'ll receive an SMS with the tracking number.',
        updated_at: new Date().toISOString(),
      }
      const { data: created } = await supabase.from('site_settings').insert(defaults).select().single()
      setSettings(created || defaults)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function update(k, v) {
    setSettings((s) => ({ ...s, [k]: v }))
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    const payload = { ...settings, id: 1, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('site_settings').upsert(payload)
    if (error) setMsg({ type: 'error', text: error.message })
    else setMsg({ type: 'success', text: 'Saved!' })
    setSaving(false)
  }

  if (loading || !settings) return <AdminLayout title="Site Settings"><div className="card p-8 text-center">Loading…</div></AdminLayout>

  return (
    <AdminLayout
      title="Site Settings"
      subtitle="Edit store info, hero text, about page, and FAQ — these show on the storefront immediately."
      actions={
        <button onClick={save} disabled={saving} className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save All'}
        </button>
      }
    >
      {msg && (
        <div className={`card p-3 mb-4 text-sm ${msg.type === 'error' ? 'text-danger' : 'text-success'}`}>{msg.text}</div>
      )}

      <div className="space-y-6">
        {/* Store info */}
        <div className="card p-5">
          <h2 className="font-semibold text-main-text mb-4">Store info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Store name"><input value={settings.store_name || ''} onChange={(e) => update('store_name', e.target.value)} className="input" /></Field>
            <Field label="Phone"><input value={settings.store_phone || ''} onChange={(e) => update('store_phone', e.target.value)} className="input" /></Field>
            <Field label="Email"><input value={settings.store_email || ''} onChange={(e) => update('store_email', e.target.value)} className="input" /></Field>
            <Field label="WhatsApp number"><input value={settings.whatsapp_number || ''} onChange={(e) => update('whatsapp_number', e.target.value)} className="input" /></Field>
            <Field label="Address" full><textarea value={settings.store_address || ''} onChange={(e) => update('store_address', e.target.value)} rows={2} className="input resize-none" /></Field>
            <Field label="Store hours" full><input value={settings.store_hours || ''} onChange={(e) => update('store_hours', e.target.value)} className="input" /></Field>
          </div>
        </div>

        {/* Social */}
        <div className="card p-5">
          <h2 className="font-semibold text-main-text mb-4">Social media</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Facebook URL"><input value={settings.facebook_url || ''} onChange={(e) => update('facebook_url', e.target.value)} className="input" placeholder="https://facebook.com/…" /></Field>
            <Field label="Instagram URL"><input value={settings.instagram_url || ''} onChange={(e) => update('instagram_url', e.target.value)} className="input" placeholder="https://instagram.com/…" /></Field>
            <Field label="YouTube URL"><input value={settings.youtube_url || ''} onChange={(e) => update('youtube_url', e.target.value)} className="input" placeholder="https://youtube.com/…" /></Field>
          </div>
        </div>

        {/* Hero */}
        <div className="card p-5">
          <h2 className="font-semibold text-main-text mb-4">Homepage hero</h2>
          <div className="space-y-3">
            <Field label="Badge text (small label above headline)"><input value={settings.hero_badge || ''} onChange={(e) => update('hero_badge', e.target.value)} className="input" /></Field>
            <Field label="Headline (main heading)"><input value={settings.hero_headline || ''} onChange={(e) => update('hero_headline', e.target.value)} className="input" /></Field>
            <Field label="Subheadline (paragraph)"><textarea value={settings.hero_subheadline || ''} onChange={(e) => update('hero_subheadline', e.target.value)} rows={3} className="input resize-none" /></Field>
          </div>
        </div>

        {/* About */}
        <div className="card p-5">
          <h2 className="font-semibold text-main-text mb-4">About page</h2>
          <Field label="Our story"><textarea value={settings.about_story || ''} onChange={(e) => update('about_story', e.target.value)} rows={4} className="input resize-none" /></Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Field label="Value: Authentic"><input value={settings.about_value_authentic || ''} onChange={(e) => update('about_value_authentic', e.target.value)} className="input" /></Field>
            <Field label="Value: Warranty"><input value={settings.about_value_warranty || ''} onChange={(e) => update('about_value_warranty', e.target.value)} className="input" /></Field>
            <Field label="Value: Delivery"><input value={settings.about_value_delivery || ''} onChange={(e) => update('about_value_delivery', e.target.value)} className="input" /></Field>
            <Field label="Value: Pricing"><input value={settings.about_value_pricing || ''} onChange={(e) => update('about_value_pricing', e.target.value)} className="input" /></Field>
          </div>
        </div>

        {/* FAQ */}
        <div className="card p-5">
          <h2 className="font-semibold text-main-text mb-4">FAQ (shown on Support page)</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="border border-border rounded-lg p-3">
                <Field label={`Q${i}`}><input value={settings[`faq_q${i}`] || ''} onChange={(e) => update(`faq_q${i}`, e.target.value)} className="input text-sm" /></Field>
                <Field label="A"><textarea value={settings[`faq_a${i}`] || ''} onChange={(e) => update(`faq_a${i}`, e.target.value)} rows={2} className="input resize-none text-sm" /></Field>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function Field({ label, full, children }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="block text-xs font-medium text-sec-text mb-1.5">{label}</label>
      {children}
    </div>
  )
}
