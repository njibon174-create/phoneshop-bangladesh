import { X, Filter } from 'lucide-react'

const PRICE_PRESETS = [
  { label: 'Under ৳20K', min: 0, max: 20000 },
  { label: '৳20K–50K', min: 20000, max: 50000 },
  { label: '৳50K–100K', min: 50000, max: 100000 },
  { label: '৳100K–200K', min: 100000, max: 200000 },
  { label: 'Over ৳200K', min: 200000, max: 0 },
]

const RAM_OPTIONS = [4, 6, 8, 12, 16]
const STORAGE_OPTIONS = [64, 128, 256, 512, 1024]
const CONDITIONS = ['new', 'refurbished', 'used']

export function FilterSidebar({ filters, setFilter, clearAll, totalCount, onClose }) {
  const activeCount = activeFilterCount(filters)
  return (
    <aside className="bg-surface border border-border rounded-2xl p-5 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-text">Filters</h3>
          {activeCount > 0 && (
            <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">{activeCount}</span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-xs text-textSubtle mb-4">{totalCount} {totalCount === 1 ? 'phone' : 'phones'} found</p>

      {/* Price */}
      <Section title="Price">
        <div className="space-y-1.5">
          {PRICE_PRESETS.map((p) => {
            const isActive = filters.priceMin === p.min && filters.priceMax === p.max
            return (
              <button
                key={p.label}
                onClick={() => {
                  setFilter('price_min', p.min)
                  setFilter('price_max', p.max)
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'bg-surfaceElevated text-textMuted hover:text-text border border-transparent'
                }`}
              >
                {p.label}
              </button>
            )
          })}
          {(filters.priceMin > 0 || filters.priceMax > 0) && (
            <button
              onClick={() => { setFilter('price_min', 0); setFilter('price_max', 0) }}
              className="text-xs text-accent hover:underline mt-1"
            >
              Clear price
            </button>
          )}
        </div>
      </Section>

      {/* RAM */}
      <Section title="RAM">
        <div className="flex flex-wrap gap-1.5">
          {RAM_OPTIONS.map((gb) => (
            <Chip
              key={gb}
              active={filters.ram.includes(gb)}
              onClick={() => toggleMulti(filters, setFilter, 'ram', gb)}
            >
              {gb}GB
            </Chip>
          ))}
        </div>
      </Section>

      {/* Storage */}
      <Section title="Storage">
        <div className="flex flex-wrap gap-1.5">
          {STORAGE_OPTIONS.map((gb) => (
            <Chip
              key={gb}
              active={filters.storage.includes(gb)}
              onClick={() => toggleMulti(filters, setFilter, 'storage', gb)}
            >
              {gb >= 1024 ? '1TB' : `${gb}GB`}
            </Chip>
          ))}
        </div>
      </Section>

      {/* Condition */}
      <Section title="Condition">
        <div className="space-y-1.5">
          {CONDITIONS.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name="condition"
                checked={filters.condition === c}
                onChange={() => setFilter('condition', filters.condition === c ? '' : c)}
                className="accent-accent"
              />
              <span className="capitalize text-textMuted">{c}</span>
            </label>
          ))}
        </div>
      </Section>

      {activeCount > 0 && (
        <button onClick={clearAll} className="btn-secondary w-full text-sm py-2 mt-4">
          Clear all filters
        </button>
      )}
    </aside>
  )
}

function Section({ title, children }) {
  return (
    <div className="border-t border-border pt-4 mt-4 first:border-t-0 first:pt-0 first:mt-0">
      <h4 className="text-xs font-semibold text-text uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
        active
          ? 'bg-accent/20 text-accent border-accent/30'
          : 'bg-surfaceElevated text-textMuted border-border hover:text-text'
      }`}
    >
      {children}
    </button>
  )
}

function toggleMulti(filters, setFilter, key, value) {
  const arr = filters[key === 'ram' ? 'ram' : 'storage']
  const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
  setFilter(key, next)
}

function activeFilterCount(f) {
  let n = 0
  if (f.priceMin > 0 || f.priceMax > 0) n++
  if (f.ram.length) n++
  if (f.storage.length) n++
  if (f.condition) n++
  if (f.q) n++
  return n
}
