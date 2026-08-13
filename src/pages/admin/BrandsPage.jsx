import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

function formatDate(d) { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }

function SkeletonCard() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-[#1E2A3A] animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-20 rounded bg-[#1E2A3A] animate-pulse" />
          <div className="h-3 w-24 rounded bg-[#1E2A3A] animate-pulse" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-[#1E2A3A] animate-pulse" />
    </div>
  )
}

export function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', description: '', logo_url: '' })
  const [toast, setToast] = useState(null)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('brands').select('*').order('sort_order')
    setBrands(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function autoSlug(n) { return n.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

  function startEdit(b) {
    setEditing(b.id); setCreating(false)
    setForm({ name: b.name, slug: b.slug, description: b.description || '', logo_url: b.logo_url || '' })
  }
  function startCreate() {
    setCreating(true); setEditing(null)
    setForm({ name: '', slug: '', description: '', logo_url: '' })
  }
  function cancel() { setCreating(false); setEditing(null) }

  async function save() {
    if (!form.name.trim()) return showToast('Name is required', 'error')
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || autoSlug(form.name),
      description: form.description.trim() || null,
      logo_url: form.logo_url.trim() || null,
    }
    let err
    if (creating) ({ error: err } = await supabase.from('brands').insert(payload))
    else ({ error: err } = await supabase.from('brands').update(payload).eq('id', editing))
    if (err) {
      if (/permission denied/i.test(err.message || '')) {
        return showToast('Permission denied. Run supabase/006_grant_admin_permissions.sql in Supabase SQL Editor.', 'error')
      }
      return showToast(err.message, 'error')
    }
    cancel(); load(); showToast('Saved!')
  }

  async function del(b) {
    if (!confirm(`Delete brand "${b.name}"?`)) return
    const { error } = await supabase.from('brands').delete().eq('id', b.id)
    if (error) {
      if (/permission denied/i.test(error.message || '')) {
        return showToast('Permission denied. Run supabase/006_grant_admin_permissions.sql in Supabase SQL Editor.', 'error')
      }
      showToast(error.message, 'error')
    } else load()
  }

  const filtered = brands.filter(b => !search || b.name.toLowerCase().includes(search.toLowerCase()) || (b.slug || '').toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === 'error' ? 'bg-[#F8717120] text-[#F87171] border-[#F8717150]' : 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]'
        }`}>{toast.msg}</div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="stat-card"><span className="stat-label">Total Brands</span><span className="stat-value">{brands.length}</span></div>
        <div className="stat-card sm:col-span-2"><span className="stat-label">Active</span><span className="stat-value">{brands.filter(b => b.is_active !== false).length}</span></div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" className="input pl-9 pr-9" placeholder="Search brands…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && (<button className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#E5E7EB] p-0.5" onClick={() => setSearch('')}><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>)}
        </div>
        <button className="btn-primary" onClick={startCreate}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Brand
        </button>
      </div>

      {/* Form modal */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 shadow-2xl bg-[#1E2A3A]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#E5E7EB]">{creating ? 'New brand' : 'Edit brand'}</h2>
              <button className="btn-ghost btn-sm" onClick={cancel}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="space-y-3">
              <div><label className="label">Name</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: p.slug || autoSlug(e.target.value) }))} /></div>
              <div><label className="label">Slug</label><input className="input font-mono" placeholder="auto-generated" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} /></div>
              <div><label className="label">Logo URL</label><input className="input font-mono" placeholder="https://…" value={form.logo_url} onChange={e => setForm(p => ({ ...p, logo_url: e.target.value }))} /></div>
              <div><label className="label">Description</label><textarea rows={2} className="input resize-none" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn-secondary" onClick={cancel}>Cancel</button>
              <button className="btn-primary" onClick={save}>{creating ? 'Add Brand' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {!loading && <p className="text-xs text-[#9CA3AF]">Showing {filtered.length} brand{filtered.length !== 1 ? 's' : ''}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1E2A3A] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#E5E7EB]">No brands yet</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Click <span className="font-medium text-[#9CA3AF]">Add Brand</span> to get started</p>
            </div>
          </div>
        )}

        {!loading && filtered.map(b => (
          <div key={b.id} className="card p-4 flex flex-col gap-3 border border-[#1E3A5F]">
            <div className="flex items-start gap-3">
              {b.logo_url ? (
                <img src={b.logo_url} alt={b.name} className="w-12 h-12 rounded-lg object-contain bg-[#1E2A3A] p-1" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-[#1E2A3A] flex items-center justify-center text-2xl">🏷️</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#E5E7EB] truncate">{b.name}</p>
                <p className="text-[10px] text-[#4A7A9B] font-mono truncate">{b.slug}</p>
              </div>
            </div>
            {b.description && <p className="text-xs text-[#9CA3AF] line-clamp-2">{b.description}</p>}
            <div className="flex gap-2 pt-1 border-t border-[#1E3A5F]">
              <button className="btn btn-sm flex-1 justify-center bg-[#1E2A3A] text-[#9CA3AF] border border-[#1E3A5F] hover:border-neon-blue/50 hover:text-neon-blue" onClick={() => startEdit(b)}>Edit</button>
              <button className="btn btn-sm text-[#F87171] hover:bg-[#F8717120]" onClick={() => del(b)}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
