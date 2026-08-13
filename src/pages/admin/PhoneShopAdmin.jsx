import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdmin } from '../../lib/admin/auth'
import InventoryPage from './InventoryPage'
import SalesPage from './SalesPage'
import BakiLedgerPage from './BakiLedgerPage'
import CashBookPage from './CashBookPage'
import ReportsPage from './ReportsPage'
import { BrandsPage } from './BrandsPage'
import { OrdersPage } from './OrdersPage'
import { SettingsPage } from './SettingsPage'
import AddPhone from './AddPhone'
import { RestockRequestsPage } from './RestockRequestsPage'

const NAV = [
  {
    id: 'inventory', label: 'Inventory', desc: 'Manage phone stock',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>,
  },
  {
    id: 'sales', label: 'Sales', desc: 'View sales history',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>,
  },
  {
    id: 'baki', label: 'Baki Ledger', desc: 'Track credit & baki',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
  },
  {
    id: 'cashbook', label: 'Cash Book', desc: 'Cash in & out flow',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  },
  {
    id: 'brands', label: 'Brands', desc: 'Manage brands catalog',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>,
  },
  {
    id: 'orders', label: 'Orders', desc: 'Online customer orders',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>,
  },
  {
    id: 'restock', label: 'Restock Requests', desc: 'Customer stock requests',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,
  },
  {
    id: 'reports', label: 'Reports', desc: 'Monthly P&L reports',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>,
  },
  {
    id: 'settings', label: 'Settings', desc: 'Storefront content',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  },
]

const PAGE_TITLES = {
  inventory: { title: 'Inventory', sub: 'Manage your phone stock' },
  sales:     { title: 'Sales',     sub: 'View all sales history' },
  baki:      { title: 'Baki Ledger', sub: 'Track credit & baki payments' },
  cashbook:  { title: 'Cash Book', sub: 'Track cash transactions' },
  brands:    { title: 'Brands',    sub: 'Manage brand catalog' },
  orders:    { title: 'Orders',    sub: 'Customer online orders' },
  restock:   { title: 'Restock Requests', sub: 'Customer requests for out-of-stock phones' },
  reports:   { title: 'Reports',   sub: 'Monthly reports & profit/loss' },
  settings:  { title: 'Settings',  sub: 'Storefront content & branding' },
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" style={{ color: '#00FF88' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </svg>
  )
}

export function PhoneShopAdmin() {
  const [activeTab, setActiveTab] = useState('inventory')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const { logout } = useAdmin()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  const { title: pageTitle, sub: pageSub } = PAGE_TITLES[activeTab] || {}

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#0A0E1A' }}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border" style={{ backgroundColor: '#111827' }}>
        <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(90deg, #00FF88, #00D4FF)' }} />

        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0, 255, 136, 0.15)', boxShadow: '0 0 12px rgba(0, 255, 136, 0.2)' }}
            >
              <PhoneIcon />
            </div>
            <h1 className="text-sm font-bold" style={{ color: '#00FF88' }}>PhoneShop BD</h1>
          </div>
          <p className="text-xs ml-9" style={{ color: '#00D4FF' }}>Admin Dashboard</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                activeTab === item.id ? 'bg-neon-green/10' : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              {activeTab === item.id && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                  style={{ backgroundColor: '#00FF88', boxShadow: '0 0 8px rgba(0, 255, 136, 0.6)' }}
                />
              )}
              <span style={{ color: activeTab === item.id ? '#00FF88' : '#9CA3AF' }}>{item.icon}</span>
              <span style={{ color: activeTab === item.id ? '#00FF88' : '#9CA3AF' }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-border px-3 py-3">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#9CA3AF] hover:bg-[#1E2A3A] hover:text-[#F87171] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Logout
          </button>
          <p className="text-[10px] mt-2 ml-2" style={{ color: '#4A7A9B' }}>v1.0 · PhoneShop BD</p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 border-b px-4 py-3" style={{ backgroundColor: '#111827', borderColor: '#1E3A5F' }}>
        <button className="text-[#E5E7EB]" onClick={() => setSidebarOpen(true)}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 255, 136, 0.15)' }}>
            <PhoneIcon />
          </div>
          <h1 className="text-sm font-bold" style={{ color: '#00FF88' }}>PhoneShop BD</h1>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 pt-6 px-3 shadow-xl flex flex-col" style={{ backgroundColor: '#111827' }}>
            <div className="px-3 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 255, 136, 0.15)' }}>
                  <PhoneIcon />
                </div>
                <h1 className="text-sm font-bold" style={{ color: '#00FF88' }}>PhoneShop BD</h1>
              </div>
              <button className="text-[#9CA3AF]" onClick={() => setSidebarOpen(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="h-px mx-3 mb-4" style={{ backgroundColor: '#1E3A5F' }} />
            <nav className="flex-1 px-2 space-y-0.5">
              {NAV.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id ? 'bg-neon-green/10' : 'hover:bg-gray-800'
                  }`}
                >
                  <span style={{ color: activeTab === item.id ? '#00FF88' : '#9CA3AF' }}>{item.icon}</span>
                  <div className="text-left">
                    <p style={{ color: activeTab === item.id ? '#00FF88' : '#E5E7EB' }}>{item.label}</p>
                    <p className="text-xs font-normal" style={{ color: '#6B7280' }}>{item.desc}</p>
                  </div>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:pt-10">
          <div className="md:hidden h-14" />

          {/* Page header */}
          <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#E5E7EB' }}>{pageTitle}</h2>
              <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>{pageSub}</p>
            </div>
            {activeTab === 'inventory' && (
              <button
                onClick={() => setAddOpen(true)}
                className="btn-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Add Phone
              </button>
            )}
          </div>

          {activeTab === 'inventory' && <InventoryPage setAddOpen={setAddOpen} />}
          {activeTab === 'sales' && <SalesPage />}
          {activeTab === 'baki' && <BakiLedgerPage />}
          {activeTab === 'cashbook' && <CashBookPage />}
          {activeTab === 'brands' && <BrandsPage />}
          {activeTab === 'orders' && <OrdersPage />}
          {activeTab === 'restock' && <RestockRequestsPage />}
          {activeTab === 'reports' && <ReportsPage />}
          {activeTab === 'settings' && <SettingsPage />}
        </div>
      </main>

      {/* Add Phone modal — opens from the Inventory page header */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="card w-full max-w-lg p-6 shadow-2xl bg-elev-bg my-4 sm:my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: '#E5E7EB' }}>Add Phone to Inventory</h2>
              <button onClick={() => setAddOpen(false)} className="btn-ghost btn-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <p className="text-xs text-sec-text mb-4">
              Scan or enter multiple IMEIs — one row per phone unit. Phones appear in the front shop automatically.
            </p>
            <AddPhone
              onSuccess={() => { setAddOpen(false); if (typeof window !== 'undefined') window.location.reload() }}
              onCancel={() => setAddOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
