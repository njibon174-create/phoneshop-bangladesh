import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const DARK = {
  bg: 'bg-[#0A1628]',
  card: 'bg-[#0F1E32] border border-[#1E3A5F]',
  input: 'bg-[#1E2A3A] border border-[#1E3A5F] text-[#E5E7EB] placeholder-[#6B7280]',
  label: 'block text-xs font-medium text-[#9CA3AF] mb-1',
  btnPrimary: 'btn-primary',
  btnSecondary: 'btn-secondary',
  accent: '#38bdf8',
  success: '#34d399',
  danger: '#f87171',
}

const emptyVariant = () => ({
  color: '', ram_gb: '', rom_gb: '', mrp_bdt: '',
  buy_price_bdt: '', compare_price_bdt: '', image_url: '', is_default: false,
})

const emptyForm = () => ({
  brand_id: '', name: '', slug: '', short_desc: '', long_desc: '',
  warranty_months: '12', is_featured: false, is_bestseller: false,
  release_date: '', full_specs: {},
})

function SkeletonCard() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="h-32 bg-[#1E2A3A] animate-pulse rounded-lg" />
      <div className="h-4 w-2/3 bg-[#1E2A3A] animate-pulse rounded" />
      <div className="h-3 w-1/2 bg-[#1E2A3A] animate-pulse rounded" />
      <div className="h-3 w-1/3 bg-[#1E2A3A] animate-pulse rounded" />
    </div>
  )
}

