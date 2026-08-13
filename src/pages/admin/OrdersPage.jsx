import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS = {
  pending: 'bg-[#FBBF2420] text-[#FBBF24] border-[#FBBF2450]',
  confirmed: 'bg-[#60A5FA20] text-[#60A5FA] border-[#60A5FA50]',
  processing: 'bg-[#60A5FA20] text-[#60A5FA] border-[#60A5FA50]',
  shipped: 'bg-[#00FF8820] text-[#00FF88] border-[#00FF8850]',
  delivered: 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]',
  cancelled: 'bg-[#F8717120] text-[#F87171] border-[#F8717150]',
}

function formatCurrency(n) { return new Intl.NumberFormat('en-BD').format(n || 0) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—' }

function SkeletonCard() {
  return <div className="card p-4 space-y-2 animate-pulse"><div className="h-4 w-1/3 bg-[#1E2A3A] rounded" /><div className="h-3 w-2/3 bg-[#1E2A3A] rounded" /><div className="h-3 w-1/2 bg-[#1E2A3A] rounded" /></div>
}

export function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [items, setItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('pending')
  const [openId, setOpenId] = useState(null)

  async function load() {
    setLoading(true)
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200)
    setOrders(ordersData || [])
    if (ordersData?.length) {
      const ids = ordersData.map(o => o.id)
      const { data: itemsData } = await supabase.from('order_items').select('*').in('order_id', ids)
      const grouped = {}
      for (const it of itemsData || []) { (grouped[it.order_id] = grouped[it.order_id] || []).push(it) }
      setItems(grouped)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id, status) {
    await supabase.from('orders').update({ order_status: status }).eq('id', id)
    load()
  }

  async function deleteOrder(id) {
    if (!confirm('Delete this order permanently? This cannot be undone.')) return
    try {
      // Try direct delete first (works if anon has DELETE permission)
      const { error: directErr } = await supabase.from('orders').delete().eq('id', id)
      if (!directErr) {
        load()
        return
      }
      // Fallback to RPC function (admin_delete_orders)
      const { error: rpcErr } = await supabase.rpc('admin_delete_orders', { pattern: null })
      if (rpcErr) {
        alert('Delete failed. Run supabase/005_cleanup_and_grant.sql in Supabase SQL Editor to grant permission.')
        return
      }
      load()
    } catch (e) {
      alert('Error: ' + e.message)
    }
  }

const filtered = orders.filter(o => {
    const matchSearch = !search || `${o.order_number} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.order_status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="stat-card"><span className="stat-label">Total Orders</span><span className="stat-value">{orders.length}</span></div>
        <div className="stat-card"><span className="stat-label">Pending</span><span className="stat-value text-amber-400">{orders.filter(o => o.order_status === 'pending').length}</span></div>
        <div className="stat-card"><span className="stat-label">Revenue</span><span className="stat-value">৳{formatCurrency(orders.reduce((s, o) => s + Number(o.total_bdt || 0), 0))}</span></div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input className="input pl-9" placeholder="Search order #, customer, phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {!loading && <p className="text-xs text-[#9CA3AF]">Showing {filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#1E2A3A] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#9CA3AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-[#E5E7EB]">No orders yet</p>
            </div>
          </div>
        )}

        {!loading && filtered.map(o => (
          <div key={o.id} className="card p-4 flex flex-col gap-3 border border-[#1E3A5F]">
            <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => setOpenId(openId === o.id ? null : o.id)}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-mono text-sm font-bold text-[#00FF88]">{o.order_number}</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[o.order_status]}`}>{o.order_status}</span>
                </div>
                <p className="text-sm text-[#E5E7EB] mt-1">{o.customer_name} · {o.customer_phone}</p>
                <p className="text-[10px] text-[#4A7A9B]">{formatDate(o.created_at)}</p>
              </div>
              <p className="font-bold text-[#E5E7EB] shrink-0">৳{formatCurrency(o.total_bdt)}</p>
            </div>

            {openId === o.id && (
              <div className="border-t border-[#1E3A5F] pt-3 space-y-3">
                <div>
                  <p className="text-xs text-[#4A7A9B] uppercase mb-1">Address</p>
                  <p className="text-sm text-[#E5E7EB]">{o.shipping_address}</p>
                  {o.shipping_notes && <p className="text-xs text-[#7EB8DA] mt-1">"{o.shipping_notes}"</p>}
                </div>
                <div>
                  <p className="text-xs text-[#4A7A9B] uppercase mb-2">Items</p>
                  <div className="space-y-1">
                    {(items[o.id] || []).map(it => (
                      <div key={it.id} className="flex justify-between text-sm py-1 border-b border-[#1E3A5F]/50 last:border-0">
                        <span className="text-[#E5E7EB]">{it.product_name}</span>
                        <span className="text-[#9CA3AF]">৳{formatCurrency(it.line_total_bdt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-[#1E3A5F]">
                  <span className="text-xs text-[#9CA3AF]">Status:</span>
                  <select className={`text-xs px-2 py-1 rounded border bg-[#1E2A3A] ${STATUS_COLORS[o.order_status]}`} value={o.order_status} onChange={e => updateStatus(o.id, e.target.value)}>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
