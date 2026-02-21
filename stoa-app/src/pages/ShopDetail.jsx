import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { MOCK_SHOPS, OCCUPANCY_CONFIG } from '../data/mockShops'

const AMENITY_ICONS = {
  wifi: { icon: 'wifi', label: 'Fast Wifi', bg: 'bg-blue-50' },
  outlets: { icon: 'power', label: 'Plentiful Outlets', bg: 'bg-orange-50' },
  meeting_rooms: { icon: 'meeting_room', label: 'Meeting Rooms', bg: 'bg-purple-50' },
  ergo_chairs: { icon: 'chair', label: 'Ergo Chairs', bg: 'bg-green-50' },
  dog_friendly: { icon: 'pets', label: 'Dog Friendly', bg: 'bg-yellow-50' },
  quiet: { icon: 'graphic_eq', label: 'Quiet Zone', bg: 'bg-teal-50' },
}

export default function ShopDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isPremium, user } = useAuth()
  const [shop, setShop] = useState(MOCK_SHOPS.find(s => s.id === id) ?? MOCK_SHOPS[0])
  const [saved, setSaved] = useState(false)

  // Subscribe to live Firestore data for this shop
  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID || !id) return
    const unsub = onSnapshot(doc(db, 'shops', id), (snap) => {
      if (snap.exists()) setShop({ id: snap.id, ...snap.data() })
    })
    return unsub
  }, [id])

  const config = OCCUPANCY_CONFIG[shop.current_occupancy] ?? OCCUPANCY_CONFIG.low
  const fillPct = { low: 25, moderate: 55, busy: 78, packed: 97 }[shop.current_occupancy] ?? 30

  return (
    <div className="screen bg-cream overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

      {/* Hero image */}
      <div className="px-2 pt-2">
        <div className="relative w-full rounded-[2.5rem] overflow-hidden shadow-md" style={{ height: '35vh', minHeight: '260px' }}>
          <div
            className="w-full h-full bg-cover bg-center transition-transform hover:scale-105 duration-700"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      </div>

      {/* Top nav (absolute over image) */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none max-w-md mx-auto">
        <div className="flex items-center justify-between p-4 pt-12">
          <button
            onClick={() => navigate(-1)}
            className="pointer-events-auto bg-white/80 backdrop-blur-md text-primary flex size-11 items-center justify-center rounded-full shadow-sm hover:bg-white transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex gap-3 pointer-events-auto">
            <button className="bg-white/80 backdrop-blur-md text-primary flex size-11 items-center justify-center rounded-full shadow-sm hover:bg-white active:scale-95">
              <span className="material-symbols-outlined text-[22px]">ios_share</span>
            </button>
            <button
              onClick={() => setSaved(p => !p)}
              className="bg-white/80 backdrop-blur-md text-primary flex size-11 items-center justify-center rounded-full shadow-sm hover:bg-white active:scale-95"
            >
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>
                favorite
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content card */}
      <div className="relative -mt-10 z-10">
        <div className="bg-cream rounded-t-[3rem] shadow-[0_-8px_30px_rgba(0,0,0,0.04)] border-t border-white/40 min-h-[500px] pb-12">

          {/* Title */}
          <div className="px-6 pt-8 pb-4">
            <h1 className="text-primary text-[32px] font-display font-bold leading-[1.1] tracking-tight">{shop.name}</h1>
            <p className="text-primary/60 text-sm font-medium mt-1">
              {shop.address}
            </p>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap mt-4">
              {shop.is_partner && (
                <div className="flex h-8 items-center gap-1.5 rounded-full bg-[#EFEBE0] border border-[#E6E0D0] px-3.5">
                  <span className="material-symbols-outlined text-accent text-[18px]">verified</span>
                  <p className="text-primary text-xs font-bold uppercase tracking-wide">Partner</p>
                </div>
              )}
              <div className="flex h-8 items-center gap-1.5 rounded-full bg-white border border-black/5 shadow-sm px-3.5">
                <span className="material-symbols-outlined text-green-600 text-[18px]">schedule</span>
                <p className="text-gray-700 text-xs font-semibold">Open until {shop.closes_at}</p>
              </div>
            </div>
          </div>

          {/* Check In button */}
          <div className="px-4 mt-2 flex flex-col gap-3">
            <button
              onClick={() => navigate(`/checkin/${shop.id}`)}
              className="w-full bg-primary text-cream h-14 rounded-full font-bold text-[17px] shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[22px]">login</span>
              Check In &amp; Report
            </button>

            {/* Live seats + noise row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Live seats */}
              <div className="p-4 rounded-[1.5rem] bg-white shadow-sm border border-stone-100">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: config.color }} />
                    <span className="relative inline-flex rounded-full h-3 w-3" style={{ backgroundColor: config.color }} />
                  </span>
                  <span className="text-[15px] font-bold text-primary">Live: Seats</span>
                </div>
                <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all" style={{ width: `${fillPct}%`, backgroundColor: config.color, boxShadow: `0 0 10px ${config.color}66` }} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-primary/60 bg-stone-50 px-2 py-1 rounded-lg">{fillPct}% Full</span>
                  <span className="text-[11px] text-primary/60 uppercase tracking-wider font-bold">{config.label}</span>
                </div>
              </div>

              {/* Noise + Wifi */}
              <div className="p-4 rounded-[1.5rem] bg-white shadow-sm border border-stone-100 flex flex-col justify-between">
                {isPremium ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[11px] text-primary/60 uppercase tracking-wider font-bold">Noise Level</span>
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                        <span className="material-symbols-outlined text-[20px] text-primary/80">graphic_eq</span>
                        Quiet Zone
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 mt-3">
                      <span className="text-[11px] text-primary/60 uppercase tracking-wider font-bold">Internet</span>
                      <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                        <span className="material-symbols-outlined text-[20px] text-primary/80">wifi</span>
                        Fast (124 Mbps)
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <div className="bg-primary text-white p-2 rounded-full shadow">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                    </div>
                    <span className="text-xs font-bold text-primary text-center">Premium Details</span>
                    <button onClick={() => navigate('/upgrade')} className="text-[10px] text-primary/50 underline">Upgrade</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Punch card (partner only) */}
          {shop.is_partner && (
            <div className="px-4 mt-8">
              <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-primary to-[#5D4037] p-6 shadow-xl text-white">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white opacity-[0.07] rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h3 className="font-bold text-xl tracking-tight font-display">Your Punch Card</h3>
                      <p className="text-orange-100/80 text-sm mt-0.5">Free drink on your 10th visit</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/10">
                      <span className="font-mono font-bold text-accent">5/10</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary shadow-lg">
                        <span className="material-symbols-outlined text-[16px] font-bold">check</span>
                      </div>
                    ))}
                    {[0,1,2,3].map(i => (
                      <div key={i} className="w-7 h-7 rounded-full bg-black/30 border-2 border-white/10" />
                    ))}
                    <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px] text-white">local_cafe</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Amenities */}
          {shop.amenities && (
            <div className="px-4 mt-10">
              <h3 className="text-xl font-display font-bold text-primary mb-4 px-2">Amenities</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 px-2" style={{ scrollbarWidth: 'none' }}>
                {shop.amenities.map(key => {
                  const a = AMENITY_ICONS[key] ?? { icon: 'check', label: key, bg: 'bg-gray-50' }
                  return (
                    <div key={key} className="flex-none w-28 h-32 bg-white rounded-3xl flex flex-col items-center justify-center gap-3 border border-stone-100 shadow-sm">
                      <div className={`w-12 h-12 rounded-full ${a.bg} flex items-center justify-center text-primary`}>
                        <span className="material-symbols-outlined text-[24px]">{a.icon}</span>
                      </div>
                      <span className="text-xs font-semibold text-primary/60 text-center px-2 leading-tight">{a.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Premium upsell if not premium */}
          {!isPremium && (
            <div className="px-4 mt-8">
              <div className="relative overflow-hidden bg-primary rounded-[2rem] p-6 text-center shadow-lg">
                <h2 className="text-white text-xl font-display font-bold mb-2">Work smarter, not harder.</h2>
                <p className="text-white/80 text-sm mb-5">Get reliable noise levels, wifi speeds, and outlet availability before you leave home.</p>
                <button
                  onClick={() => navigate('/upgrade')}
                  className="w-full bg-cream text-primary font-bold py-3.5 px-6 rounded-full flex items-center justify-center gap-2"
                >
                  <span>Unlock with Premium</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <p className="text-white/40 text-[10px] mt-3 uppercase tracking-wide">7 Day Free Trial • Cancel Anytime</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
