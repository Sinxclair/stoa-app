import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Circle,
} from '@react-google-maps/api'
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { MOCK_SHOPS, OCCUPANCY_CONFIG } from '../data/mockShops'
import BottomSheet from '../components/BottomSheet'
import ShopCard from '../components/ShopCard'

// Brooklyn center default
const BROOKLYN_CENTER = { lat: 40.6782, lng: -73.9442 }

const MAP_STYLES = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', stylers: [{ color: '#d4e6f1' }] },
  { featureType: 'landscape', stylers: [{ color: '#f5f0e8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8b6f5e' }] },
]

const FILTERS = [
  { id: 'open', label: 'Open Now', icon: null, premium: false },
  { id: 'wifi', label: 'Wifi', icon: 'wifi', premium: false },
  { id: 'outlets', label: 'Outlets', icon: 'power', premium: false },
  { id: 'quiet', label: 'Quiet', icon: null, premium: true },
  { id: 'dog_friendly', label: 'Dog Friendly', icon: null, premium: true },
]

export default function HomeMap() {
  const navigate = useNavigate()
  const { user, isPremium } = useAuth()
  const [shops, setShops] = useState(MOCK_SHOPS)
  const [selectedShop, setSelectedShop] = useState(MOCK_SHOPS[0])
  const [activeFilters, setActiveFilters] = useState(['open'])
  const [userLocation, setUserLocation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenter, setMapCenter] = useState(BROOKLYN_CENTER)
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const mapRef = useRef(null)

  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: mapsApiKey || '',
  })

  // Request user location
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        setMapCenter(loc)
      },
      () => {
        // Silently fallback to Brooklyn center
      },
      { timeout: 5000 }
    )
  }, [])

  // Subscribe to live Firestore shop data
  useEffect(() => {
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      // No Firebase config — stay on mock data
      return
    }
    const q = query(
      collection(db, 'shops'),
      where('borough', 'in', ['Brooklyn', 'Manhattan']),
      orderBy('last_report_at', 'desc'),
      limit(50)
    )
    const unsub = onSnapshot(q, (snap) => {
      const liveShops = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      if (liveShops.length > 0) setShops(liveShops)
    })
    return unsub
  }, [])

  function toggleFilter(filterId) {
    const filter = FILTERS.find(f => f.id === filterId)
    if (filter.premium && !isPremium) {
      navigate('/upgrade')
      return
    }
    setActiveFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    )
  }

  function handleMarkerClick(shop) {
    setSelectedShop(shop)
    setSheetExpanded(false)
    if (mapRef.current) {
      mapRef.current.panTo({ lat: shop.lat, lng: shop.lng })
    }
  }

  function handleMapLoad(map) {
    mapRef.current = map
  }

  const filteredShops = shops.filter(shop => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!shop.name.toLowerCase().includes(q) && !shop.address.toLowerCase().includes(q)) return false
    }
    return true
  })

  const occupancyForPin = (level) => {
    return OCCUPANCY_CONFIG[level]?.pinColor ?? '#3E2723'
  }

  return (
    <div className="screen bg-cream overflow-hidden relative">

      {/* ── Map Layer ─────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        {isLoaded && !loadError && mapsApiKey ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenter}
            zoom={14}
            options={{
              styles: MAP_STYLES,
              disableDefaultUI: true,
              gestureHandling: 'greedy',
              clickableIcons: false,
            }}
            onLoad={handleMapLoad}
          >
            {/* User location pulse */}
            {userLocation && (
              <>
                <Circle
                  center={userLocation}
                  radius={80}
                  options={{ fillColor: '#3E2723', fillOpacity: 0.15, strokeWeight: 0 }}
                />
                <Marker
                  position={userLocation}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#3E2723',
                    fillOpacity: 1,
                    strokeColor: '#fff',
                    strokeWeight: 2,
                  }}
                />
              </>
            )}

            {/* Shop pins */}
            {filteredShops.map(shop => (
              <Marker
                key={shop.id}
                position={{ lat: shop.lat, lng: shop.lng }}
                onClick={() => handleMarkerClick(shop)}
                icon={{
                  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                  fillColor: occupancyForPin(shop.current_occupancy),
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 1.5,
                  scale: selectedShop?.id === shop.id ? 2.2 : 1.8,
                  anchor: { x: 12, y: 22 },
                }}
              />
            ))}
          </GoogleMap>
        ) : (
          // Fallback map background (no API key / loading)
          <div
            className="w-full h-full bg-cover bg-center grayscale-[0.2] sepia-[0.3]"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?w=1200&q=80')`,
            }}
          >
            {/* Occupancy glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[60%] left-[45%] w-64 h-64 rounded-full" style={{ background: '#8BC34A', filter: 'blur(50px)', opacity: 0.5 }} />
              <div className="absolute top-[25%] left-[10%] w-56 h-56 rounded-full" style={{ background: '#E57373', filter: 'blur(50px)', opacity: 0.4 }} />
              <div className="absolute top-[40%] right-[10%] w-60 h-60 rounded-full" style={{ background: '#FFB74D', filter: 'blur(50px)', opacity: 0.45 }} />
            </div>
            {/* Static shop pins */}
            {filteredShops.map((shop, i) => {
              const positions = [
                { top: '33%', left: '25%' },
                { top: '50%', right: '25%' },
                { bottom: '33%', left: '50%' },
                { top: '20%', right: '40%' },
              ]
              const pos = positions[i % positions.length]
              return (
                <button
                  key={shop.id}
                  onClick={() => { setSelectedShop(shop); setSheetExpanded(false) }}
                  className="absolute flex flex-col items-center transition-transform hover:scale-110"
                  style={{ ...pos, transform: 'translate(-50%, -50%)' }}
                >
                  <div className="bg-white p-1.5 rounded-full shadow-md">
                    <span
                      className="material-symbols-outlined text-3xl"
                      style={{ color: occupancyForPin(shop.current_occupancy) }}
                    >
                      location_on
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Top Bar: Search + Filters ──────────────────────── */}
      <div className="relative z-10 pt-14 px-5 pb-4 bg-gradient-to-b from-cream/95 via-cream/80 to-transparent pointer-events-none">
        {/* Search bar */}
        <div className="pointer-events-auto shadow-soft rounded-3xl mb-3">
          <div className="flex h-14 items-center rounded-3xl bg-white border border-primary/5 shadow-sm">
            <div className="pl-5 text-primary/40">
              <span className="material-symbols-outlined text-2xl">search</span>
            </div>
            <input
              className="flex-1 bg-transparent px-3 text-lg text-primary placeholder:text-primary/40 focus:outline-none font-sans"
              placeholder="Find a spot to work..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {user && (
              <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm mr-2">
                {user.photoURL
                  ? <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-primary flex items-center justify-center text-cream text-sm font-bold">
                      {user.displayName?.[0] ?? 'U'}
                    </div>
                }
              </div>
            )}
          </div>
        </div>

        {/* Filter chips */}
        <div className="pointer-events-auto flex gap-3 overflow-x-auto pb-2 px-1" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(filter => {
            const isActive = activeFilters.includes(filter.id)
            const locked = filter.premium && !isPremium
            return (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 font-bold text-sm transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-[0_4px_0_0_rgba(62,39,35,0.15)]'
                    : locked
                    ? 'bg-white/60 border border-primary/5 text-primary/60'
                    : 'bg-white border border-primary/10 text-primary'
                }`}
              >
                <span>{filter.label}</span>
                {locked && <span className="material-symbols-outlined text-[16px]">lock</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Live update badge */}
      <div className="absolute top-44 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-primary text-xs font-bold tracking-wide">Live heatmap updated</span>
        </div>
      </div>

      {/* ── Bottom Sheet ───────────────────────────────────── */}
      <BottomSheet expanded={sheetExpanded} onToggle={() => setSheetExpanded(p => !p)}>
        {/* Premium upsell banner */}
        {!isPremium && (
          <div className="mb-5 relative overflow-hidden flex items-center justify-between gap-4 rounded-3xl bg-[#FFF8E1] p-5 border border-[#FFE082]/30 shadow-sm">
            <div className="flex flex-col gap-1 z-10">
              <p className="text-primary text-lg font-display font-bold leading-tight">Unlock premium details</p>
              <p className="text-primary/70 text-sm font-sans leading-normal">View noise levels, wifi speeds &amp; more</p>
            </div>
            <button
              onClick={() => navigate('/upgrade')}
              className="flex-shrink-0 bg-primary text-cream text-sm font-bold py-2.5 px-5 rounded-xl z-10"
            >
              Upgrade
            </button>
          </div>
        )}

        {/* Selected shop card */}
        {selectedShop && (
          <ShopCard
            shop={selectedShop}
            isPremium={isPremium}
            onOpen={() => navigate(`/shop/${selectedShop.id}`)}
            onCheckin={() => navigate(`/checkin/${selectedShop.id}`)}
          />
        )}

        {/* Nearby shops list (expanded state) */}
        {sheetExpanded && (
          <div className="mt-6">
            <h3 className="text-lg font-display font-black text-primary mb-4">Nearby Spots</h3>
            <div className="flex flex-col gap-3">
              {filteredShops
                .filter(s => s.id !== selectedShop?.id)
                .map(shop => (
                  <button
                    key={shop.id}
                    onClick={() => { setSelectedShop(shop); setSheetExpanded(false) }}
                    className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-primary/5 shadow-sm text-left"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: OCCUPANCY_CONFIG[shop.current_occupancy]?.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-primary truncate">{shop.name}</p>
                      <p className="text-primary/60 text-sm">{shop.distance_mi} mi • {shop.borough}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${OCCUPANCY_CONFIG[shop.current_occupancy]?.bgColor} ${OCCUPANCY_CONFIG[shop.current_occupancy]?.textColor}`}>
                      {OCCUPANCY_CONFIG[shop.current_occupancy]?.label}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ── Bottom Navigation ─────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-md border-t border-primary/5 pb-8 pt-4 px-8 rounded-t-[32px]">
        <div className="flex justify-between items-end max-w-sm mx-auto">
          <NavBtn icon="map" label="Map" active onClick={() => {}} />
          <NavBtn icon="list" label="List" onClick={() => navigate('/list')} />
          <NavBtn icon="card_giftcard" label="Rewards" onClick={() => navigate('/rewards')} />
          <NavBtn icon="person" label="Profile" onClick={() => navigate('/profile')} />
        </div>
      </div>
    </div>
  )
}

function NavBtn({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 w-16 group ${active ? '' : 'opacity-50 hover:opacity-100'} transition-opacity`}>
      {active
        ? <div className="bg-primary/10 px-4 py-1 rounded-full"><span className="material-symbols-outlined text-primary text-2xl icon-fill">{icon}</span></div>
        : <span className="material-symbols-outlined text-primary text-2xl">{icon}</span>
      }
      <span className="text-[11px] font-bold text-primary font-sans">{label}</span>
    </button>
  )
}
