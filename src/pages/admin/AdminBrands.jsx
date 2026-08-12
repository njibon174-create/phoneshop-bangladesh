import { useEffect, useState } from 'react'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

export function AdminBrands() {
  const [brands, setBrands] = useState([])
  const [editing, setEditing] = useState(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', slug: '', description: '', logo_url: '' })
  const [msg, setMsg] = useState(null)

  async function load() {
    const { data } = await supabase.from('brands').select('*').order('sort_order')
    setBrands(data || [])
  }

  useEffect(() => { load() }, [])

  function startEdit(b) {
    setEditing(b.id)
    setForm({ name: b.name, slug: b.slug, description: b.description || '', logo_url: b.logo_url || '' })
    setMsg(null)
  }

  function startCreate() {
    setCreating(true)
    setEditing(null)
    setForm({ name: '', slug: '', description: '', logo_url: '' })
    setMsg(null)
  }

  function cancel() {
    setEditing(null)
    setCreating(false)
    setForm({ name: '', slug: '', description: '', logo_url: '' })
  }

  function autoSlug(name) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function save() {
    setMsg(null)
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || autoSlug(form.name),
      description: form.description.trim() || null,
      logo_url: form.logo_url.trim() || null,
    }
    if (!payload.name) return setMsg({ type: 'error', text: 'Name is required' })

    let err
    if (creating) {
      const r = await supabase.from('brands').insert(payload)
      err = r.error
    } else {
      const r = await supabase.from('brands').update(payload).eq('id', editing)
      err = r.error
    }
    if (err) return setMsg({ type: 'error', text: err.message })
    cancel()
    load()
    setMsg({ type: 'success', text: 'Saved!' })
  }

  async function del(b) {
    if (!confirm(`Delete brand "${b.name}"? This will fail if any products reference it.`)) return
    const { error } = await supabase.from('brands').delete().eq('id', b.id)
    if (error) setMsg({ type: 'error', text: error.message })
    else load()
  }

  return (
    <AdminLayout title="Brands" subtitle="Phone brands carried in your shop" actions={
      !creating && !editing && (
        <button onClick={startCreate} className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      )
    }>
      {msg && (
        <div className={`card p-3 mb-4 text-sm ${msg.type === 'error' ? 'text-danger' : 'text-success'}`}>{msg.text}</div>
      )}

      {(creating || editing) && (
        <div className="card p-5 mb-4">
          <h3 className="font-semibold text-main-text mb-3">{creating ? 'New brand' : 'Edit brand'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">Name *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || autoSlug(e.target.value) }))} className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-sec-text mb-1.5">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="input font-mono text-xs" placeholder="auto" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-sec-text mb-1.5">Logo URL</label>
              <input type="text" value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} className="input font-mono text-xs" placeholder="https://…" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-sec-text mb-1.5">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="input resize-none" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={save} className="btn-primary text-sm py-2 px-4 flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
            <button onClick={cancel} className="btn-secondary text-sm py-2 px-4 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {brands.map((b) => (
          <div key={b.id} className="card p-4 transition-all hover:-translate-y-0.5">
            <div className="flex items-start gap-3 mb-3">
              {b.logo_url ? (
                <img src={b.logo_url} alt={b.name} className="w-12 h-12 rounded-lg object-contain bg-surfaceElevated p-1" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-surfaceElevated flex items-center justify-center text-2xl">🏷️</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-main-text truncate">{b.name}</p>
                <p className="text-[10px] text-muted-text font-mono truncate">{b.slug}</p>
              </div>
            </div>
            {b.description && <p className="text-xs text-sec-text mb-3 line-clamp-2">{b.description}</p>}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => startEdit(b)} className="text-xs py-1.5 px-3 rounded border border-border bg-elev-bg text-sec-text hover:text-main-text inline-flex items-center gap-1">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => del(b)} className="text-xs py-1.5 px-3 rounded border border-error/40 bg-error/10 text-error hover:bg-error/20 inline-flex items-center gap-1 ml-auto">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}