import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function BackButton({ label = 'Back', to, fallback = '/', className = '' }) {
  const navigate = useNavigate()
  function handleClick() {
    if (to) {
      navigate(to)
    } else {
      // Use browser history; if no history, fall back to default
      if (window.history.length > 1) {
        navigate(-1)
      } else {
        navigate(fallback)
      }
    }
  }
  return (
    <button
      onClick={handleClick}
      className={`btn-secondary text-sm py-1.5 px-3 inline-flex items-center gap-1 ${className}`}
      aria-label="Go back"
    >
      <ChevronLeft className="w-3.5 h-3.5" /> {label}
    </button>
  )
}
