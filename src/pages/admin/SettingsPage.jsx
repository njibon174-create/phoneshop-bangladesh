import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

// All field names match the actual site_settings table schema.
const FIELDS = {
  // Store
  store_name: 'Store Name',
  store_phone: 'Store Phone',
  store_email: 'Store Email',
  store_address: 'Store Address',
  store_hours: 'Store Hours',
  // Social
  whatsapp_number: 'WhatsApp Number',
  facebook_url: 'Facebook URL',
  instagram_url: 'Instagram URL',
  youtube_url: 'YouTube URL',
  // Hero
  hero_badge: 'Hero Badge (small text above headline)',
  hero_headline: 'Hero Headline (big text)',
  hero_subheadline: 'Hero Subheadline (description text)',
  // About
  about_story: 'About Story',
  about_value_authentic: 'About — Value: Authentic',
  about_value_warranty: 'About — Value: Warranty',
  about_value_delivery: 'About — Value: Delivery',
  about_value_pricing: 'About — Value: Pricing',
}

const FAQ_FIELDS = [
  { q: 'faq_q1', a: 'faq_a1' },
  { q: 'faq_q2', a: 'faq_a2' },
  { q: 'faq_q3', a: 'faq_a3' },
  { q: 'faq_q4', a: 'faq_a4' },
  { q: 'faq_q5', a: 'faq_a5' },
  { q: 'faq_q6', a: 'faq_a6' },
  { q: 'faq_q7', a: 'faq_a7' },
  { q: 'faq_q8', a: 'faq_a8' },
]

export function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.from('site_settings').select('*').eq('id', 'main').maybeSingle()
        // Build a fully-populated settings object (in case the row is missing)
        const defaults = { id: 'main' }
        for (const k of Object.keys(FIELDS)) defaults[k] = ''
        for (const f of FAQ_FIELDS) { defaults[f.q] = ''; defaults[f.a] = '' }
        setSettings({ ...defaults, ...(data || {}) })
      } catch (e) {
        showToast(e.message, 'error')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    const { id, ...payload } = settings
    const { error } = await supabase.from('site_settings').upsert({ id: 'main', ...payload })
    setSaving(false)
    if (error) showToast(error.message, 'error')
    else showToast('Settings saved.')
  }

  function set(k, v) { setSettings(s => ({ ...s, [k]: v })) }

  if (loading || !settings) {
    return <div className="card p-12 text-center text-[#7EB8DA]">Loading…</div>
  }

  // Group fields by section
  const sections = [
    {
      title: 'Store Info',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      color: '#00FF88',
      fields: ['store_name', 'store_phone', 'store_email', 'store_address', 'store_hours'],
    },
    {
      title: 'Hero Section',
      icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
      color: '#00FF88',
      fields: ['hero_badge', 'hero_headline', 'hero_subheadline'],
    },
    {
      title: 'Social',
      icon: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244',
      color: '#00D4FF',
      fields: ['whatsapp_number', 'facebook_url', 'instagram_url', 'youtube_url'],
    },
    {
      title: 'About Page',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      color: '#FBBF24',
      fields: ['about_story', 'about_value_authentic', 'about_value_warranty', 'about_value_delivery', 'about_value_pricing'],
    },
  ]

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === 'error' ? 'bg-[#F8717120] text-[#F87171] border-[#F8717150]' : 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]'
        }`}>{toast.msg}</div>
      )}

      <div className="flex justify-end mb-3">
        <button className="btn-primary" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save Changes'}</button>
      </div>

      {sections.map(sec => (
        <div key={sec.title} className="card p-6 space-y-4 border border-[#1E3A5F]">
          <h3 className="font-semibold text-[#E5E7EB] flex items-center gap-2">
            <svg className="w-4 h-4" style={{ color: sec.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sec.icon}/></svg>
            {sec.title}
          </h3>
          {sec.fields.map(key => (
            <div key={key}>
              <label className="label">{FIELDS[key]}</label>
              {key === 'about_story' || key.includes('headline') || key.includes('address') ? (
                <textarea rows={2} className="input resize-none" value={settings[key] || ''} onChange={e => set(key, e.target.value)} />
              ) : (
                <input className="input" value={settings[key] || ''} onChange={e => set(key, e.target.value)} />
              )}
            </div>
          ))}
        </div>
      ))}

      <div className="card p-6 space-y-4 border border-[#1E3A5F]">
        <h3 className="font-semibold text-[#E5E7EB] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#FBBF24]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          FAQ (Support Page)
        </h3>
        <p className="text-xs text-[#7EB8DA]">Questions and answers shown on the Support page</p>
        {FAQ_FIELDS.map((f, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-lg bg-[#1E2A3A] border border-[#1E3A5F]">
            <div>
              <label className="label">Q{i + 1}</label>
              <input className="input" value={settings[f.q] || ''} onChange={e => set(f.q, e.target.value)} />
            </div>
            <div>
              <label className="label">A{i + 1}</label>
              <textarea rows={2} className="input resize-none" value={settings[f.a] || ''} onChange={e => set(f.a, e.target.value)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
