export function PhoneCard({ phone }) {
  return (
    <div className="card p-5">
      <div className="aspect-square bg-surfaceElevated rounded-xl flex items-center justify-center mb-4 overflow-hidden">
        <img src={phone.image} alt={phone.name} className="w-full h-full object-contain p-4 transition-transform duration-300 hover:scale-105" loading="lazy" />
      </div>
      <div className="inline-block bg-accent/20 text-accent text-xs font-semibold px-2 py-1 rounded-lg mb-2">{phone.brand}</div>
      <h3 className="font-semibold text-text text-base mb-1 line-clamp-1">{phone.name}</h3>
      <p className="text-textMuted text-sm mb-3">{phone.variant}</p>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-xl font-bold text-text">{phone.price}</span>
        <span className="text-xs text-textSubtle">BDT</span>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary flex-1 py-2 text-sm">View</button>
        <button className="btn-secondary py-2 px-3 text-sm">Buy</button>
      </div>
    </div>
  )
}