export function AdminProductsPage() {
  const [tab, setTab] = useState('all') // 'all' | 'new'
  const [brands, setBrands] = useState([])
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [saving, setSaving] = useState(false)

  // ── Edit state ──
  const [editingId, setEditingId] = useState(null)
  const [editVariants, setEditVariants] = useState([])

  // ── Form state ──
  const [form, setForm] = useState(emptyForm())
  const [variants, setVariants] = useState([emptyVariant()])
  const [formErrors, setFormErrors] = useState({})

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Load brands
  useEffect(() => {
    supabase.from('brands').select('id, name').order('name').then(({ data }) => {
      setBrands(data || [])
    })
  }, [])

  // Load products from view
  async function loadProducts() {
    setLoadingProducts(true)
    const { data } = await supabase
      .from('products_with_variants')
      .select('*')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoadingProducts(false)
  }

  useEffect(() => { loadProducts() }, [])

  // Auto-generate slug from name
  function autoSlug(name) {
    return name.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // ── Variant helpers ──
  function addVariant() {
    setVariants(v => [...v, emptyVariant()])
  }

  function removeVariant(i) {
    setVariants(v => v.filter((_, idx) => idx !== i))
  }

  function updateVariant(i, field, value) {
    setVariants(v => v.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  function setDefaultVariant(i) {
    setVariants(v => v.map((row, idx) => ({ ...row, is_default: idx === i })))
  }

  // ── Form validation ──
  function validateForm(isEdit = false) {
    const errs = {}
    if (!form.brand_id) errs.brand_id = 'Brand is required'
    if (!form.name.trim()) errs.name = 'Product name is required'
    if (!isEdit && !form.slug.trim()) errs.slug = 'Slug is required'
    if (variants.length === 0) errs.variants = 'At least one variant is required'
    variants.forEach((v, i) => {
      if (!v.color.trim()) errs[`v_${i}_color`] = 'Color is required'
      if (!v.ram_gb.trim()) errs[`v_${i}_ram`] = 'RAM is required'
      if (!v.rom_gb.trim()) errs[`v_${i}_rom`] = 'ROM is required'
      if (!v.mrp_bdt || Number(v.mrp_bdt) <= 0) errs[`v_${i}_mrp`] = 'Valid MRP is required'
      if (!v.buy_price_bdt || Number(v.buy_price_bdt) <= 0) errs[`v_${i}_buy`] = 'Valid buy price is required'
    })
    return errs
  }

  // ── Create product + variants ──
  async function handleCreate(e) {
    e.preventDefault()
    const errs = validateForm(false)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setFormErrors({})
    setSaving(true)

    const slug = form.slug.trim() || autoSlug(form.name)
    const cleanSpecs = {}
    for (const [k, v] of Object.entries(form.full_specs)) {
      if (v && String(v).trim()) cleanSpecs[k] = String(v).trim()
    }

    const payload = {
      brand_id: form.brand_id,
      name: form.name.trim(),
      slug,
      short_desc: form.short_desc.trim() || null,
      long_desc: form.long_desc.trim() || null,
      warranty_months: Number(form.warranty_months) || 12,
      is_featured: form.is_featured,
      is_bestseller: form.is_bestseller,
      release_date: form.release_date || null,
      full_specs: Object.keys(cleanSpecs).length ? cleanSpecs : null,
    }

    // One transaction: insert product, then variants
    const { data: prodData, error: prodErr } = await supabase
      .from('products')
      .insert(payload)
      .select('id')
      .single()

    if (prodErr || !prodData) {
      setSaving(false)
      return showToast(prodErr?.message || 'Failed to create product', 'error')
    }

    const variantRows = variants.map(v => ({
      product_id: prodData.id,
      variant_name: `${form.name.trim()} ${v.color} ${v.ram_gb}/${v.rom_gb}`.trim(),
      color: v.color.trim(),
      ram_gb: Number(v.ram_gb),
      rom_gb: Number(v.rom_gb),
      mrp_bdt: Number(v.mrp_bdt),
      buy_price_bdt: Number(v.buy_price_bdt),
      compare_price_bdt: v.compare_price_bdt ? Number(v.compare_price_bdt) : null,
      image_url: v.image_url.trim() || null,
      is_default: v.is_default,
    }))

    const { error: varErr } = await supabase.from('product_variants').insert(variantRows)
    setSaving(false)

    if (varErr) {
      // Rollback: delete the product
      await supabase.from('products').delete().eq('id', prodData.id)
      return showToast(varErr.message || 'Failed to save variants', 'error')
    }

    showToast('Product created with variants!')
    setForm(emptyForm())
    setVariants([emptyVariant()])
    setTab('all')
    loadProducts()
  }

  // ── Load product for editing ──
  async function startEdit(product) {
    setEditingId(product.id)
    setForm({
      brand_id: product.brand_id || '',
      name: product.name || '',
      slug: product.slug || '',
      short_desc: product.short_desc || '',
      long_desc: product.long_desc || '',
      warranty_months: String(product.warranty_months || '12'),
      is_featured: product.is_featured || false,
      is_bestseller: product.is_bestseller || false,
      release_date: product.release_date || '',
      full_specs: product.full_specs || {},
    })

    // Load variants for this product
    const { data: vars } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id)
      .order('is_default', { ascending: false })

    setEditVariants(vars && vars.length > 0 ? vars : [{ ...emptyVariant(), is_default: true }])
    setTab('new')
  }

  // ── Update product + variants ──
  async function handleUpdate(e) {
    e.preventDefault()
    const errs = validateForm(true)
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setFormErrors({})
    setSaving(true)

    const cleanSpecs = {}
    for (const [k, v] of Object.entries(form.full_specs)) {
      if (v && String(v).trim()) cleanSpecs[k] = String(v).trim()
    }

    const payload = {
      brand_id: form.brand_id,
      name: form.name.trim(),
      slug: form.slug.trim() || autoSlug(form.name),
      short_desc: form.short_desc.trim() || null,
      long_desc: form.long_desc.trim() || null,
      warranty_months: Number(form.warranty_months) || 12,
      is_featured: form.is_featured,
      is_bestseller: form.is_bestseller,
      release_date: form.release_date || null,
      full_specs: Object.keys(cleanSpecs).length ? cleanSpecs : null,
    }

    const { error: updErr } = await supabase
      .from('products')
      .update(payload)
      .eq('id', editingId)

    if (updErr) {
      setSaving(false)
      return showToast(updErr.message || 'Failed to update product', 'error')
    }

    // Replace variants
    // First delete existing, then insert new
    await supabase.from('product_variants').delete().eq('product_id', editingId)

    const variantRows = editVariants.map(v => ({
      product_id: editingId,
      variant_name: `${form.name.trim()} ${v.color} ${v.ram_gb}/${v.rom_gb}`.trim(),
      color: v.color.trim(),
      ram_gb: Number(v.ram_gb),
      rom_gb: Number(v.rom_gb),
      mrp_bdt: Number(v.mrp_bdt),
      buy_price_bdt: Number(v.buy_price_bdt),
      compare_price_bdt: v.compare_price_bdt ? Number(v.compare_price_bdt) : null,
      image_url: v.image_url.trim() || null,
      is_default: v.is_default,
    }))

    const { error: varErr } = await supabase.from('product_variants').insert(variantRows)
    setSaving(false)

    if (varErr) return showToast(varErr.message || 'Failed to save variants', 'error')

    showToast('Product updated!')
    cancelEdit()
    loadProducts()
  }

  // ── Delete product ──
  async function deleteProduct(id) {
    if (!confirm('Delete this product and all its variants?')) return
    // Delete variants first
    await supabase.from('product_variants').delete().eq('product_id', id)
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      if (/permission denied/i.test(error.message || '')) {
        return showToast('Permission denied. Run supabase/006_grant_admin_permissions.sql in Supabase SQL Editor.', 'error')
      }
      return showToast(error.message, 'error')
    }
    showToast('Product deleted')
    loadProducts()
  }

  function cancelEdit() {
    setEditingId(null)
    setEditVariants([])
    setForm(emptyForm())
    setVariants([emptyVariant()])
    setTab('all')
  }

  // ── Edit variant helpers ──
  function addEditVariant() {
    setEditVariants(v => [...v, emptyVariant()])
  }

  function removeEditVariant(i) {
    setEditVariants(v => v.filter((_, idx) => idx !== i))
  }

  function updateEditVariant(i, field, value) {
    setEditVariants(v => v.map((row, idx) => idx === i ? { ...row, [field]: value } : row))
  }

  function setEditDefaultVariant(i) {
    setEditVariants(v => v.map((row, idx) => ({ ...row, is_default: idx === i })))
  }

  // ── Filtered products ──
  const filtered = products.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.brand_name || '').toLowerCase().includes(q) ||
      (p.slug || '').toLowerCase().includes(q)
    )
  })

  const isEditing = editingId !== null
  const activeVariants = isEditing ? editVariants : variants

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === 'error'
            ? 'bg-[#F8717120] text-[#F87171] border-[#F8717150]'
            : 'bg-[#34D39920] text-[#34D399] border-[#34D39950]'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#E5E7EB]">Products</h1>
          <p className="text-xs text-[#6B7280]">Brand → Model → Variant hierarchy</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn text-xs px-3 py-1.5 ${tab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setTab('all'); if (isEditing) cancelEdit() }}
          >
            All Products
          </button>
          <button
            className={`btn text-xs px-3 py-1.5 ${tab === 'new' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setTab('new'); setFormErrors({}) }}
          >
            {isEditing ? 'Edit Product' : '+ New Product'}
          </button>
        </div>
      </div>

      {/* ── ALL PRODUCTS TAB ── */}
      {tab === 'all' && (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="card p-3">
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">Total Products</p>
              <p className="text-xl font-bold text-[#E5E7EB] mt-0.5">{products.length}</p>
            </div>
            <div className="card p-3">
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">Featured</p>
              <p className="text-xl font-bold text-[#38bdf8] mt-0.5">{products.filter(p => p.is_featured).length}</p>
            </div>
            <div className="card p-3">
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">Bestsellers</p>
              <p className="text-xl font-bold text-[#34d399] mt-0.5">{products.filter(p => p.is_bestseller).length}</p>
            </div>
            <div className="card p-3">
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">Total Variants</p>
              <p className="text-xl font-bold text-[#E5E7EB] mt-0.5">
                {products.reduce((acc, p) => acc + (p.total_stock_count || 0), 0)}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              className="input pl-9 pr-9 w-full"
              placeholder="Search by name, brand, or slug…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#E5E7EB]" onClick={() => setSearch('')}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Product grid */}
          {loadingProducts && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loadingProducts && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1E2A3A] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <p className="text-sm text-[#9CA3AF]">No products found</p>
            </div>
          )}

          {!loadingProducts && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(p => (
                <div key={p.id} className="card border border-[#1E3A5F] overflow-hidden flex flex-col">
                  {/* Image */}
                  <div className="relative h-36 bg-[#1E2A3A] flex items-center justify-center">
                    {p.primary_image_url ? (
                      <img src={p.primary_image_url} alt={p.name} className="h-full w-full object-contain p-2" />
                    ) : (
                      <svg className="w-10 h-10 text-[#1E3A5F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                      </svg>
                    )}
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {p.is_featured && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#38bdf820] text-[#38bdf8] border border-[#38bdf840]">FEATURED</span>
                      )}
                      {p.is_bestseller && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#34d39920] text-[#34d399] border border-[#34d39940]">BESTSELLER</span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 flex flex-col gap-1.5 flex-1">
                    <p className="text-[10px] text-[#38bdf8] font-medium uppercase tracking-wider">{p.brand_name}</p>
                    <p className="text-sm font-semibold text-[#E5E7EB] leading-tight line-clamp-2">{p.name}</p>
                    {p.short_desc && <p className="text-[11px] text-[#6B7280] line-clamp-1">{p.short_desc}</p>}

                    {/* Variant pills */}
                    {p.available_colors && p.available_colors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.available_colors.slice(0, 3).map(c => (
                          <span key={c} className="px-1.5 py-0.5 rounded text-[10px] bg-[#1E2A3A] text-[#9CA3AF] border border-[#1E3A5F]">{c}</span>
                        ))}
                        {p.available_colors.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] text-[#6B7280]">+{p.available_colors.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Price range */}
                    <div className="mt-auto pt-2 border-t border-[#1E3A5F] flex items-center justify-between">
                      <div>
                        {p.min_price_bdt && p.max_price_bdt && p.min_price_bdt !== p.max_price_bdt ? (
                          <p className="text-xs text-[#9CA3AF]">৳{p.min_price_bdt.toLocaleString()} – ৳{p.max_price_bdt.toLocaleString()}</p>
                        ) : p.min_price_bdt ? (
                          <p className="text-xs font-semibold text-[#34d399]">৳{p.min_price_bdt.toLocaleString()}</p>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-[#6B7280]">{p.total_stock_count || 0} in stock</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <button
                        className="btn btn-sm flex-1 justify-center bg-[#1E2A3A] text-[#9CA3AF] border border-[#1E3A5F] hover:border-[#38bdf8]/50 hover:text-[#38bdf8] text-xs"
                        onClick={() => startEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm text-[#f87171] hover:bg-[#f8717120] px-2"
                        onClick={() => deleteProduct(p.id)}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── NEW / EDIT PRODUCT TAB ── */}
      {tab === 'new' && (
        <form
          onSubmit={isEditing ? handleUpdate : handleCreate}
          className="space-y-5 max-w-5xl"
        >
          {/* Product info card */}
          <div className="card p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[#E5E7EB] border-b border-[#1E3A5F] pb-2">
              {isEditing ? `Editing: ${form.name}` : 'New Product'}
            </h2>

            {/* Brand + Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Brand *</label>
                <select
                  className={`input ${formErrors.brand_id ? 'border-[#f87171]' : ''}`}
                  value={form.brand_id}
                  onChange={e => { setForm(f => ({ ...f, brand_id: e.target.value })); setFormErrors(er => ({ ...er, brand_id: '' })) }}
                >
                  <option value="">Select brand</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {formErrors.brand_id && <p className="mt-1 text-xs text-[#f87171]">{formErrors.brand_id}</p>}
              </div>
              <div>
                <label className="label">Product Name *</label>
                <input
                  type="text"
                  className={`input ${formErrors.name ? 'border-[#f87171]' : ''}`}
                  placeholder="e.g. Galaxy S24 Ultra"
                  value={form.name}
                  onChange={e => {
                    setForm(f => ({ ...f, name: e.target.value, slug: f.slug || autoSlug(e.target.value) }))
                    setFormErrors(er => ({ ...er, name: '' }))
                  }}
                />
                {formErrors.name && <p className="mt-1 text-xs text-[#f87171]">{formErrors.name}</p>}
              </div>
            </div>

            {/* Slug */}
            <div>
              <label className="label">Slug</label>
              <input
                type="text"
                className={`input font-mono ${formErrors.slug ? 'border-[#f87171]' : ''}`}
                placeholder="auto-generated from name"
                value={form.slug}
                onChange={e => { setForm(f => ({ ...f, slug: e.target.value })); setFormErrors(er => ({ ...er, slug: '' })) }}
              />
              {formErrors.slug && <p className="mt-1 text-xs text-[#f87171]">{formErrors.slug}</p>}
            </div>

            {/* Short desc + Warranty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Short Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="One-liner for cards"
                  value={form.short_desc}
                  onChange={e => setForm(f => ({ ...f, short_desc: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Warranty (months)</label>
                <input
                  type="number"
                  className="input"
                  min="0"
                  placeholder="12"
                  value={form.warranty_months}
                  onChange={e => setForm(f => ({ ...f, warranty_months: e.target.value }))}
                />
              </div>
            </div>

            {/* Long desc */}
            <div>
              <label className="label">Long Description</label>
              <textarea
                rows={3}
                className="input resize-none"
                placeholder="Full product description…"
                value={form.long_desc}
                onChange={e => setForm(f => ({ ...f, long_desc: e.target.value }))}
              />
            </div>

            {/* Release date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Release Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.release_date}
                  onChange={e => setForm(f => ({ ...f, release_date: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-6 pt-5">
                <label className="flex items-center gap-2 text-xs text-[#9CA3AF] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                    className="accent-[#38bdf8] w-4 h-4"
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-xs text-[#9CA3AF] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_bestseller}
                    onChange={e => setForm(f => ({ ...f, is_bestseller: e.target.checked }))}
                    className="accent-[#34d399] w-4 h-4"
                  />
                  Bestseller
                </label>
              </div>
            </div>
          </div>

          {/* Variants card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E3A5F] pb-2">
              <h2 className="text-sm font-semibold text-[#E5E7EB]">Variants</h2>
              <button
                type="button"
                onClick={isEditing ? addEditVariant : addVariant}
                className="btn-secondary btn-sm text-xs"
              >
                + Add Variant
              </button>
            </div>

            {formErrors.variants && (
              <div className="px-3 py-2 rounded bg-[#f8717120] border border-[#f8717140] text-xs text-[#f87171]">
                {formErrors.variants}
              </div>
            )}

            {/* Variant table header */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-1">
              <div className="col-span-1 text-[10px] text-[#6B7280] uppercase tracking-wider flex items-center">Default</div>
              <div className="col-span-2 text-[10px] text-[#6B7280] uppercase tracking-wider flex items-center">Color</div>
              <div className="col-span-1 text-[10px] text-[#6B7280] uppercase tracking-wider flex items-center">RAM</div>
              <div className="col-span-1 text-[10px] text-[#6B7280] uppercase tracking-wider flex items-center">ROM</div>
              <div className="col-span-2 text-[10px] text-[#6B7280] uppercase tracking-wider flex items-center">MRP (৳)</div>
              <div className="col-span-2 text-[10px] text-[#6B7280] uppercase tracking-wider flex items-center">Buy Price (৳)</div>
              <div className="col-span-2 text-[10px] text-[#6B7280] uppercase tracking-wider flex items-center">Compare (৳)</div>
              <div className="col-span-1 text-[10px] text-[#6B7280] uppercase tracking-wider flex items-center"></div>
            </div>

            {/* Variant rows */}
            <div className="space-y-3">
              {activeVariants.map((v, i) => (
                <div key={i} className="relative">
                  {/* Mobile label */}
                  <div className="sm:hidden text-[10px] text-[#6B7280] uppercase tracking-wider mb-1">Variant {i + 1}</div>

                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-start">
                    {/* Default radio */}
                    <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
                      <input
                        type="radio"
                        name="default-variant"
                        checked={v.is_default}
                        onChange={() => isEditing ? setEditDefaultVariant(i) : setDefaultVariant(i)}
                        className="accent-[#38bdf8] w-4 h-4"
                      />
                      <span className="text-[10px] text-[#6B7280] sm:block hidden">Default</span>
                    </div>

                    {/* Color */}
                    <div className="col-span-2 sm:col-span-2">
                      <input
                        type="text"
                        className={`input text-sm ${formErrors[`v_${i}_color`] ? 'border-[#f87171]' : ''}`}
                        placeholder="Black"
                        value={v.color}
                        onChange={e => { isEditing ? updateEditVariant(i, 'color', e.target.value) : updateVariant(i, 'color', e.target.value); setFormErrors(er => ({ ...er, [`v_${i}_color`]: '' })) }}
                      />
                      {formErrors[`v_${i}_color`] && <p className="mt-0.5 text-[10px] text-[#f87171]">{formErrors[`v_${i}_color`]}</p>}
                    </div>

                    {/* RAM */}
                    <div className="col-span-2 sm:col-span-1">
                      <input
                        type="text"
                        className={`input text-sm ${formErrors[`v_${i}_ram`] ? 'border-[#f87171]' : ''}`}
                        placeholder="8"
                        value={v.ram_gb}
                        onChange={e => { isEditing ? updateEditVariant(i, 'ram_gb', e.target.value) : updateVariant(i, 'ram_gb', e.target.value); setFormErrors(er => ({ ...er, [`v_${i}_ram`]: '' })) }}
                      />
                      <p className="text-[9px] text-[#6B7280] mt-0.5">GB RAM</p>
                      {formErrors[`v_${i}_ram`] && <p className="mt-0.5 text-[10px] text-[#f87171]">{formErrors[`v_${i}_ram`]}</p>}
                    </div>

                    {/* ROM */}
                    <div className="col-span-2 sm:col-span-1">
                      <input
                        type="text"
                        className={`input text-sm ${formErrors[`v_${i}_rom`] ? 'border-[#f87171]' : ''}`}
                        placeholder="128"
                        value={v.rom_gb}
                        onChange={e => { isEditing ? updateEditVariant(i, 'rom_gb', e.target.value) : updateVariant(i, 'rom_gb', e.target.value); setFormErrors(er => ({ ...er, [`v_${i}_rom`]: '' })) }}
                      />
                      <p className="text-[9px] text-[#6B7280] mt-0.5">GB ROM</p>
                      {formErrors[`v_${i}_rom`] && <p className="mt-0.5 text-[10px] text-[#f87171]">{formErrors[`v_${i}_rom`]}</p>}
                    </div>

                    {/* MRP */}
                    <div className="col-span-2 sm:col-span-2">
                      <input
                        type="number"
                        className={`input text-sm ${formErrors[`v_${i}_mrp`] ? 'border-[#f87171]' : ''}`}
                        placeholder="0"
                        min="0"
                        value={v.mrp_bdt}
                        onChange={e => { isEditing ? updateEditVariant(i, 'mrp_bdt', e.target.value) : updateVariant(i, 'mrp_bdt', e.target.value); setFormErrors(er => ({ ...er, [`v_${i}_mrp`]: '' })) }}
                      />
                      <p className="text-[9px] text-[#6B7280] mt-0.5">MRP (৳)</p>
                      {formErrors[`v_${i}_mrp`] && <p className="mt-0.5 text-[10px] text-[#f87171]">{formErrors[`v_${i}_mrp`]}</p>}
                    </div>

                    {/* Buy Price */}
                    <div className="col-span-2 sm:col-span-2">
                      <input
                        type="number"
                        className={`input text-sm ${formErrors[`v_${i}_buy`] ? 'border-[#f87171]' : ''}`}
                        placeholder="0"
                        min="0"
                        value={v.buy_price_bdt}
                        onChange={e => { isEditing ? updateEditVariant(i, 'buy_price_bdt', e.target.value) : updateVariant(i, 'buy_price_bdt', e.target.value); setFormErrors(er => ({ ...er, [`v_${i}_buy`]: '' })) }}
                      />
                      <p className="text-[9px] text-[#6B7280] mt-0.5">Buy Price (৳)</p>
                      {formErrors[`v_${i}_buy`] && <p className="mt-0.5 text-[10px] text-[#f87171]">{formErrors[`v_${i}_buy`]}</p>}
                    </div>

                    {/* Compare price */}
                    <div className="col-span-2 sm:col-span-2">
                      <input
                        type="number"
                        className="input text-sm"
                        placeholder="Optional"
                        min="0"
                        value={v.compare_price_bdt}
                        onChange={e => { isEditing ? updateEditVariant(i, 'compare_price_bdt', e.target.value) : updateVariant(i, 'compare_price_bdt', e.target.value) }}
                      />
                      <p className="text-[9px] text-[#6B7280] mt-0.5">Compare (৳)</p>
                    </div>

                    {/* Remove */}
                    <div className="col-span-2 sm:col-span-1 flex items-start pt-1">
                      {activeVariants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => isEditing ? removeEditVariant(i) : removeVariant(i)}
                          className="btn-ghost btn-sm text-[#f87171] hover:bg-[#f8717120] p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Image URL row */}
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-12 gap-2 items-center">
                    <div className="col-span-1 hidden sm:block" />
                    <div className="sm:col-span-11 col-span-2">
                      <input
                        type="text"
                        className="input text-sm"
                        placeholder="Image URL (https://…)"
                        value={v.image_url}
                        onChange={e => { isEditing ? updateEditVariant(i, 'image_url', e.target.value) : updateVariant(i, 'image_url', e.target.value) }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form errors */}
          {formErrors._form && (
            <div className="px-4 py-3 rounded-lg bg-[#f8717120] border border-[#f8717140] text-sm text-[#f87171]">
              {formErrors._form}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-4">
            {isEditing && (
              <button type="button" className="btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEditing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
