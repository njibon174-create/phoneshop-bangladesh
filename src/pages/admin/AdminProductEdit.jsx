import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { Save, ArrowLeft, Trash2 } from 'lucide-react'

export function AdminProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [brands, setBrands] = useState([])
  const [product, setProduct] = useState({
    brand_id: '',
    name: '',
    slug: '',
    variant: '',
    sku: '',
    price_bdt: 0,
    compare_price_bdt: 0,
    cost_bdt: 0,
    condition: 'new',
    warranty_months: 12,
    short_desc: '',
    long_desc: '',
    full_specs: {},
    is_active: true,
    is_featured: false,
    is_bestseller: false,
    primary_image_url: '',
    stock_count: 0,
  })
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: brandsData } = await supabase
        .from('brands')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('sort_order')
      if (!cancelled) setBrands(brandsData || [])

      if (isNew) {
        setProduct((p) => ({ ...p, brand_id: brandsData?.[0]?.id || '' }))
      } else {
        const { data: prod, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single()
        if (error) {
          setMsg({ type: 'error', text: 'Product not found' })
        } else if (!cancelled) {
          setProduct({
            ...prod,
            full_specs: prod.full_specs || {},
          })
        }
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [id, isNew])

  function update(k, v) {
    setProduct((p) => ({ ...p, [k]: v }))
  }

  function updateSpec(k, v) {
    setProduct((p) => ({ ...p, full_specs: { ...p.full_specs, [k]: v } }))
  }

  function autoSlug(name) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const slug = product.slug || autoSlug(product.name)
      const payload = {
        brand_id: product.brand_id,
        slug,
        name: product.name.trim(),
        variant: product.variant?.trim() || null,
        sku: product.sku?.trim() || null,
        price_bdt: Number(product.price_bdt) || 0,
        compare_price_bdt: product.compare_price_bdt ? Number(product.compare_price_bdt) : null,
        cost_bdt: product.cost_bdt ? Number(product.cost_bdt) : null,
        condition: product.condition,
        warranty_months: Number(product.warranty_months) || 12,
        short_desc: product.short_desc || null,
        long_desc: product.long_desc || null,
        full_specs: product.full_specs || {},
        is_active: product.is_active,
        is_featured: product.is_featured,
        is_bestseller: product.is_bestseller,
      }

      let savedId = id
      if (isNew) {
        const { data, error } = await supabase.from('products').insert(payload).select().single()
        if (error) throw error
        savedId = data.id
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) throw error
      }

      // Update inventory
      const invPayload = {
        product_id: savedId,
        stock_count: Number(product.stock_count) || 0,
        low_stock_at: 5,
      }
      await supabase.from('inventory').upsert(invPayload, { onConflict: 'product_id' })

      // Update primary image if changed
      if (product.primary_image_url) {
        await supabase.from('product_images').upsert({
          product_id: savedId,
          url: product.primary_image_url,
          alt_text: product.name,
          position: 0,
          is_primary: true,
        }, { onConflict: 'product_id,position' })
      }

      setMsg({ type: 'success', text: 'Saved!' })
      if (isNew) navigate(`/admin/products/${savedId}`, { replace: true })
    } catch (e) {
      setMsg({ type: 'error', text: e.message })
    } finally {
      setSaving(false)
    }
  }

  async function del() {
    if (!confirm('Delete this product permanently?')) return
    await supabase.from('products').delete().eq('id', id)
    navigate('/admin/products')
  }

  if (loading) return <AdminLayout title="Loading…"><div className="card p-8 text-center">Loading…</div></AdminLayout>

  return (
    <AdminLayout
      title={isNew ? 'Add Product' : 'Edit Product'}
      subtitle={isNew ? 'Add a new phone to your storefront' : product.name}
      actions={
        <Link to="/admin/products" className="btn-secondary inline-flex items-center gap-2 text-sm py-2 px-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4">Basic Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" required>
                <input type="text" value={product.name} onChange={(e) => { update('name', e.target.value); if (!product.slug || product.slug === autoSlug(product.name)) update('slug', autoSlug(e.target.value)) }} className="input" />
              </Field>
              <Field label="Slug" required>
                <input type="text" value={product.slug} onChange={(e) => update('slug', e.target.value)} className="input font-mono text-xs" placeholder="auto-generated" />
              </Field>
              <Field label="Variant">
                <input type="text" value={product.variant || ''} onChange={(e) => update('variant', e.target.value)} placeholder="e.g. 256GB Natural Titanium" className="input" />
              </Field>
              <Field label="SKU">
                <input type="text" value={product.sku || ''} onChange={(e) => update('sku', e.target.value)} placeholder="internal SKU" className="input font-mono text-xs" />
              </Field>
              <Field label="Brand" required>
                <select value={product.brand_id} onChange={(e) => update('brand_id', e.target.value)} className="input">
                  <option value="">Select a brand…</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
              <Field label="Condition">
                <select value={product.condition} onChange={(e) => update('condition', e.target.value)} className="input">
                  <option value="new">New</option>
                  <option value="refurbished">Refurbished</option>
                  <option value="used">Used</option>
                </select>
              </Field>
              <Field label="Warranty (months)">
                <input type="number" value={product.warranty_months} onChange={(e) => update('warranty_months', e.target.value)} className="input" min="0" />
              </Field>
              <Field label="Stock count">
                <input type="number" value={product.stock_count} onChange={(e) => update('stock_count', e.target.value)} className="input" min="0" />
              </Field>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Selling price (BDT)" required>
                <input type="number" value={product.price_bdt} onChange={(e) => update('price_bdt', e.target.value)} className="input" />
              </Field>
              <Field label="Compare price (BDT)" hint="Strike-through price">
                <input type="number" value={product.compare_price_bdt || ''} onChange={(e) => update('compare_price_bdt', e.target.value)} className="input" placeholder="optional" />
              </Field>
              <Field label="Cost price (BDT)" hint="For profit calc">
                <input type="number" value={product.cost_bdt || ''} onChange={(e) => update('cost_bdt', e.target.value)} className="input" placeholder="optional" />
              </Field>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4">Description</h2>
            <Field label="Short description (1 line, shown on cards)">
              <input type="text" value={product.short_desc || ''} onChange={(e) => update('short_desc', e.target.value)} className="input" placeholder="e.g. Apple A17 Pro, 6.7&quot; ProMotion OLED, Titanium body." />
            </Field>
            <Field label="Long description (full page)">
              <textarea value={product.long_desc || ''} onChange={(e) => update('long_desc', e.target.value)} rows={4} className="input resize-none mt-3" placeholder="Detailed marketing description…" />
            </Field>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4">Specifications</h2>
            <p className="text-xs text-sec-text mb-3">These show on the product detail page as Display / Performance / Camera / Battery / Build.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SpecField label="Display" value={product.full_specs.display} onChange={(v) => updateSpec('display', v)} placeholder='6.7" OLED' />
              <SpecField label="Chip" value={product.full_specs.chip} onChange={(v) => updateSpec('chip', v)} placeholder="Apple A17 Pro" />
              <SpecField label="RAM (GB)" value={product.full_specs.ram_gb} onChange={(v) => updateSpec('ram_gb', v ? Number(v) : undefined)} type="number" />
              <SpecField label="Storage (GB)" value={product.full_specs.storage_gb} onChange={(v) => updateSpec('storage_gb', v ? Number(v) : undefined)} type="number" />
              <SpecField label="Main camera" value={product.full_specs.rear_camera} onChange={(v) => updateSpec('rear_camera', v)} placeholder="48MP + 12MP + 12MP" />
              <SpecField label="Selfie camera" value={product.full_specs.front_camera} onChange={(v) => updateSpec('front_camera', v)} />
              <SpecField label="Battery (mAh)" value={product.full_specs.battery_mah} onChange={(v) => updateSpec('battery_mah', v ? Number(v) : undefined)} type="number" />
              <SpecField label="Charging (W)" value={product.full_specs.charging_w} onChange={(v) => updateSpec('charging_w', v ? Number(v) : undefined)} type="number" />
              <SpecField label="OS" value={product.full_specs.os} onChange={(v) => updateSpec('os', v)} placeholder="iOS 17" />
              <SpecField label="Weight (g)" value={product.full_specs.weight_g} onChange={(v) => updateSpec('weight_g', v ? Number(v) : undefined)} type="number" />
              <SpecField label="IP rating" value={product.full_specs.ip_rating} onChange={(v) => updateSpec('ip_rating', v)} placeholder="IP68" />
              <SpecField label="5G" value={product.full_specs['5g']} onChange={(v) => updateSpec('5g', v)} type="checkbox" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4">Image</h2>
            <Field label="Primary image URL">
              <input type="text" value={product.primary_image_url || ''} onChange={(e) => update('primary_image_url', e.target.value)} className="input font-mono text-xs" placeholder="https://…" />
            </Field>
            {product.primary_image_url && (
              <img src={product.primary_image_url} alt="" className="w-full aspect-square object-contain bg-elev-bg rounded-lg mt-3" />
            )}
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-4">Visibility</h2>
            <div className="space-y-2">
              {[
                ['is_active', 'Active on site', 'When off, hidden everywhere'],
                ['is_featured', 'Featured', 'Shows on homepage hero section'],
                ['is_bestseller', 'Bestseller', 'Shows in trending phones'],
              ].map(([k, l, hint]) => (
                <label key={k} className="flex items-center justify-between p-3 bg-elev-bg rounded-lg cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-main-text">{l}</p>
                    <p className="text-xs text-muted-text">{hint}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={product[k]}
                    onChange={(e) => update(k, e.target.checked)}
                    className="accent-neon-green w-5 h-5"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-main-text mb-3">Save</h2>
            {msg && (
              <p className={`text-sm mb-3 ${msg.type === 'error' ? 'text-danger' : 'text-success'}`}>{msg.text}</p>
            )}
            <button onClick={save} disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : (isNew ? 'Create Product' : 'Save Changes')}
            </button>
            {!isNew && (
              <button onClick={del} className="w-full mt-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg flex items-center justify-center gap-2 border border-danger/30">
                <Trash2 className="w-4 h-4" /> Delete Product
              </button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-sec-text mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-muted-text mt-1">{hint}</p>}
    </div>
  )
}

function SpecField({ label, value, onChange, type = 'text', placeholder }) {
  if (type === 'checkbox') {
    return (
      <label className="flex items-center justify-between p-3 bg-elev-bg rounded-lg">
        <span className="text-sm text-sec-text">{label}</span>
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="accent-neon-green w-4 h-4" />
      </label>
    )
  }
  return (
    <div>
      <label className="block text-xs font-medium text-sec-text mb-1.5">{label}</label>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input" />
    </div>
  )
}