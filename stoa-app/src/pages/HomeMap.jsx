import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { occupancyLabels, occupancyColors, occupancyBgColors, occupancyTextColors, assignOccupancy, isRealCoffeeShop } from "../data/mockShops";
import CheckIn from "./CheckIn";

var GOOGLE_API_KEY = "AIzaSyDzcPX4NtY51Hl28Nly3NeqsxpTDiYoY48";
var filters = [
  { key: "all", label: "All" },
  { key: "low", label: "Available" },
  { key: "mid", label: "Moderate" },
  { key: "high", label: "Full" },
];

function parsePlace(place, index) {
  var isOpen = place.currentOpeningHours ? place.currentOpeningHours.openNow : null;
  var occ = assignOccupancy(isOpen);
  var addressParts = place.formattedAddress ? place.formattedAddress.split(",") : [];
  var neighborhood = addressParts.length > 1 ? addressParts[1].trim() : "Brooklyn";
  var hours = place.regularOpeningHours ? (place.regularOpeningHours.weekdayDescriptions || []) : [];
  var reviews = (place.reviews || []).slice(0, 5).map(function(r) {
    return { author: r.authorAttribution ? r.authorAttribution.displayName : "Anonymous", rating: r.rating || 0, text: r.text ? r.text.text : "", relativeTime: r.relativePublishTimeDescription || "" };
  });
  return Object.assign({ id: index + 1, placeId: place.id, name: place.displayName ? place.displayName.text : "Coffee Shop", address: place.formattedAddress || "", neighborhood: neighborhood, lat: place.location ? place.location.latitude : 0, lng: place.location ? place.location.longitude : 0, rating: place.rating || null, isOpen: isOpen, photoRef: place.photos && place.photos.length > 0 ? place.photos[0].name : null, hours: hours, reviews: reviews, workspaceInfo: null }, occ);
}

function sortShops(shops) {
  return shops.sort(function(a, b) {
    if (a.occupancy === "closed" && b.occupancy !== "closed") return 1;
    if (a.occupancy !== "closed" && b.occupancy === "closed") return -1;
    return ({ low: 0, mid: 1, high: 2, closed: 3 })[a.occupancy] - ({ low: 0, mid: 1, high: 2, closed: 3 })[b.occupancy];
  });
}

function getPhotoUrl(ref, width) {
  if (!ref) return null;
  return "https://places.googleapis.com/v1/" + ref + "/media?maxWidthPx=" + width + "&key=" + GOOGLE_API_KEY;
}

