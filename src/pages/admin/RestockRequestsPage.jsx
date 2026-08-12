import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, CheckCircle2, XCircle, Clock, ExternalLink, Search, Package, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUSES = [
  { id: 'pending', label: 'Pending', icon: Clock, color: '#FBBF24', bg: 'rgba(251,191,36,0.15)' },
  { id: 'notified', label: 'Notified', icon: CheckCircle2, color: '#00D4FF', bg: 'rgba(0,212,255,0.15)' },
  { id: 'fulfilled', label: 'Fulfilled', icon: CheckCircle2, color: '#00FF88', bg: 'rgba(0,255,136,0.15)' },
  { id: 'cancelled', label: 'Cancelled', icon: XCircle, color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function RestockRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('restock_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) {
        if (error.code === '42P01' || /does not exist/i.test(error.message || '')) {
          setRequests([])
        } else {
          console.error(error)
        }
      } else {
        setRequests(data || [])
      }
    } catch (e) {
      console.warn('Load failed:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function updateStatus(id, status) {
    setUpdating(id)
    try {
      const payload = { status }
      if (status === 'notified') payload.notified_at = new Date().toISOString()
      if (status === 'fulfilled') payload.fulfilled_at = new Date().toISOString()
      const { error } = await supabase
        .from('restock_requests')
        .update(payload)
        .eq('id', id)
      if (error) throw error
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, ...payload } : r))
    } catch (e) {
      alert('Update failed: ' + e.message)
    } finally {
      setUpdating(null)
    }
  }

  function callCustomer(r) {
    window.location.href = `tel:${r.customer_phone.replace(/\s+/g, '')}`
    if (r.status === 'pending') {
      updateStatus(r.id, 'notified')
    }
  }

  const counts = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    return acc
  }, {})

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (r.product_name || '').toLowerCase().includes(q) ||
        (r.customer_name || '').toLowerCase().includes(q) ||
        (r.customer_phone || '').toLowerCase().includes(q) ||
        (r.customer_email || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STATUSES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(statusFilter === s.id ? 'all' : s.id)}
            className="rounded-xl p-4 text-left transition-all border"
            style={{
              backgroundColor: '#111827',
              borderColor: statusFilter === s.id ? s.color : '#1E3A5F',
              boxShadow: statusFilter === s.id ? `0 0 20px ${s.color}30` : 'none',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: '#7EB8DA' }}>{s.label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{counts[s.id] || 0}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9CA3AF' }} />
          <input
            className="input pl-9 w-full"
            placeholder="Search by product, name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button onClick={load} className="btn-secondary text-sm py-2 px-3 inline-flex items-center gap-1">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {!loading && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-3" style={{ color: '#4A7A9B' }} />
          <p className="text-base" style={{ color: '#F0F8FF' }}>No restock requests</p>
          <p className="text-sm mt-1" style={{ color: '#7EB8DA' }}>
            When users click "Notify Me" on an out-of-stock phone, requests will appear here.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse" style={{ backgroundColor: '#111827', border: '1px solid #1E3A5F' }}>
            <div className="h-4 w-32 mb-3 rounded" style={{ backgroundColor: '#1E2A3A' }} />
            <div className="h-3 w-48 mb-2 rounded" style={{ backgroundColor: '#1E2A3A' }} />
            <div className="h-3 w-40 rounded" style={{ backgroundColor: '#1E2A3A' }} />
          </div>
        ))}

        {!loading && filtered.map((r) => {
          const status = STATUSES.find((s) => s.id === r.status) || STATUSES[0]
          return (
            <div key={r.id} className="card p-5" style={{ backgroundColor: '#111827', border: '1px solid #1E3A5F' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F0F8FF' }}>{r.product_name}</p>
                  <p className="text-xs" style={{ color: '#7EB8DA' }}>{r.product_brand}</p>
                  <Link
                    to={`/product/${r.product_slug}`}
                    className="text-[10px] inline-flex items-center gap-1 mt-1"
                    style={{ color: '#00D4FF' }}
                  >
                    View product <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
                <span
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
                  style={{ backgroundColor: status.bg, color: status.color }}
                >
                  <status.icon className="w-3 h-3" /> {status.label}
                </span>
              </div>

              <div className="space-y-1.5 mb-3 text-sm">
                <p className="flex items-center gap-2" style={{ color: '#F0F8FF' }}>
                  <Phone className="w-3.5 h-3.5" style={{ color: '#00FF88' }} />
                  <span className="font-medium">{r.customer_name}</span>
                  <span style={{ color: '#7EB8DA' }}>• {r.customer_phone}</span>
                </p>
                {r.customer_email && (
                  <p className="flex items-center gap-2 text-xs" style={{ color: '#7EB8DA' }}>
                    <Mail className="w-3.5 h-3.5" /> {r.customer_email}
                  </p>
                )}
                {r.notes && (
                  <p className="text-xs italic" style={{ color: '#7EB8DA' }}>"{r.notes}"</p>
                )}
                <p className="text-[10px] mt-1" style={{ color: '#4A7A9B' }}>
                  Requested {formatDate(r.created_at)}
                  {r.notified_at && ` • Notified ${formatDate(r.notified_at)}`}
                  {r.fulfilled_at && ` • Fulfilled ${formatDate(r.fulfilled_at)}`}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => callCustomer(r)}
                  disabled={updating === r.id}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)', color: '#0A0E1A' }}
                >
                  <Phone className="w-3 h-3" /> Call Now
                </button>
                {r.status !== 'notified' && r.status !== 'fulfilled' && (
                  <button
                    onClick={() => updateStatus(r.id, 'notified')}
                    disabled={updating === r.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 disabled:opacity-40"
                    style={{ backgroundColor: 'rgba(0, 212, 255, 0.15)', color: '#00D4FF', border: '1px solid rgba(0, 212, 255, 0.3)' }}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Mark as Notified
                  </button>
                )}
                {r.status !== 'fulfilled' && (
                  <button
                    onClick={() => updateStatus(r.id, 'fulfilled')}
                    disabled={updating === r.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 disabled:opacity-40"
                    style={{ backgroundColor: 'rgba(0, 255, 136, 0.15)', color: '#00FF88', border: '1px solid rgba(0, 255, 136, 0.3)' }}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Mark Fulfilled
                  </button>
                )}
                {r.status !== 'cancelled' && (
                  <button
                    onClick={() => updateStatus(r.id, 'cancelled')}
                    disabled={updating === r.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 disabled:opacity-40"
                    style={{ backgroundColor: 'rgba(248, 113, 113, 0.1)', color: '#F87171', border: '1px solid rgba(248, 113, 113, 0.2)' }}
                  >
                    <XCircle className="w-3 h-3" /> Cancel
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
