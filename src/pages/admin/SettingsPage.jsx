import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

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
      const { data } = await supabase.from('site_settings').select('*').eq('id', 'main').maybeSingle()
      setSettings(data || { id: 'main', hero_title: '', hero_subtitle: '', announcements: [], contact_phone: '', contact_email: '' })
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

  if (loading || !settings) {
    return <div className="card p-12 text-center text-[#7EB8DA]">Loading…</div>
  }

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

      <div className="card p-6 space-y-4 border border-[#1E3A5F]">
        <h3 className="font-semibold text-[#E5E7EB] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#00FF88]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
          Hero Section
        </h3>
        <div>
          <label className="label">Hero Title</label>
          <input className="input" value={settings.hero_title || ''} onChange={e => setSettings(s => ({ ...s, hero_title: e.target.value }))} />
        </div>
        <div>
          <label className="label">Hero Subtitle</label>
          <textarea rows={3} className="input resize-none" value={settings.hero_subtitle || ''} onChange={e => setSettings(s => ({ ...s, hero_subtitle: e.target.value }))} />
        </div>
      </div>

      <div className="card p-6 space-y-4 border border-[#1E3A5F]">
        <h3 className="font-semibold text-[#E5E7EB] flex items-center gap-2">
          <svg className="w-4 h-4 text-[#00D4FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
          Contact Info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label className="label">Phone</label><input className="input" value={settings.contact_phone || ''} onChange={e => setSettings(s => ({ ...s, contact_phone: e.target.value }))} /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={settings.contact_email || ''} onChange={e => setSettings(s => ({ ...s, contact_email: e.target.value }))} /></div>
        </div>
      </div>

      <div className="card p-6 space-y-4 border border-[#1E3A5F]">
        <h3 className="font-semibold text-[#E5E7EB] flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
          Announcements
        </h3>
        <p className="text-xs text-[#7EB8DA]">Banners that appear at the top of the homepage</p>
        <div className="space-y-2">
          {(settings.announcements || []).map((a, i) => (
            <div key={i} className="flex gap-2">
              <input className="input flex-1" value={a} onChange={e => setSettings(s => ({ ...s, announcements: s.announcements.map((x, idx) => idx === i ? e.target.value : x) }))} />
              <button className="btn-ghost btn-sm text-[#F87171]" onClick={() => setSettings(s => ({ ...s, announcements: s.announcements.filter((_, idx) => idx !== i) }))}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          ))}
          <button className="btn-secondary btn-sm" onClick={() => setSettings(s => ({ ...s, announcements: [...(s.announcements || []), ''] }))}>+ Add announcement</button>
        </div>
      </div>
    </div>
  )
}
