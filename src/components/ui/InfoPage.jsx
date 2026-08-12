import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function InfoPage({ title, subtitle, children, back = '/' }) {
  return (
    <main className="section-container py-8 max-w-3xl">
      <nav className="flex items-center gap-1 text-sm text-textSubtle mb-4">
        <Link to={back} className="hover:text-neon-green">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-main-text">{title}</span>
      </nav>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-main-text mb-2">{title}</h1>
        {subtitle && <p className="text-sec-text">{subtitle}</p>}
      </header>
      <div className="card p-6 sm:p-8 prose prose-invert max-w-none text-main-text [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-main-text [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-main-text [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:text-sec-text [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:text-sec-text [&_ul]:mb-3 [&_ul]:pl-5 [&_li]:list-disc [&_li]:mb-1 [&_a]:text-neon-green [&_a]:hover:underline [&_strong]:text-main-text">
        {children}
      </div>
    </main>
  )
}