function SideDetail(props) {
  var shop = props.shop, onClose = props.onClose, onCheckin = props.onCheckin;
  if (!shop) return null;
  var isClosed = shop.occupancy === "closed";
  var statusColor = isClosed ? "#9E9E9E" : occupancyColors[shop.occupancy];
  var statusLabel = isClosed ? "Closed" : occupancyLabels[shop.occupancy];
  var badge = { background: occupancyBgColors[shop.occupancy], color: occupancyTextColors[shop.occupancy] };
  var photoUrl = getPhotoUrl(shop.photoRef, 600);
  var dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  var jsDay = new Date().getDay();
  var today = dayNames[jsDay === 0 ? 6 : jsDay - 1];
  var formattedHours = (shop.hours && shop.hours.length > 0) ? shop.hours.map(function(h) { return { text: h, isToday: h.toLowerCase().startsWith(today.toLowerCase()) }; }) : null;

  return React.createElement("div", {className: "side-detail"},
    React.createElement("button", {className: "side-detail-close", onClick: onClose}, "\u2715"),
    React.createElement("div", {className: "side-detail-photo"},
      photoUrl ? React.createElement("img", {src: photoUrl, alt: shop.name, onError: function(e){e.target.style.display="none"}}) : React.createElement("div", {className: "side-detail-photo-placeholder"}, "\u2615")
    ),
    React.createElement("div", {className: "side-detail-body"},
      React.createElement("div", {className: "side-detail-header"},
        React.createElement("div", {className: "side-detail-name"}, shop.name),
        React.createElement("div", {className: "occ-badge", style: badge}, isClosed ? "CLOSED" : "AVAILABLE NOW")
      ),
      React.createElement("div", {className: "side-detail-address"}, shop.address),
      shop.rating ? React.createElement("div", {className: "side-detail-rating"}, "\u2B50 " + shop.rating + " on Google") : null,
      React.createElement("div", {className: "side-detail-stats"},
        React.createElement("div", {className: "side-stat-box"},
          React.createElement("div", {className: "side-stat-label"}, "LIVE OCCUPANCY"),
          React.createElement("div", {className: "side-stat-value"},
            React.createElement("span", {style: {color: statusColor, fontWeight: 700, fontSize: "24px"}}, shop.occupancyPct + "%"),
            React.createElement("span", {style: {fontSize: "12px", color: "#999", marginLeft: "6px"}}, statusLabel)
          )
        ),
        shop.rating ? React.createElement("div", {className: "side-stat-box"},
          React.createElement("div", {className: "side-stat-label"}, "RATING"),
          React.createElement("div", {className: "side-stat-value"}, React.createElement("span", {style: {fontWeight: 700, fontSize: "24px"}}, "\u2B50 " + shop.rating))
        ) : null
      ),
      !isClosed ? React.createElement("button", {className: "side-checkin-btn", onClick: onCheckin}, "Check In Now") : null,
      React.createElement("div", {className: "side-section"},
        React.createElement("div", {className: "side-section-title"}, "WORKSPACE INFO"),
        React.createElement("div", {className: "side-amenity-row"},
          React.createElement("div", {className: "side-amenity"}, React.createElement("span", null, "\uD83D\uDCF6"), " WiFi"),
          React.createElement("div", {className: "side-amenity"}, React.createElement("span", null, "\uD83D\uDD0C"), " Outlets"),
          React.createElement("div", {className: "side-amenity"}, React.createElement("span", null, "\uD83D\uDD07"), " Quiet")
        ),
        React.createElement("div", {className: "side-amenity-note"}, "Not yet reported \u2014 be the first!")
      ),
      React.createElement("div", {className: "side-section"},
        React.createElement("div", {className: "side-section-title"}, "HOURS"),
        React.createElement("div", {className: "side-hours"},
          formattedHours ? formattedHours.map(function(h, i) {
            return React.createElement("div", {key: i, className: "side-hours-row", style: h.isToday ? {fontWeight: 700, color: "#3E2723"} : {}}, (h.isToday ? "\u25B8 " : "") + h.text);
          }) : React.createElement("div", {style: {fontSize: "13px", color: "#999"}}, "Hours not available")
        )
      ),
      React.createElement("div", {className: "side-section"},
        React.createElement("div", {className: "side-section-title"}, "REVIEWS"),
        shop.reviews && shop.reviews.length > 0 ? shop.reviews.map(function(review, i) {
          return React.createElement("div", {key: i, className: "side-review"},
            React.createElement("div", {className: "side-review-top"},
              React.createElement("span", {className: "side-review-author"}, review.author),
              React.createElement("span", {className: "side-review-stars"}, "\u2B50".repeat(Math.round(review.rating)))
            ),
            React.createElement("div", {className: "side-review-time"}, review.relativeTime),
            React.createElement("div", {className: "side-review-text"}, review.text)
          );
        }) : React.createElement("div", {style: {fontSize: "13px", color: "#999"}}, "No reviews yet")
      ),
      React.createElement("div", {className: "side-actions"},
        React.createElement("button", {className: "btn-primary", onClick: function() { window.open("https://www.google.com/maps/dir/?api=1&destination=" + shop.lat + "," + shop.lng, "_blank"); }}, "Get Directions")
      )
    )
  );
}

