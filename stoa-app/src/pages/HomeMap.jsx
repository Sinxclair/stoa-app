import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import mockShops, { occupancyColors } from "../data/mockShops";
import BottomSheet from "../components/BottomSheet";
import ShopDetail from "./ShopDetail";
import CheckIn from "./CheckIn";

const filters = [
  { key: "all", label: "All" },
  { key: "low", label: "🟢 Available" },
  { key: "mid", label: "🟡 Moderate" },
  { key: "high", label: "🔴 Full" },
];

export default function HomeMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredShops, setFilteredShops] = useState(mockShops);
  const [selectedShop, setSelectedShop] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [40.6982, -73.9546],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    // Add new markers
    filteredShops.forEach((shop) => {
      const color = occupancyColors[shop.occupancy];
      const cssClass =
        shop.occupancy === "low"
          ? "low"
          : shop.occupancy === "mid"
            ? "mid"
            : "high";

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div class="marker-bubble ${cssClass}">${shop.name.split(" ")[0]}</div>`,
        iconSize: [0, 0],
        iconAnchor: [40, 30],
      });

      const marker = L.marker([shop.lat, shop.lng], { icon }).addTo(map);
      marker.on("click", () => {
        setSelectedShop(shop);
        setDetailOpen(true);
        map.flyTo([shop.lat, shop.lng], 15, { duration: 0.5 });
      });
      markersRef.current.push(marker);
    });
  }, [filteredShops]);

  // Handle filter
  const handleFilter = (key) => {
    setActiveFilter(key);
    if (key === "all") {
      setFilteredShops(mockShops);
    } else {
      setFilteredShops(mockShops.filter((s) => s.occupancy === key));
    }
  };

  // Handle shop click from list
  const handleShopClick = (shop) => {
    setSelectedShop(shop);
    setDetailOpen(true);
    const map = mapInstanceRef.current;
    if (map) map.flyTo([shop.lat, shop.lng], 15, { duration: 0.5 });
  };

  // Handle check-in submit
  const handleCheckinSubmit = (level) => {
    setCheckinOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Locate user
  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([pos.coords.latitude, pos.coords.longitude], 15);
        }
      });
    }
  };

  return (
    <div className="home-map-container">
      {/* Header */}
      <div className="header">
        <div className="header-top">
          <div className="logo">
            STO<span>A</span>
          </div>
          <div className="header-actions">
            <button className="icon-btn" onClick={locateUser} title="My location">
              📍
            </button>
            <button className="icon-btn" title="Profile">
              👤
            </button>
          </div>
        </div>
        <div className="search-bar">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Search coffee shops in Brooklyn...
        </div>
        <div className="filter-row">
          {filters.map((f) => (
            <div
              key={f.key}
              className={`filter-chip ${activeFilter === f.key ? "active" : ""}`}
              onClick={() => handleFilter(f.key)}
            >
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div ref={mapRef} id="map" />

      {/* Bottom Sheet */}
      <BottomSheet shops={filteredShops} onShopClick={handleShopClick} />

      {/* Shop Detail Panel */}
      <ShopDetail
        shop={selectedShop}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onCheckin={() => setCheckinOpen(true)}
      />

      {/* Check-in Modal */}
      <CheckIn
        shop={selectedShop}
        isOpen={checkinOpen}
        onClose={() => setCheckinOpen(false)}
        onSubmit={handleCheckinSubmit}
      />

      {/* Toast */}
      <div className={`toast ${showToast ? "show" : ""}`}>
        ✓ Report submitted! Thanks for helping.
      </div>

      {/* Nav Bar */}
      <div className="nav-bar">
        <div className="nav-item active">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Map
        </div>
        <div className="nav-item">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          List
        </div>
        <div className="nav-item" onClick={() => setCheckinOpen(true)}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
          Check In
        </div>
        <div className="nav-item">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </div>
      </div>
    </div>
  );
}
