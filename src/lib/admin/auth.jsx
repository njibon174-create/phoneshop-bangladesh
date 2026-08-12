import { createContext, useContext, useState, useEffect } from 'react'

const AUTH_KEY = 'phoneshop_admin_auth_v1'
// IMPORTANT: this fallback is the only "secret" baked into the client bundle.
// It MUST be kept in sync with the Vercel env var VITE_ADMIN_PASSWORD.
// Change the password by setting VITE_ADMIN_PASSWORD in Vercel.
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'phoneshop-admin-2026'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(() => {
    try {
      return sessionStorage.getItem(AUTH_KEY) === 'true'
    } catch { return false }
  })

  function login(password) {
    if (password === ADMIN_PASSWORD) {
      try { sessionStorage.setItem(AUTH_KEY, 'true') } catch {}
      setAuthenticated(true)
      return true
    }
    return false
  }

  function logout() {
    try { sessionStorage.removeItem(AUTH_KEY) } catch {}
    setAuthenticated(false)
  }

  // Keep multiple tabs in sync — when one tab logs out, all log out
  useEffect(() => {
    function onStorage(e) {
      if (e.key === AUTH_KEY) {
        setAuthenticated(e.newValue === 'true')
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <AdminContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider')
  return ctx
}