function ShopListCard(props) {
  var shop = props.shop, onClick = props.onClick, isSelected = props.isSelected;
  var isClosed = shop.occupancy === "closed";
  var badge = { background: occupancyBgColors[shop.occupancy], color: occupancyTextColors[shop.occupancy] };
  var photoUrl = getPhotoUrl(shop.photoRef, 400);

  return React.createElement("div", {className: "shop-list-card" + (isSelected ? " selected" : "") + (isClosed ? " dimmed" : ""), onClick: function() { onClick(shop); }},
    React.createElement("div", {className: "shop-list-photo"},
      photoUrl ? React.createElement("img", {src: photoUrl, alt: shop.name, onError: function(e){e.target.style.display="none"}}) : React.createElement("div", {className: "shop-list-photo-placeholder"}, "\u2615")
    ),
    React.createElement("div", {className: "shop-list-info"},
      React.createElement("div", {className: "shop-list-name"}, shop.name),
      React.createElement("div", {className: "shop-list-address"}, shop.neighborhood),
      React.createElement("div", {className: "shop-list-bottom"},
        React.createElement("div", {className: "occ-badge", style: badge}, isClosed ? "CLOSED" : occupancyLabels[shop.occupancy]),
        shop.rating ? React.createElement("span", {className: "shop-list-rating"}, "\u2B50 " + shop.rating) : null
      )
    )
  );
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
  var [checkinOpen, setCheckinOpen] = useState(false);
  var [showToast, setShowToast] = useState(false);
  var [loading, setLoading] = useState(true);
  var [showSearchArea, setShowSearchArea] = useState(false);
  var [searchQuery, setSearchQuery] = useState("");
  var [searchOpen, setSearchOpen] = useState(false);

  var fetchNearbyShops = useCallback(function(lat, lng) {
    setLoading(true);
    fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_API_KEY, "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating,places.id,places.photos,places.currentOpeningHours,places.regularOpeningHours,places.reviews" },
      body: JSON.stringify({ includedTypes: ["coffee_shop"], maxResultCount: 20, locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 5000.0 } } }),
    }).then(function(r){return r.json()}).then(function(data) {
      if (data.places && data.places.length > 0) {
        var shops = sortShops(data.places.filter(function(p){return isRealCoffeeShop(p.displayName?p.displayName.text:"")}).map(function(p,i){return parsePlace(p,i)}));
        setAllShops(shops); setFilteredShops(shops); setActiveFilter("all");
      } else { setAllShops([]); setFilteredShops([]); }
      setLoading(false);
    }).catch(function(){setLoading(false)});
  }, []);

  var searchPlaces = function(query) {
    if (!query.trim()) return;
    setLoading(true); setSearchOpen(false);
    fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_API_KEY, "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating,places.id,places.photos,places.currentOpeningHours,places.regularOpeningHours,places.reviews" },
      body: JSON.stringify({ textQuery: query + " coffee shop", locationBias: { circle: { center: { latitude: 40.6782, longitude: -73.9442 }, radius: 15000.0 } }, maxResultCount: 20 }),
    }).then(function(r){return r.json()}).then(function(data) {
      if (data.places && data.places.length > 0) {
        var shops = sortShops(data.places.filter(function(p){return isRealCoffeeShop(p.displayName?p.displayName.text:"")}).map(function(p,i){return parsePlace(p,i)}));
        setAllShops(shops); setFilteredShops(shops); setActiveFilter("all");
        if (shops.length > 0 && mapInstanceRef.current) mapInstanceRef.current.fitBounds(L.latLngBounds(shops.map(function(s){return [s.lat,s.lng]})),{padding:[50,50]});
      } else { setAllShops([]); setFilteredShops([]); }
      setLoading(false);
    }).catch(function(){setLoading(false)});
  };

  useEffect(function() {
    if (mapInstanceRef.current) return;
    var map = L.map(mapRef.current, { center: [40.6782, -73.9442], zoom: 14, zoomControl: false });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { attribution: "", subdomains: "abcd", maxZoom: 19 }).addTo(map);
    map.on("moveend", function(){setShowSearchArea(true)});
    mapInstanceRef.current = map;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        var lat=pos.coords.latitude,lng=pos.coords.longitude;
        map.flyTo([lat,lng],15,{duration:1});
        var ui=L.divIcon({className:"user-location-marker",html:'<div style="width:16px;height:16px;background:#2979FF;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(41,121,255,0.25),0 2px 8px rgba(0,0,0,0.2)"></div>',iconSize:[16,16],iconAnchor:[8,8]});
        if(userMarkerRef.current)map.removeLayer(userMarkerRef.current);
        userMarkerRef.current=L.marker([lat,lng],{icon:ui,zIndexOffset:1000}).addTo(map);
        fetchNearbyShops(lat,lng);
      },function(){fetchNearbyShops(40.6782,-73.9442)},{enableHighAccuracy:true,timeout:10000});
    } else fetchNearbyShops(40.6782,-73.9442);
    return function(){map.remove();mapInstanceRef.current=null};
  }, [fetchNearbyShops]);

  useEffect(function() {
    var map=mapInstanceRef.current; if(!map)return;
    markersRef.current.forEach(function(m){map.removeLayer(m)}); markersRef.current=[];
    filteredShops.forEach(function(shop) {
      if(!shop.lat||!shop.lng)return;
      var cls=shop.occupancy==="closed"?"closed":shop.occupancy;
      var sn=shop.name.length>12?shop.name.substring(0,12)+"\u2026":shop.name;
      var ic=L.divIcon({className:"custom-marker",html:'<div class="marker-bubble '+cls+'">'+sn+'</div>',iconSize:[0,0],iconAnchor:[50,30]});
      var mk=L.marker([shop.lat,shop.lng],{icon:ic}).addTo(map);
      mk.on("click",function(){setSelectedShop(shop);map.flyTo([shop.lat,shop.lng],16,{duration:0.5})});
      markersRef.current.push(mk);
    });
  }, [filteredShops]);

  var handleFilter=function(key){setActiveFilter(key);setFilteredShops(key==="all"?allShops:allShops.filter(function(s){return s.occupancy===key}))};
  var handleShopClick=function(shop){setSelectedShop(shop);if(mapInstanceRef.current)mapInstanceRef.current.flyTo([shop.lat,shop.lng],16,{duration:0.5})};
  var handleSearchArea=function(){var map=mapInstanceRef.current;if(!map)return;var c=map.getCenter();fetchNearbyShops(c.lat,c.lng);setShowSearchArea(false)};
  var locateUser=function(){if(navigator.geolocation)navigator.geolocation.getCurrentPosition(function(pos){var map=mapInstanceRef.current;if(map){var lat=pos.coords.latitude,lng=pos.coords.longitude;map.flyTo([lat,lng],15,{duration:0.8});var ui=L.divIcon({className:"user-location-marker",html:'<div style="width:16px;height:16px;background:#2979FF;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(41,121,255,0.25),0 2px 8px rgba(0,0,0,0.2)"></div>',iconSize:[16,16],iconAnchor:[8,8]});if(userMarkerRef.current)map.removeLayer(userMarkerRef.current);userMarkerRef.current=L.marker([lat,lng],{icon:ui,zIndexOffset:1000}).addTo(map);fetchNearbyShops(lat,lng);setShowSearchArea(false)}})};
  var handleSearchSubmit=function(e){e.preventDefault();if(searchQuery.trim()){searchPlaces(searchQuery.trim());setSearchQuery("")}};

  return React.createElement("div", {className: "app-layout"},
    React.createElement("div", {className: "left-panel"},
      React.createElement("div", {className: "left-panel-header"},
        React.createElement("div", {className: "logo"}, "STO", React.createElement("span", null, "A")),
        React.createElement("div", {className: "header-actions"},
          React.createElement("button", {className: "icon-btn", onClick: locateUser}, "\uD83D\uDCCD"),
          React.createElement("button", {className: "icon-btn"}, "\uD83D\uDC64")
        )
      ),
      searchOpen ? React.createElement("div", {className: "search-row"},
        React.createElement("input", {type: "text", className: "search-input", placeholder: "Try 'Williamsburg' or 'Blue Bottle'...", value: searchQuery, onChange: function(e){setSearchQuery(e.target.value)}, autoFocus: true, onKeyDown: function(e){if(e.key==="Enter")handleSearchSubmit(e);if(e.key==="Escape")setSearchOpen(false)}}),
        React.createElement("button", {className: "search-go-btn", onClick: handleSearchSubmit}, "Go"),
        React.createElement("button", {className: "search-cancel-btn", onClick: function(){setSearchOpen(false)}}, "\u2715")
      ) : React.createElement("div", {className: "search-bar", onClick: function(){setSearchOpen(true)}},
        React.createElement("svg", {width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2"}, React.createElement("circle", {cx: "11", cy: "11", r: "8"}), React.createElement("path", {d: "m21 21-4.35-4.35"})),
        loading ? "Finding coffee shops..." : "Search cafes, neighborhoods..."
      ),
      React.createElement("div", {className: "filter-row"}, filters.map(function(f) {
        return React.createElement("div", {key: f.key, className: "filter-chip" + (activeFilter===f.key?" active":""), onClick: function(){handleFilter(f.key)}}, f.label);
      })),
      React.createElement("div", {className: "left-panel-content"},
        selectedShop ? React.createElement(SideDetail, {shop: selectedShop, onClose: function(){setSelectedShop(null)}, onCheckin: function(){setCheckinOpen(true)}}) : React.createElement("div", {className: "shop-list"},
          filteredShops.map(function(shop){return React.createElement(ShopListCard, {key: shop.id, shop: shop, onClick: handleShopClick, isSelected: false})}),
          !loading && filteredShops.length === 0 ? React.createElement("div", {className: "empty-state"}, "No coffee shops found. Try searching or moving the map.") : null
        )
      )
    ),
    React.createElement("div", {className: "map-area"},
      React.createElement("div", {ref: mapRef, id: "map"}),
      showSearchArea && !loading ? React.createElement("button", {className: "search-area-btn", onClick: handleSearchArea}, "\uD83D\uDD04 Search this area") : null
    ),
    React.createElement(CheckIn, {shop: selectedShop, isOpen: checkinOpen, onClose: function(){setCheckinOpen(false)}, onSubmit: function(){setCheckinOpen(false);setShowToast(true);setTimeout(function(){setShowToast(false)},2500)}}),
    React.createElement("div", {className: "toast" + (showToast ? " show" : "")}, "\u2713 Report submitted! Thanks for helping.")
  );
}
