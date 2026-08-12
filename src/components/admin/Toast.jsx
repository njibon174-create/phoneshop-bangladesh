import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

let toastId = 0
const listeners = new Set()

export function showToast(msg, type = 'success', duration = 3000) {
  const id = ++toastId
  for (const l of listeners) l({ id, msg, type })
  setTimeout(() => {
    for (const l of listeners) l({ id, remove: true })
  }, duration)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function handle(t) {
      setToasts((prev) => {
        if (t.remove) return prev.filter((x) => x.id !== t.id)
        return [...prev, t]
      })
    }
    listeners.add(handle)
    return () => listeners.delete(handle)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = t.type === 'error' ? AlertCircle : t.type === 'info' ? Info : CheckCircle2
        const color = t.type === 'error' ? 'text-danger border-danger/30 bg-danger/10' :
                      t.type === 'info' ? 'text-neon-blue border-neon-blue/30 bg-neon-blue/10' :
                      'text-success border-success/30 bg-success/10'
        return (
          <div key={t.id} className={`flex items-start gap-2 p-3 rounded-xl border backdrop-blur ${color} animate-fade-in shadow-card-hover`}>
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="text-sm text-main-text flex-1">{t.msg}</p>
            <button onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))} className="text-muted-text hover:text-main-text shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
