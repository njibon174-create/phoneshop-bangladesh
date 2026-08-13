import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import EditPhone from './EditPhone'
import SellPhone from './SellPhone'
import BarcodeScanner from '../../components/admin/BarcodeScanner'

const STATUS_CONFIG = {
  in_stock: {
    label: 'In Stock',
    dot: 'bg-[#39FF88]',
    bg: 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]',
    border: 'border-[#39FF8850]',
  },
  sold: {
    label: 'Sold',
    dot: 'bg-[#60A5FA]',
    bg: 'bg-[#60A5FA20] text-[#60A5FA] border-[#60A5FA50]',
    border: 'border-[#60A5FA50]',
  },
  returned: {
    label: 'Returned',
    dot: 'bg-[#FBBF24]',
    bg: 'bg-[#FBBF2420] text-[#FBBF24] border-[#FBBF2450]',
    border: 'border-[#FBBF2450]',
  },
}

function formatCurrency(num) {
  return new Intl.NumberFormat('en-BD').format(num || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Skeleton row for table
function SkeletonRow() {
  return (
    <tr className="border-b border-[#1E3A5F]">
      {[90, 100, 140, 80, 80, 80, 90, 100].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-[#1E2A3A] animate-pulse" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

// Skeleton card
function SkeletonCard() {
  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="h-4 w-20 rounded bg-[#1E2A3A] animate-pulse" />
          <div className="h-3 w-28 rounded bg-[#1E2A3A] animate-pulse" />
        </div>
        <div className="h-5 w-16 rounded-full bg-[#1E2A3A] animate-pulse" />
      </div>
      <div className="h-5 w-36 rounded bg-[#1E2A3A] animate-pulse" />
      <div className="flex gap-4">
        {[60, 60, 60].map((w, i) => <div key={i} className="space-y-1"><div className="h-3 w-8 rounded bg-[#1E2A3A] animate-pulse" /><div className="h-4 w-16 rounded bg-[#1E2A3A] animate-pulse" /></div>)}
      </div>
      <div className="flex gap-2 pt-1 border-t border-[#1E3A5F]">
        <div className="h-7 w-full rounded-lg bg-[#1E2A3A] animate-pulse" />
        <div className="h-7 w-16 rounded-lg bg-[#1E2A3A] animate-pulse" />
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [phones, setPhones] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('in_stock')
  const [brandFilter, setBrandFilter] = useState('all')
  const [brands, setBrands] = useState([])
  const [editPhone, setEditPhone] = useState(null)
  const [sellPhone, setSellPhone] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState('cards') // default: cards
  const [toast, setToast] = useState(null)
  const [showScanner, setShowScanner] = useState(false)

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  async function fetchPhones() {
    setLoading(true)
    const { data } = await supabase
      .from('phones')
      .select('*')
      .order('created_at', { ascending: false })
    setPhones(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchPhones() }, [])

  useEffect(() => {
    supabase.from('brands').select('name').order('name').then(({ data }) => {
      if (data) setBrands(data.map(b => b.name))
    })
  }, [])

  async function handleDelete(phone) {
    setDeleting(true)
    const { error } = await supabase.from('phones').delete().eq('id', phone.id)
    setDeleting(false)
    setDeleteConfirm(null)
    if (error) {
      showToast('Delete failed: ' + error.message, 'error')
    } else {
      showToast('Phone deleted.')
      fetchPhones()
    }
  }

  function handleSaleSuccess() {
    setSellPhone(null)
    showToast('Sale completed successfully!')
    fetchPhones()
  }

  function handleScanResult(code) {
    setShowScanner(false)
    const cleaned = (code || '').replace(/\D/g, '')
    if (!cleaned) {
      setSearch(code)
      return
    }
    // Try to find exact IMEI match
    const match = phones.find(p => p.imei.replace(/\D/g, '') === cleaned)
    if (match) {
      if (match.status === 'in_stock') {
        setSellPhone(match)
        showToast(`Found ${match.brand} ${match.model} — opening sale form.`)
      } else if (match.status === 'sold') {
        showToast(`This phone is already sold.`, 'error')
      } else if (match.status === 'returned') {
        showToast(`This phone is marked returned.`, 'error')
      }
    } else {
      // Fallback: search by substring
      setSearch(cleaned)
      showToast(`No exact match — narrowed search to "${cleaned}".`)
    }
  }

  const filtered = phones.filter(p => {
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    const matchBrand  = brandFilter === 'all' || p.brand === brandFilter
    const q = search.trim().toLowerCase()
    const matchSearch = !q
      || p.imei.toLowerCase().includes(q)
      || (p.model || '').toLowerCase().includes(q)
    return matchStatus && matchBrand && matchSearch
  })

  const inStock = phones.filter(p => p.status === 'in_stock')
  const totalInStock     = inStock.length
  const totalInvestment  = inStock.reduce((s, p) => s + Number(p.buy_price || 0), 0)
  const isEmpty          = !loading && filtered.length === 0
  const isSearchActive   = search || statusFilter !== 'in_stock' || brandFilter !== 'all'

  return (
    <div className="space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === 'error'
            ? 'bg-[#F8717120] text-[#F87171] border-[#F8717150]'
            : 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="stat-card">
          <span className="stat-label">In Stock</span>
          <span className="stat-value">{totalInStock}</span>
        </div>
        <div className="stat-card sm:col-span-2">
          <span className="stat-label">Total Investment</span>
          <span className="stat-value">৳{formatCurrency(totalInvestment)}</span>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            className="input pl-9 pr-9"
            placeholder="Search IMEI or model…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#E5E7EB] p-0.5"
              onClick={() => setSearch('')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        <button
          className="btn-secondary px-3"
          onClick={() => setShowScanner(true)}
          title="Scan barcode"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>

        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="sold">Sold</option>
          <option value="returned">Returned</option>
        </select>

        <select className="input w-auto" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
          <option value="all">All Brands</option>
          {brands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-[#1E3A5F] overflow-hidden shrink-0">
          <button
            className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === 'table' ? 'bg-[#1E2A3A] text-[#E5E7EB]' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'}`}
            onClick={() => setViewMode('table')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18"/></svg>
          </button>
          <button
            className={`px-3 py-2 text-xs font-medium transition-colors border-l border-[#1E3A5F] ${viewMode === 'cards' ? 'bg-[#1E2A3A] text-[#E5E7EB]' : 'text-[#9CA3AF] hover:text-[#E5E7EB]'}`}
            onClick={() => setViewMode('cards')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
          </button>
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-[#9CA3AF]">
          {isEmpty
            ? isSearchActive ? 'No phones match your filters' : 'No phones in inventory'
            : `Showing ${filtered.length} of ${phones.length} phone${phones.length !== 1 ? 's' : ''}`
          }
        </p>
      )}

      {/* ─── TABLE VIEW ─── */}
      {viewMode === 'table' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="border-b border-[#1E3A5F]">
                <th>Brand</th>
                <th>Model</th>
                <th>IMEI</th>
                <th>Buy Price</th>
                <th>MRP</th>
                <th>Status</th>
                <th>Added Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

              {!loading && phones.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#1E2A3A] flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#E5E7EB]">No phones in inventory yet</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">Click <span className="font-medium text-[#9CA3AF]">Add Phone</span> to get started</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && phones.length > 0 && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#1E2A3A] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#E5E7EB]">No phones match your filters</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">Try adjusting search or filter criteria</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.map(phone => (
                <tr
                  key={phone.id}
                  className="border-b border-[#1E3A5F] last:border-0 transition-colors duration-75 hover:bg-[#1E2A3A]/50"
                >
                  <td className="font-medium text-[#E5E7EB]">{phone.brand}</td>
                  <td className="text-[#9CA3AF]">{phone.model}</td>
                  <td className="font-mono text-xs text-[#9CA3AF] tracking-wider">{phone.imei}</td>
                  <td className="text-[#E5E7EB]">৳{formatCurrency(phone.buy_price)}</td>
                  <td className="text-[#E5E7EB]">৳{formatCurrency(phone.mrp)}</td>
                  <td>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[phone.status]?.bg || 'bg-[#1E2A3A] text-[#E5E7EB] border-[#1E3A5F]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[phone.status]?.dot || 'bg-slate-400'}`} />
                      {STATUS_CONFIG[phone.status]?.label || phone.status}
                    </span>
                  </td>
                  <td className="text-[#9CA3AF] text-xs">{formatDate(phone.created_at)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {phone.status === 'in_stock' && (
                        <button
                          className="btn btn-sm bg-[#39FF8820] text-[#39FF88] border border-[#39FF8850] hover:bg-[#39FF8830]"
                          onClick={() => setSellPhone(phone)}
                          title="Sell"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                          </svg>
                          Sell
                        </button>
                      )}
                      {phone.status === 'in_stock' && (
                        <button
                          className="btn-ghost btn-sm text-[#9CA3AF] hover:text-[#E5E7EB] hover:bg-[#1E2A3A]"
                          onClick={() => setEditPhone(phone)}
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                      )}
                      {phone.status === 'in_stock' ? (
                        <button
                          className="btn-ghost btn-sm text-[#F87171] hover:text-[#F87171] hover:bg-[#F8717120]"
                          onClick={() => setDeleteConfirm(phone)}
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      ) : (
                        <div className="w-7 h-7" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── CARD VIEW ─── */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}

          {!loading && phones.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1E2A3A] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#E5E7EB]">No phones in inventory yet</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Click <span className="font-medium text-[#9CA3AF]">Add Phone</span> to get started</p>
              </div>
            </div>
          )}

          {!loading && phones.length > 0 && filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#1E2A3A] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-[#E5E7EB]">No phones match your filters</p>
                <p className="text-xs text-[#9CA3AF] mt-1">Try adjusting search or filter criteria</p>
              </div>
            </div>
          )}

          {!loading && filtered.map(phone => (
            <div key={phone.id} className="card p-4 flex flex-col gap-3 border border-[#1E3A5F] hover:border-[#39FF8850] transition-colors">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-[#E5E7EB] truncate">{phone.brand}</p>
                  <p className="text-sm text-[#9CA3AF] truncate">{phone.model}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CONFIG[phone.status]?.bg || 'bg-[#1E2A3A] text-[#E5E7EB] border-[#1E3A5F]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[phone.status]?.dot || 'bg-slate-400'}`} />
                  {STATUS_CONFIG[phone.status]?.label || phone.status}
                </span>
              </div>

              {/* IMEI */}
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-[#9CA3AF] bg-[#1E2A3A] px-2 py-1 rounded border border-[#1E3A5F] truncate flex-1 tracking-wider">
                  {phone.imei}
                </span>
              </div>

              {/* Prices + Date */}
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-xs text-[#9CA3AF] font-medium">Buy Price</p>
                  <p className="text-sm font-semibold text-[#E5E7EB]">৳{formatCurrency(phone.buy_price)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] font-medium">MRP</p>
                  <p className="text-sm font-semibold text-[#E5E7EB]">৳{formatCurrency(phone.mrp)}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-[#9CA3AF] font-medium">Added</p>
                  <p className="text-xs font-medium text-[#9CA3AF]">{formatDate(phone.created_at)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#1E3A5F]">
                {phone.status === 'in_stock' && (
                  <button
                    className="btn btn-sm flex-1 justify-center bg-[#39FF8820] text-[#39FF88] border border-[#39FF8850] hover:bg-[#39FF8830]"
                    onClick={() => setSellPhone(phone)}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"/>
                    </svg>
                    Sell
                  </button>
                )}
                {phone.status === 'in_stock' && (
                  <button
                    className="btn-secondary btn-sm flex-1 justify-center"
                    onClick={() => setEditPhone(phone)}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                  </button>
                )}
                {phone.status === 'in_stock' ? (
                  <button
                    className="btn-danger btn-sm justify-center"
                    onClick={() => setDeleteConfirm(phone)}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Delete
                  </button>
                ) : (
                  <div className="px-3 py-1.5 text-xs text-[#9CA3AF] rounded-lg border border-[#1E3A5F] text-center">
                    Sold
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── EDIT MODAL ─── */}
      {editPhone && (
        <div className="fixed inset-0 z-40 flex items-start sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="card w-full max-w-lg p-6 shadow-2xl my-4 sm:my-8">
            <h2 className="text-base font-semibold text-[#E5E7EB] mb-4">Edit Phone</h2>
            <EditPhone
              phone={editPhone}
              brands={brands}
              onSuccess={({ updatedCount }) => {
                setEditPhone(null)
                showToast(`Updated ${updatedCount} phone${updatedCount !== 1 ? 's' : ''} successfully.`)
                fetchPhones()
              }}
              onCancel={() => setEditPhone(null)}
            />
          </div>
        </div>
      )}

      {/* ─── SELL MODAL ─── */}
      {sellPhone && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-semibold text-[#E5E7EB] mb-4">Sell Phone</h2>
            <SellPhone
              phone={sellPhone}
              onSuccess={handleSaleSuccess}
              onCancel={() => setSellPhone(null)}
            />
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="card w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#F8717120] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-[#F87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <h2 className="text-base font-semibold text-[#E5E7EB]">Delete Phone?</h2>
              <p className="text-sm text-[#9CA3AF] mt-1">
                IMEI <span className="font-mono text-[#E5E7EB]">{deleteConfirm.imei}</span> ({deleteConfirm.brand} {deleteConfirm.model}) will be permanently removed.
              </p>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                className="btn bg-[#F8717120] text-[#F87171] border border-[#F8717150] hover:bg-[#F8717130] disabled:opacity-40"
                disabled={deleting}
                onClick={() => handleDelete(deleteConfirm)}
              >
                {deleting ? 'Deleting…' : 'Delete Phone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BARCODE SCANNER MODAL ─── */}
      {showScanner && (
        <BarcodeScanner
          title="Scan IMEI Barcode"
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
