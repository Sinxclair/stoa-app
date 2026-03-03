import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { occupancyLabels, occupancyColors, assignOccupancy, isRealCoffeeShop } from "../data/mockShops";
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

function parsePlace(place, index) {
  var isOpen = place.currentOpeningHours ? place.currentOpeningHours.openNow : null;
  var occ = assignOccupancy(isOpen);
  var addressParts = place.formattedAddress ? place.formattedAddress.split(",") : [];
  var neighborhood = addressParts.length > 1 ? addressParts[1].trim() : "Brooklyn";
  var hours = place.regularOpeningHours ? (place.regularOpeningHours.weekdayDescriptions || []) : [];
  var reviews = (place.reviews || []).slice(0, 5).map(function(r) {
    return {
      author: r.authorAttribution ? r.authorAttribution.displayName : "Anonymous",
      rating: r.rating || 0,
      text: r.text ? r.text.text : "",
      relativeTime: r.relativePublishTimeDescription || "",
    };
  });
  return Object.assign({
    id: index + 1,
    placeId: place.id,
    name: place.displayName ? place.displayName.text : "Coffee Shop",
    address: place.formattedAddress || "",
    neighborhood: neighborhood,
    lat: place.location ? place.location.latitude : 0,
    lng: place.location ? place.location.longitude : 0,
    rating: place.rating || null,
    isOpen: isOpen,
    photoRef: place.photos && place.photos.length > 0 ? place.photos[0].name : null,
    hours: hours,
    reviews: reviews,
    workspaceInfo: null,
  }, occ);
}

function sortShops(shops) {
  return shops.sort(function(a, b) {
    if (a.occupancy === "closed" && b.occupancy !== "closed") return 1;
    if (a.occupancy !== "closed" && b.occupancy === "closed") return -1;
    var order = { low: 0, mid: 1, high: 2, closed: 3 };
    return order[a.occupancy] - order[b.occupancy];
  });
}

