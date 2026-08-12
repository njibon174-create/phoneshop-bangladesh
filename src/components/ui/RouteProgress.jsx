import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Top loading bar that shows when the route changes.
 * Uses a small timer to show progress, then completes when the
 * next page is rendered. Provides immediate visual feedback that
 * navigation is happening so users don't think the page "just refreshed".
 */
export function RouteProgress() {
  const location = useLocation()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)
  const prevPath = useRef(location.pathname)

  useEffect(() => {
    if (location.pathname === prevPath.current) return
    prevPath.current = location.pathname

    // Start progress
    setVisible(true)
    setProgress(0)

    // Animate to ~80% over 200ms (fakes realistic loading)
    let p = 0
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      // Sigmoid-ish curve
      const target = Math.min(85, 100 * (1 - Math.exp(-elapsed / 300)))
      p = Math.max(p, target)
      setProgress(p)
      if (elapsed < 200) {
        timerRef.current = setTimeout(tick, 16)
      }
    }
    tick()

    // Complete after a tiny delay
    const complete = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 200)
    }, 250)

    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(complete)
    }
  }, [location.pathname])

  if (!visible) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0.5 pointer-events-none">
      <div
        className="h-full bg-neon-green transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
