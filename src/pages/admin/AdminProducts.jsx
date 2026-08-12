import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminLayout } from '../../components/admin/AdminLayout'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, Star, Eye, EyeOff, Search } from 'lucide-react'

function formatBDT(n) {
  return '৳' + Number(n || 0).toLocaleString('en-IN')
}

export function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | active | inactive | featured

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, brand_name, price_bdt, compare_price_bdt, stock_count, is_active, is_featured, is_bestseller, condition, warranty_months')
      .order('created_at', { ascending: false })
    setProducts(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = products.filter((p) => {
    if (search && !`${p.name} ${p.brand_name} ${p.slug}`.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'active' && !p.is_active) return false
    if (filter === 'inactive' && p.is_active) return false
    if (filter === 'featured' && !p.is_featured) return false
    return true
  })

  async function toggleField(id, field, value) {
    await supabase.from('products').update({ [field]: value }).eq('id', id)
    load()
  }

  async function deleteProduct(p) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    await supabase.from('products').delete().eq('id', p.id)
    load()
  }

  return (
    <AdminLayout
      title="Products"
      subtitle={`Manage all phones listed on the storefront (${products.length} total)`}
      actions={
        <Link to="/admin/products/new" className="btn-primary inline-flex items-center gap-2 text-sm py-2 px-4">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      }
    >
      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-elev-bg border border-border rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-muted-text" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, or slug..."
            className="flex-1 bg-transparent text-sm text-main-text outline-none placeholder:text-muted-text"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {[
            ['all', 'All'],
            ['active', 'Active'],
            ['inactive', 'Inactive'],
            ['featured', 'Featured'],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 text-xs rounded-lg ${
                filter === k ? 'bg-neon-green/20 text-neon-green border border-neon-green/30' :
                'bg-elev-bg text-sec-text border border-border hover:text-main-text'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 card">
          <p className="text-5xl mb-3">📱</p>
          <p className="text-sec-text">No products match.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-elev-bg">
              <tr className="text-left text-xs uppercase tracking-wider text-muted-text">
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-elev-bg/50">
                  <td className="px-4 py-3">
                    <Link to={`/product/${p.slug}`} target="_blank" className="font-medium text-main-text hover:text-neon-green">{p.name}</Link>
                    <p className="text-[10px] text-muted-text">{p.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sec-text">{p.brand_name}</td>
                  <td className="px-4 py-3 text-right">
                    <p className="font-semibold text-main-text">{formatBDT(p.price_bdt)}</p>
                    {p.compare_price_bdt > p.price_bdt && (
                      <p className="text-[10px] text-textSubtle line-through">{formatBDT(p.compare_price_bdt)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                      p.stock_count === 0 ? 'bg-error/20 text-error' :
                      p.stock_count <= 5 ? 'bg-warning/20 text-warning' :
                      'bg-success/20 text-success'
                    }`}>
                      {p.stock_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleField(p.id, 'is_active', !p.is_active)}
                        title={p.is_active ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded ${p.is_active ? 'bg-success/20 text-success' : 'bg-elev-bg text-muted-text'}`}
                      >
                        {p.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => toggleField(p.id, 'is_featured', !p.is_featured)}
                        title="Toggle featured"
                        className={`p-1.5 rounded ${p.is_featured ? 'bg-neon-green/20 text-neon-green' : 'bg-elev-bg text-muted-text'}`}
                      >
                        <Star className={`w-3.5 h-3.5 ${p.is_featured ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => toggleField(p.id, 'is_bestseller', !p.is_bestseller)}
                        title="Toggle bestseller"
                        className={`px-2 py-1 rounded text-[10px] font-bold ${p.is_bestseller ? 'bg-neon-blue/20 text-neon-blue' : 'bg-elev-bg text-muted-text'}`}
                      >
                        BEST
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link to={`/admin/products/${p.id}`} className="btn-secondary p-2" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button onClick={() => deleteProduct(p)} className="btn-ghost p-2 text-danger hover:bg-danger/10" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  )
}