import { OCCUPANCY_CONFIG } from '../data/mockShops'

export default function ShopCard({ shop, isPremium, onOpen, onCheckin }) {
  const config = OCCUPANCY_CONFIG[shop.current_occupancy] ?? OCCUPANCY_CONFIG.low

  return (
    <div className="pb-4">
      {/* Shop header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-3xl font-display font-black text-primary tracking-tight">{shop.name}</h3>
          <p className="text-primary/60 text-base font-sans mt-1">
            {shop.distance_mi} mi • {shop.borough}
          </p>
          <div className="flex items-center gap-2 mt-3 bg-white/50 w-fit px-3 py-1.5 rounded-full border border-primary/5">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: '#558B2F' }} />
            <span className="text-green-700 text-sm font-bold font-sans">Open Now</span>
            <span className="text-primary/30 text-sm">•</span>
            <span className="text-primary/60 text-sm font-medium font-sans">Closes {shop.closes_at}</span>
          </div>
        </div>

        {/* Directions button */}
        <button
          onClick={() => {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address)}`
            window.open(url, '_blank')
          }}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-cream shadow-[0_4px_0_0_rgba(62,39,35,0.15)] active:translate-y-1 active:shadow-none transition-all"
        >
          <span className="material-symbols-outlined text-3xl">directions</span>
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mt-2 mb-4">
        {/* Seating — always visible */}
        <div className="col-span-1 bg-white rounded-3xl p-4 flex flex-col items-center justify-center border border-primary/5 shadow-sm h-28">
          <div className="p-2 rounded-full mb-2" style={{ backgroundColor: config.color + '22' }}>
            <span className="material-symbols-outlined text-2xl" style={{ color: config.color }}>chair</span>
          </div>
          <span className="text-[10px] text-primary/50 mb-1 font-bold uppercase tracking-wider font-sans">Seating</span>
          <span className="text-sm font-black text-center leading-tight font-display" style={{ color: config.color }}>
            {config.label}
          </span>
        </div>

        {/* Noise — premium only */}
        <PremiumStat
          isPremium={isPremium}
          icon="volume_up"
          label="Noise"
          value="Quiet Zone"
        />

        {/* Wifi — premium only */}
        <PremiumStat
          isPremium={isPremium}
          icon="wifi"
          label="Wifi"
          value="Fast"
        />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onCheckin}
          className="h-12 bg-primary text-cream rounded-2xl font-bold font-sans flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">login</span>
          Check In
        </button>
        <button
          onClick={onOpen}
          className="h-12 bg-white text-primary border border-primary/10 rounded-2xl font-bold font-sans flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">info</span>
          Details
        </button>
      </div>

      {/* Report count badge */}
      <p className="text-center text-xs text-primary/40 font-sans mt-3">
        {shop.report_count_24h} occupancy reports in the last 24h
      </p>
    </div>
  )
}

function PremiumStat({ isPremium, icon, label, value }) {
  if (isPremium) {
    return (
      <div className="col-span-1 bg-white rounded-3xl p-4 flex flex-col items-center justify-center border border-primary/5 shadow-sm h-28">
        <div className="p-2 bg-primary/5 rounded-full mb-2">
          <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
        </div>
        <span className="text-[10px] text-primary/50 mb-1 font-bold uppercase tracking-wider font-sans">{label}</span>
        <span className="text-sm font-black text-primary text-center leading-tight font-display">{value}</span>
      </div>
    )
  }
  return (
    <div className="col-span-1 bg-gray-50 rounded-3xl p-4 flex flex-col items-center justify-center border border-transparent relative overflow-hidden h-28">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary/40 text-2xl">lock</span>
      </div>
      <div className="p-2 bg-gray-200 rounded-full mb-2 opacity-30">
        <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
      </div>
      <span className="text-[10px] text-primary/40 mb-1 font-bold uppercase tracking-wider font-sans">{label}</span>
      <span className="text-sm font-bold text-primary/40 opacity-50 font-display">–</span>
    </div>
  )
}
