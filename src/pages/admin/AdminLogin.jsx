import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Lock, Eye, EyeOff } from 'lucide-react'
import { useAdmin } from '../../lib/admin/auth'

export function AdminLogin() {
  const { login, authenticated } = useAdmin()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(null)

  // If already authenticated, render a redirect spinner instead of calling
  // navigate() during render (which would cause infinite re-renders).
  if (authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0A0E1A' }}>
        <div className="text-center">
          <div className="w-10 h-10 mx-auto rounded-2xl animate-pulse" style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)' }} />
          <p className="mt-4 text-sm" style={{ color: '#7EB8DA' }}>Redirecting…</p>
        </div>
      </div>
    )
  }

  function submit(e) {
    e.preventDefault()
    setError(null)
    if (login(password)) {
      navigate('/admin', { replace: true })
    } else {
      setError('Wrong password')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0A0E1A' }}>
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)', boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }}
          >
            <Shield className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#F0F8FF' }}>PhoneShop BD Admin</h1>
          <p className="text-sm mt-1" style={{ color: '#7EB8DA' }}>Enter password to access the admin panel</p>
        </div>

        <form onSubmit={submit} className="rounded-xl bg-card-bg border border-border shadow-lg p-6">
          <label className="block text-xs font-medium mb-2" style={{ color: '#7EB8DA' }}>Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#4A7A9B' }} />
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full bg-elev-bg border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green/30"
              style={{ color: '#F0F8FF' }}
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-main-text" style={{ color: '#4A7A9B' }}>
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="mt-3 text-xs" style={{ color: '#F87171' }}>{error}</p>
          )}

          <button
            type="submit"
            className="w-full mt-5 py-3 rounded-lg text-black font-bold disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #00FF88, #00D4FF)', boxShadow: '0 0 16px rgba(0, 255, 136, 0.3)' }}
            disabled={!password}
          >
            Login
          </button>

          <p className="text-xs text-center mt-4" style={{ color: '#4A7A9B' }}>
            Default password: <code className="bg-elev-bg px-2 py-0.5 rounded" style={{ color: '#00FF88' }}>phoneshop-admin-2026</code>
          </p>
          <p className="text-xs text-center mt-1" style={{ color: '#4A7A9B' }}>
            Override via <code>VITE_ADMIN_PASSWORD</code> env var
          </p>
        </form>
      </div>
    </div>
  )
}