export default function HomeMap() {
  var mapRef = useRef(null);
  var mapInstanceRef = useRef(null);
  var markersRef = useRef([]);
  var userMarkerRef = useRef(null);

  var [allShops, setAllShops] = useState([]);
  var [activeFilter, setActiveFilter] = useState("all");
  var [filteredShops, setFilteredShops] = useState([]);
  var [selectedShop, setSelectedShop] = useState(null);
  var [detailOpen, setDetailOpen] = useState(false);
  var [checkinOpen, setCheckinOpen] = useState(false);
  var [showToast, setShowToast] = useState(false);
  var [loading, setLoading] = useState(true);
  var [showSearchArea, setShowSearchArea] = useState(false);
  var [searchQuery, setSearchQuery] = useState("");
  var [searchOpen, setSearchOpen] = useState(false);

  var fetchNearbyShops = useCallback(function(lat, lng) {
    setLoading(true);
    var url = "https://places.googleapis.com/v1/places:searchNearby";
    var body = {
      includedTypes: ["coffee_shop"],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 3000.0,
        },
      },
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating,places.id,places.photos,places.currentOpeningHours,places.regularOpeningHours,places.reviews",
      },
      body: JSON.stringify(body),
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.places && data.places.length > 0) {
        var shops = data.places
          .filter(function(p) { return isRealCoffeeShop(p.displayName ? p.displayName.text : ""); })
          .map(function(p, i) { return parsePlace(p, i); });
        shops = sortShops(shops);
        setAllShops(shops);
        setFilteredShops(shops);
        setActiveFilter("all");
      } else {
        setAllShops([]);
        setFilteredShops([]);
      }
      setLoading(false);
    })
    .catch(function(err) {
      console.error("Error:", err);
      setLoading(false);
    });
  }, []);

  var searchPlaces = function(query) {
    if (!query.trim()) return;
    setLoading(true);
    setSearchOpen(false);
    var url = "https://places.googleapis.com/v1/places:searchText";
    var body = {
      textQuery: query + " coffee shop",
      locationBias: {
        circle: {
          center: { latitude: 40.6782, longitude: -73.9442 },
          radius: 15000.0,
        },
      },
      maxResultCount: 20,
    };

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating,places.id,places.photos,places.currentOpeningHours,places.regularOpeningHours,places.reviews",
      },
      body: JSON.stringify(body),
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.places && data.places.length > 0) {
        var shops = data.places
          .filter(function(p) { return isRealCoffeeShop(p.displayName ? p.displayName.text : ""); })
          .map(function(p, i) { return parsePlace(p, i); });
        shops = sortShops(shops);
        setAllShops(shops);
        setFilteredShops(shops);
        setActiveFilter("all");
        if (shops.length > 0 && mapInstanceRef.current) {
          var bounds = L.latLngBounds(shops.map(function(s) { return [s.lat, s.lng]; }));
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      } else {
        setAllShops([]);
        setFilteredShops([]);
      }
      setLoading(false);
    })
    .catch(function(err) {
      console.error("Error:", err);
      setLoading(false);
    });
  };

  useEffect(function() {
    if (mapInstanceRef.current) return;

    var map = L.map(mapRef.current, {
      center: [40.6782, -73.9442],
      zoom: 14,
      zoomControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    map.on("moveend", function() { setShowSearchArea(true); });

    mapInstanceRef.current = map;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          var lat = pos.coords.latitude;
          var lng = pos.coords.longitude;
          map.flyTo([lat, lng], 15, { duration: 1 });
          var userIcon = L.divIcon({
            className: "user-location-marker",
            html: '<div style="width:16px;height:16px;background:#2979FF;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(41,121,255,0.25),0 2px 8px rgba(0,0,0,0.2);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
          userMarkerRef.current = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
          fetchNearbyShops(lat, lng);
        },
        function() { fetchNearbyShops(40.6782, -73.9442); },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      fetchNearbyShops(40.6782, -73.9442);
    }

    return function() { map.remove(); mapInstanceRef.current = null; };
  }, [fetchNearbyShops]);

  useEffect(function() {
    var map = mapInstanceRef.current;
    if (!map) return;
    markersRef.current.forEach(function(m) { map.removeLayer(m); });
    markersRef.current = [];

    filteredShops.forEach(function(shop) {
      if (!shop.lat || !shop.lng) return;
      var isClosed = shop.occupancy === "closed";
      var cssClass = isClosed ? "closed" : shop.occupancy === "low" ? "low" : shop.occupancy === "mid" ? "mid" : "high";
      var shortName = shop.name.length > 12 ? shop.name.substring(0, 12) + "…" : shop.name;
      var icon = L.divIcon({
        className: "custom-marker",
        html: '<div class="marker-bubble ' + cssClass + '">' + shortName + '</div>',
        iconSize: [0, 0],
        iconAnchor: [50, 30],
      });
      var marker = L.marker([shop.lat, shop.lng], { icon: icon }).addTo(map);
      marker.on("click", function() {
        setSelectedShop(shop);
        setDetailOpen(true);
        map.flyTo([shop.lat, shop.lng], 16, { duration: 0.5 });
      });
      markersRef.current.push(marker);
    });
  }, [filteredShops]);

  var handleFilter = function(key) {
    setActiveFilter(key);
    if (key === "all") { setFilteredShops(allShops); }
    else { setFilteredShops(allShops.filter(function(s) { return s.occupancy === key; })); }
  };

  var handleShopClick = function(shop) {
    setSelectedShop(shop);
    setDetailOpen(true);
    if (mapInstanceRef.current) mapInstanceRef.current.flyTo([shop.lat, shop.lng], 16, { duration: 0.5 });
  };

  var handleCheckinSubmit = function() {
    setCheckinOpen(false);
    setShowToast(true);
    setTimeout(function() { setShowToast(false); }, 2500);
  };

  var handleSearchArea = function() {
    var map = mapInstanceRef.current;
    if (!map) return;
    var center = map.getCenter();
    fetchNearbyShops(center.lat, center.lng);
    setShowSearchArea(false);
  };

  var locateUser = function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        var map = mapInstanceRef.current;
        if (map) {
          var lat = pos.coords.latitude;
          var lng = pos.coords.longitude;
          map.flyTo([lat, lng], 15, { duration: 0.8 });
          var userIcon = L.divIcon({
            className: "user-location-marker",
            html: '<div style="width:16px;height:16px;background:#2979FF;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(41,121,255,0.25),0 2px 8px rgba(0,0,0,0.2);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });
          if (userMarkerRef.current) map.removeLayer(userMarkerRef.current);
          userMarkerRef.current = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
          fetchNearbyShops(lat, lng);
          setShowSearchArea(false);
        }
      });
    }
  };

  var handleSearchSubmit = function(e) {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchPlaces(searchQuery.trim());
      setSearchQuery("");
    }
  };

  return (
    <div className="home-map-container">
      <div className="header">
        <div className="header-top">
          <div className="logo">STO<span>A</span></div>
          <div className="header-actions">
            <button className="icon-btn" onClick={locateUser} title="My location">📍</button>
            <button className="icon-btn" title="Profile">👤</button>
          </div>
        </div>

        {searchOpen ? (
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              className="search-input"
              placeholder="Try 'Williamsburg' or 'Blue Bottle'..."
              value={searchQuery}
              onChange={function(e) { setSearchQuery(e.target.value); }}
              autoFocus
              onKeyDown={function(e) {
                if (e.key === "Enter") handleSearchSubmit(e);
                if (e.key === "Escape") setSearchOpen(false);
              }}
            />
            <button className="search-go-btn" onClick={handleSearchSubmit}>Go</button>
            <button className="search-cancel-btn" onClick={function() { setSearchOpen(false); }}>✕</button>
          </div>
        ) : (
          <div className="search-bar" onClick={function() { setSearchOpen(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            {loading ? "Finding coffee shops near you..." : allShops.length + " coffee shops · Tap to search"}
          </div>
        )}

        <div className="filter-row">
          {filters.map(function(f) {
            return (
              <div key={f.key} className={"filter-chip " + (activeFilter === f.key ? "active" : "")} onClick={function() { handleFilter(f.key); }}>
                {f.label}
              </div>
            );
          })}
        </div>
      </div>

      <div ref={mapRef} id="map" />

      {showSearchArea && !loading && (
        <button className="search-area-btn" onClick={handleSearchArea}>🔄 Search this area</button>
      )}

      <BottomSheet shops={filteredShops} onShopClick={handleShopClick} />

      <ShopDetail shop={selectedShop} isOpen={detailOpen} onClose={function() { setDetailOpen(false); }} onCheckin={function() { setCheckinOpen(true); }} />

      <CheckIn shop={selectedShop} isOpen={checkinOpen} onClose={function() { setCheckinOpen(false); }} onSubmit={handleCheckinSubmit} />

      <div className={"toast " + (showToast ? "show" : "")}>✓ Report submitted! Thanks for helping.</div>

      <div className="nav-bar">
        <div className="nav-item active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
          Map
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
          List
        </div>
        <div className="nav-item" onClick={function() { setCheckinOpen(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M12 6v6l4 2" /></svg>
          Check In
        </div>
        <div className="nav-item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          Profile
        </div>
      </div>
    </div>
  );
}
