import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Link } from 'react-router-dom'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
    console.error('Component stack:', info?.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="section-container py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-danger/10 border border-danger/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-danger" />
          </div>
          <h1 className="text-2xl font-bold text-main-text mb-2">Something went wrong</h1>
          <p className="text-sec-text mb-2">The page crashed while loading.</p>
          <details className="text-left bg-surface border border-border rounded-xl p-3 mb-6 text-xs">
            <summary className="cursor-pointer text-muted-text hover:text-main-text">Show error details</summary>
            <pre className="mt-2 text-danger whitespace-pre-wrap break-words text-[10px] font-mono">
              {this.state.error?.message}
              {this.state.error?.stack && '\n\n' + this.state.error.stack.substring(0, 500)}
            </pre>
          </details>
          <div className="flex justify-center gap-3">
            <button onClick={() => { this.setState({ error: null }); window.location.reload() }} className="btn-primary inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Reload
            </button>
            <Link to="/" className="btn-secondary inline-flex items-center gap-2">
              <Home className="w-4 h-4" /> Home
            </Link>
          </div>
        </div>
      </main>
    )
  }
}
