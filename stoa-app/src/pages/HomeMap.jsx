import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { occupancyLabels, occupancyColors } from "../data/mockShops";
import BottomSheet from "../components/BottomSheet";
import ShopDetail from "./ShopDetail";
import CheckIn from "./CheckIn";

const GOOGLE_API_KEY = "AIzaSyDzcPX4NtY51Hl28Nly3NeqsxpTDiYoY48";

const filters = [
  { key: "all", label: "All" },
  { key: "low", label: "🟢 Available" },
  { key: "mid", label: "🟡 Moderate" },
  { key: "high", label: "🔴 Full" },
];

// Assign random occupancy for MVP (will be replaced by real crowdsourced data)
function assignOccupancy() {
  const levels = ["low", "low", "low", "mid", "mid", "high"];
  const level = levels[Math.floor(Math.random() * levels.length)];
  const pcts = { low: Math.floor(Math.random() * 30 + 5), mid: Math.floor(Math.random() * 25 + 40), high: Math.floor(Math.random() * 20 + 75) };
  return { occupancy: level, occupancyPct: pcts[level], updatedMinAgo: Math.floor(Math.random() * 15 + 1) };
}

export default function HomeMap() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  const [allShops, setAllShops] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [filteredShops, setFilteredShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch nearby coffee shops from Google Places
  const fetchNearbyShops = async (lat, lng) => {
    try {
      const url = `https://places.googleapis.com/v1/places:searchNearby`;
      const body = {
        includedTypes: ["cafe", "coffee_shop"],
        maxResultCount: 20,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: 2000.0,
          },
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating,places.id,places.photos,places.currentOpeningHours",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.places && data.places.length > 0) {
        const shops = data.places.map((place, index) => {
          const occ = assignOccupancy();
          // Extract neighborhood from address
          const addressParts = place.formattedAddress ? place.formattedAddress.split(",") : [];
          const neighborhood = addressParts.length > 1 ? addressParts[1].trim() : "Brooklyn";

          return {
            id: index + 1,
            placeId: place.id,
            name: place.displayName?.text || "Coffee Shop",
            address: place.formattedAddress || "",
            neighborhood: neighborhood,
            lat: place.location?.latitude,
            lng: place.location?.longitude,
            rating: place.rating || null,
            isOpen: place.currentOpeningHours?.openNow ?? null,
            photoRef: place.photos && place.photos.length > 0 ? place.photos[0].name : null,
            ...occ,
          };
        });

        setAllShops(shops);
        setFilteredShops(shops);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching places:", error);
      setLoading(false);
      // Fall back to empty state
      setAllShops([]);
      setFilteredShops([]);
    }
  };

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [40.6782, -73.9442], // Default Brooklyn
      zoom: 14,
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

    // Get user's real location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          map.flyTo([latitude, longitude], 15, { duration: 1 });

          // Blue dot for user
          const userIcon = L.divIcon({
            className: "user-location-marker",
            html: '<div style="width:16px;height:16px;background:#2979FF;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(41,121,255,0.25),0 2px 8px rgba(0,0,0,0.2);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
          userMarkerRef.current = L.marker([latitude, longitude], {
            icon: userIcon,
            zIndexOffset: 1000,
          }).addTo(map);

          // Fetch real coffee shops near user
          fetchNearbyShops(latitude, longitude);
        },
        (err) => {
          console.log("Location denied, using default Brooklyn center");
          // Fetch shops around default Brooklyn location
          fetchNearbyShops(40.6782, -73.9442);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      fetchNearbyShops(40.6782, -73.9442);
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when shops/filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    filteredShops.forEach((shop) => {
      if (!shop.lat || !shop.lng) return;

      const cssClass =
        shop.occupancy === "low" ? "low" : shop.occupancy === "mid" ? "mid" : "high";

      // Shorten name for marker bubble
      const shortName = shop.name.length > 12 ? shop.name.substring(0, 12) + "…" : shop.name;

      const icon = L.divIcon({
        className: "custom-marker",
        html: '<div class="marker-bubble ' + cssClass + '">' + shortName + "</div>",
        iconSize: [0, 0],
        iconAnchor: [50, 30],
      });

      const marker = L.marker([shop.lat, shop.lng], { icon }).addTo(map);
      marker.on("click", () => {
        setSelectedShop(shop);
        setDetailOpen(true);
        map.flyTo([shop.lat, shop.lng], 16, { duration: 0.5 });
      });
      markersRef.current.push(marker);
    });
  }, [filteredShops]);

  const handleFilter = (key) => {
    setActiveFilter(key);
    if (key === "all") {
      setFilteredShops(allShops);
    } else {
      setFilteredShops(allShops.filter((s) => s.occupancy === key));
    }
  };

  const handleShopClick = (shop) => {
    setSelectedShop(shop);
    setDetailOpen(true);
    const map = mapInstanceRef.current;
    if (map) map.flyTo([shop.lat, shop.lng], 16, { duration: 0.5 });
  };

  const handleCheckinSubmit = (level) => {
    setCheckinOpen(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const map = mapInstanceRef.current;
        if (map) {
          const { latitude, longitude } = pos.coords;
          map.flyTo([latitude, longitude], 15, { duration: 0.8 });

          const userIcon = L.divIcon({
            className: "user-location-marker",
            html: '<div style="width:16px;height:16px;background:#2979FF;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(41,121,255,0.25),0 2px 8px rgba(0,0,0,0.2);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
          userMarkerRef.current = L.marker([latitude, longitude], {
            icon: userIcon,
            zIndexOffset: 1000,
          }).addTo(map);

          // Re-fetch shops for new location
          fetchNearbyShops(latitude, longitude);
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          {loading ? "Finding coffee shops near you..." : `${allShops.length} coffee shops near you`}
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Map
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
          Check In
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </div>
      </div>
    </div>
  );
}
