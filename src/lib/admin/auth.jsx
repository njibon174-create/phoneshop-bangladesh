import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const AUTH_KEY = 'phoneshop_admin_auth_v1'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

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