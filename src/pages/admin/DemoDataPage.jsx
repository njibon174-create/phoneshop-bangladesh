import { useState } from 'react'
import { Database, AlertTriangle, CheckCircle2, Trash2, Sparkles, ShieldAlert, XCircle, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function DemoDataPage() {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirming, setConfirming] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 5000)
  }

  async function clearAll() {
    setLoading(true)
    try {
      // Delete in order to respect FKs (anon can DELETE on most tables now)
      const deleteOrder = [
        'order_items',
        'orders',
        'credit_payments',
        'credits',
        'cash_transaction_edits',
        'cash_transactions',
        'sales',
        'phones',
      ]
      const results = []
      for (const table of deleteOrder) {
        try {
          // Use the safest delete: any record with id >= 00000000-... (all UUIDs)
          await supabase.from(table).delete().gte('id', '00000000-0000-0000-0000-000000000000')
          results.push({ table, ok: true })
        } catch (e) {
          // Try alternate keys (some tables use non-id fields)
          try {
            await supabase.from(table).delete().gte('created_at', '1900-01-01')
            results.push({ table, ok: true })
          } catch (e2) {
            results.push({ table, ok: false, err: e2.message })
          }
        }
      }
      showToast(`Cleared ${results.filter(r => r.ok).length}/${results.length} tables. Run SQL to re-seed.`, 'success')
    } catch (e) {
      showToast('Error: ' + e.message, 'error')
    }
    setLoading(false)
    setConfirming(null)
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
          toast.type === 'error' ? 'bg-[#F8717120] text-[#F87171] border-[#F8717150]' : 'bg-[#39FF8820] text-[#39FF88] border-[#39FF8850]'
        }`}>{toast.msg}</div>
      )}

      <div className="card p-6 border border-[#1E3A5F]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(0,255,136,0.15)' }}>
            <Database className="w-6 h-6" style={{ color: '#00FF88' }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[#E5E7EB] mb-1">Demo Data Management</h3>
            <p className="text-sm text-[#7EB8DA] leading-relaxed">
              The site comes pre-seeded with <strong>30+ real phone models</strong> from
              gadgetandgear.com — plus 3 months of sales history, baki ledger, and cash book
              entries. Use this page to reset the demo data.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 border border-[#1E3A5F]">
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7EB8DA' }}>Inventory</p>
          <p className="text-2xl font-bold" style={{ color: '#00FF88' }}>~120 phones</p>
          <p className="text-xs mt-1" style={{ color: '#4A7A9B' }}>~30 models, multiple variants</p>
        </div>
        <div className="card p-5 border border-[#1E3A5F]">
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7EB8DA' }}>Sales History</p>
          <p className="text-2xl font-bold" style={{ color: '#00D4FF' }}>~80 sales</p>
          <p className="text-xs mt-1" style={{ color: '#4A7A9B' }}>~3 months, mix of cash & baki</p>
        </div>
        <div className="card p-5 border border-[#1E3A5F]">
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#7EB8DA' }}>Online Orders</p>
          <p className="text-2xl font-bold" style={{ color: '#FBBF24' }}>12 orders</p>
          <p className="text-xs mt-1" style={{ color: '#4A7A9B' }}>Various statuses</p>
        </div>
      </div>

      <div className="card p-6 border border-[#1E3A5F] space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#FBBF24' }} />
          <div>
            <p className="text-sm font-semibold text-[#E5E7EB]">Clear All Demo Data</p>
            <p className="text-xs mt-1 text-[#7EB8DA]">
              This will delete ALL phones, sales, credits, cash transactions, and online orders.
              The brands table stays. After clearing, run the SQL migration files to re-seed.
            </p>
          </div>
        </div>

        {!confirming ? (
          <button
            onClick={() => setConfirming('clear')}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold disabled:opacity-40"
            style={{ backgroundColor: 'rgba(248, 113, 113, 0.15)', color: '#F87171', border: '1px solid rgba(248, 113, 113, 0.3)' }}
          >
            <Trash2 className="w-4 h-4" /> Clear all demo data…
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={clearAll}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold disabled:opacity-40"
              style={{ backgroundColor: '#F87171', color: '#0A0E1A' }}
            >
              <ShieldAlert className="w-4 h-4" /> {loading ? 'Clearing…' : 'Yes, delete everything'}
            </button>
            <button
              onClick={() => setConfirming(null)}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg text-sm"
              style={{ backgroundColor: '#1E2A3A', color: '#7EB8DA', border: '1px solid #1E3A5F' }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="card p-6 border border-[#1E3A5F]">
        <div className="flex items-start gap-3 mb-3">
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#00FF88' }} />
          <div>
            <p className="text-sm font-semibold text-[#E5E7EB]">How to re-seed</p>
            <p className="text-xs mt-1 text-[#7EB8DA]">
              If the demo data looks stale, run these two SQL files in the Supabase SQL Editor:
            </p>
          </div>
        </div>
        <ol className="text-xs space-y-1.5 ml-8 list-decimal" style={{ color: '#7EB8DA' }}>
          <li>Open <a className="underline" style={{ color: '#00D4FF' }} href="https://supabase.com/dashboard/project/_/sql" target="_blank" rel="noopener noreferrer">Supabase SQL Editor</a></li>
          <li>Paste &amp; run <code className="bg-elev-bg px-1.5 py-0.5 rounded" style={{ color: '#00FF88' }}>supabase/seed_demo_data.sql</code> — this truncates old data and inserts 30+ phones</li>
          <li>Paste &amp; run <code className="bg-elev-bg px-1.5 py-0.5 rounded" style={{ color: '#00FF88' }}>supabase/seed_demo_sales.sql</code> — this generates 3 months of sales, baki, cash book entries, and 12 online orders</li>
        </ol>
      </div>
    </div>
  )
}
