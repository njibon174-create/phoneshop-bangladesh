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

  if (authenticated) {
    navigate('/admin', { replace: true })
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{background: 'linear-gradient(135deg, #00FF88, #00D4FF)'}}>
            <Shield className="w-7 h-7 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-main-text">PhoneShop BD Admin</h1>
          <p className="text-sm text-sec-text mt-1">Enter password to access the admin panel</p>
        </div>

        <form onSubmit={submit} className="card p-6">
          <label className="block text-xs font-medium text-sec-text mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full bg-elev-bg border border-border rounded-lg pl-10 pr-10 py-2.5 text-sm text-main-text outline-none focus:border-neon-green focus:ring-1 focus:ring-neon-green/30"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-main-text">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-danger text-xs mt-3">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full mt-5 py-3">
            Login
          </button>

          <p className="text-xs text-muted-text text-center mt-4">
            Default password: <code className="bg-elev-bg px-2 py-0.5 rounded text-neon-green">admin123</code>
          </p>
          <p className="text-xs text-muted-text text-center mt-1">
            Override via <code>VITE_ADMIN_PASSWORD</code> env var
          </p>
        </form>
      </div>
    </div>
  )
}