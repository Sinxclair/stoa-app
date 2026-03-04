import React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { occupancyLabels, occupancyColors, occupancyBgColors, occupancyTextColors, assignOccupancy, isRealCoffeeShop } from "../data/mockShops";
import CheckIn from "./CheckIn";

var GOOGLE_API_KEY = "AIzaSyDzcPX4NtY51Hl28Nly3NeqsxpTDiYoY48";
var SEARCH_RADIUS = 1600;
var filters = [
  { key: "all", label: "All" },
  { key: "low", label: "Available" },
  { key: "mid", label: "Moderate" },
  { key: "high", label: "Full" },
];

/* --- Types that should NEVER appear --- */
var REJECTED_TYPES = [
  "movie_theater", "bar", "night_club", "restaurant", "american_restaurant",
  "italian_restaurant", "mexican_restaurant", "chinese_restaurant", "japanese_restaurant",
  "korean_restaurant", "thai_restaurant", "indian_restaurant", "french_restaurant",
  "greek_restaurant", "turkish_restaurant", "lebanese_restaurant", "vietnamese_restaurant",
  "spanish_restaurant", "seafood_restaurant", "brazilian_restaurant", "barbecue_restaurant",
  "fast_food_restaurant", "hamburger_restaurant", "pizza_restaurant", "steak_house",
  "sushi_restaurant", "ramen_restaurant", "mediterranean_restaurant", "middle_eastern_restaurant",
  "breakfast_restaurant", "brunch_restaurant", "fine_dining_restaurant", "buffet_restaurant",
  "afghani_restaurant", "african_restaurant", "asian_restaurant",
  "bar_and_grill", "wine_bar", "pub",
  "ice_cream_shop", "dessert_shop", "dessert_restaurant",
  "gym", "fitness_center", "spa", "hair_salon", "beauty_salon",
  "clothing_store", "department_store", "shopping_mall",
  "hotel", "lodging", "hospital", "dentist", "doctor",
  "movie_rental", "casino", "amusement_park",
  "gas_station", "car_wash", "car_repair", "parking",
  "grocery_store", "supermarket", "convenience_store",
  "liquor_store", "drugstore", "pharmacy",
  "church", "mosque", "synagogue",
  "school", "university", "library",
  "bank", "atm", "post_office",
  "real_estate_agency", "insurance_agency", "lawyer",
];

/* --- Types that CONFIRM it's a good place --- */
var GOOD_TYPES = [
  "coffee_shop", "cafe", "internet_cafe", "book_store",
];

function isGoodPlaceByType(types) {
  if (!types || types.length === 0) return true; /* no type info = let name filter handle it */
  /* reject if primary type is a rejected type */
  var hasRejected = types.some(function(t) { return REJECTED_TYPES.indexOf(t) !== -1; });
  var hasGood = types.some(function(t) { return GOOD_TYPES.indexOf(t) !== -1; });
  /* if it has a good type, keep it even if it also has a rejected type (e.g. cafe + restaurant) */
  if (hasGood) return true;
  /* if it only has rejected types and no good types, reject */
  if (hasRejected) return false;
  return true;
}

var neighborhoods = [
  { name: "Bay Ridge", lat: 40.6345, lng: -74.0214 },
  { name: "Park Slope", lat: 40.6710, lng: -73.9814 },
  { name: "Williamsburg", lat: 40.7081, lng: -73.9571 },
  { name: "Bushwick", lat: 40.6944, lng: -73.9213 },
  { name: "Gowanus", lat: 40.6733, lng: -73.9903 },
  { name: "Red Hook", lat: 40.6734, lng: -74.0080 },
  { name: "DUMBO", lat: 40.7033, lng: -73.9881 },
  { name: "Cobble Hill", lat: 40.6860, lng: -73.9969 },
  { name: "Carroll Gardens", lat: 40.6795, lng: -73.9991 },
  { name: "Prospect Heights", lat: 40.6775, lng: -73.9692 },
  { name: "Fort Greene", lat: 40.6892, lng: -73.9742 },
  { name: "Clinton Hill", lat: 40.6896, lng: -73.9659 },
  { name: "Bed-Stuy", lat: 40.6872, lng: -73.9418 },
  { name: "Crown Heights", lat: 40.6694, lng: -73.9422 },
  { name: "Greenpoint", lat: 40.7274, lng: -73.9514 },
  { name: "Flatbush", lat: 40.6524, lng: -73.9590 },
  { name: "Sunset Park", lat: 40.6464, lng: -74.0094 },
  { name: "Downtown BK", lat: 40.6930, lng: -73.9867 },
  { name: "Boerum Hill", lat: 40.6848, lng: -73.9846 },
  { name: "East Village", lat: 40.7265, lng: -73.9815 },
  { name: "West Village", lat: 40.7336, lng: -74.0027 },
  { name: "SoHo", lat: 40.7233, lng: -73.9985 },
  { name: "Chelsea", lat: 40.7465, lng: -74.0014 },
  { name: "Lower East Side", lat: 40.7150, lng: -73.9843 },
  { name: "Tribeca", lat: 40.7163, lng: -74.0086 },
  { name: "Flatiron", lat: 40.7395, lng: -73.9903 },
  { name: "Nolita", lat: 40.7234, lng: -73.9955 },
  { name: "Chinatown", lat: 40.7158, lng: -73.9970 },
  { name: "Financial District", lat: 40.7075, lng: -74.0089 },
];

var bkHoods = ["Bay Ridge","Park Slope","Williamsburg","Bushwick","Gowanus","Red Hook","DUMBO","Cobble Hill","Carroll Gardens","Prospect Heights","Fort Greene","Clinton Hill","Bed-Stuy","Crown Heights","Greenpoint","Flatbush","Sunset Park","Downtown BK","Boerum Hill"];
var mhHoods = ["East Village","West Village","SoHo","Chelsea","Lower East Side","Tribeca","Flatiron","Nolita","Chinatown","Financial District"];

function parsePlace(place, index) {
  var isOpen = place.currentOpeningHours ? place.currentOpeningHours.openNow : null;
  var occ = assignOccupancy(isOpen);
  var addressParts = place.formattedAddress ? place.formattedAddress.split(",") : [];
  var neighborhood = addressParts.length > 1 ? addressParts[1].trim() : "Brooklyn";
  var hours = place.regularOpeningHours ? (place.regularOpeningHours.weekdayDescriptions || []) : [];
  var reviews = (place.reviews || []).slice(0, 5).map(function(r) {
    return { author: r.authorAttribution ? r.authorAttribution.displayName : "Anonymous", rating: r.rating || 0, text: r.text ? r.text.text : "", relativeTime: r.relativePublishTimeDescription || "" };
  });
  return Object.assign({ id: place.id, placeId: place.id, name: place.displayName ? place.displayName.text : "Coffee Shop", address: place.formattedAddress || "", neighborhood: neighborhood, lat: place.location ? place.location.latitude : 0, lng: place.location ? place.location.longitude : 0, rating: place.rating || null, isOpen: isOpen, photoRef: place.photos && place.photos.length > 0 ? place.photos[0].name : null, hours: hours, reviews: reviews, workspaceInfo: null, types: place.types || [] }, occ);
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
  var [locationLabel, setLocationLabel] = useState("near you");
  var [filteredHoods, setFilteredHoods] = useState(neighborhoods);

  var apiHeaders = {"Content-Type": "application/json", "X-Goog-Api-Key": GOOGLE_API_KEY, "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.rating,places.id,places.photos,places.currentOpeningHours,places.regularOpeningHours,places.reviews,places.types,places.primaryType"};

  var fetchNearbyShops = useCallback(function(lat, lng, label) {
    setLoading(true);
    if (label) setLocationLabel(label);
    var makeBody = function(types) { return JSON.stringify({ includedTypes: types, maxResultCount: 20, locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: SEARCH_RADIUS } } }); };
    Promise.all([
      fetch("https://places.googleapis.com/v1/places:searchNearby", { method: "POST", headers: apiHeaders, body: makeBody(["coffee_shop"]) }).then(function(r){return r.json()}),
      fetch("https://places.googleapis.com/v1/places:searchNearby", { method: "POST", headers: apiHeaders, body: makeBody(["cafe"]) }).then(function(r){return r.json()})
    ]).then(function(results) {
      var allPlaces = []; var seenIds = {};
      results.forEach(function(data) { if (data.places) { data.places.forEach(function(p) { if (!seenIds[p.id]) { seenIds[p.id] = true; allPlaces.push(p); } }); } });
      var shops = sortShops(
        allPlaces
          .filter(function(p) {
            var name = p.displayName ? p.displayName.text : "";
            var types = p.types || [];
            return isRealCoffeeShop(name) && isGoodPlaceByType(types);
          })
          .map(function(p, i) { return parsePlace(p, i); })
      );
      setAllShops(shops); setFilteredShops(shops); setActiveFilter("all"); setLoading(false);
    }).catch(function(){setLoading(false)});
  }, []);

  var searchPlaces = function(query) {
    if (!query.trim()) return;
    setLoading(true); setSearchOpen(false); setLocationLabel(query);
    fetch("https://places.googleapis.com/v1/places:searchText", { method: "POST", headers: apiHeaders,
      body: JSON.stringify({ textQuery: query + " coffee cafe", locationBias: { circle: { center: { latitude: 40.6782, longitude: -73.9442 }, radius: 15000.0 } }, maxResultCount: 20 }),
    }).then(function(r){return r.json()}).then(function(data) {
      if (data.places && data.places.length > 0) {
        var shops = sortShops(
          data.places
            .filter(function(p) {
              var name = p.displayName ? p.displayName.text : "";
              var types = p.types || [];
              return isRealCoffeeShop(name) && isGoodPlaceByType(types);
            })
            .map(function(p, i) { return parsePlace(p, i); })
        );
        setAllShops(shops); setFilteredShops(shops); setActiveFilter("all");
        if (shops.length > 0 && mapInstanceRef.current) mapInstanceRef.current.fitBounds(L.latLngBounds(shops.map(function(s){return [s.lat,s.lng]})),{padding:[50,50]});
      } else { setAllShops([]); setFilteredShops([]); }
      setLoading(false);
    }).catch(function(){setLoading(false)});
  };

  var handleHoodClick = function(hood) { setSearchOpen(false); setSearchQuery(""); setLocationLabel(hood.name); if (mapInstanceRef.current) mapInstanceRef.current.flyTo([hood.lat, hood.lng], 15, {duration: 1}); fetchNearbyShops(hood.lat, hood.lng, hood.name); };
  var handleSearchInput = function(e) { var val = e.target.value; setSearchQuery(val); if (val.trim()) { setFilteredHoods(neighborhoods.filter(function(h){return h.name.toLowerCase().includes(val.toLowerCase())})); } else { setFilteredHoods(neighborhoods); } };

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
        fetchNearbyShops(lat,lng,"near you");
      },function(){fetchNearbyShops(40.6782,-73.9442,"Brooklyn")},{enableHighAccuracy:true,timeout:10000});
    } else fetchNearbyShops(40.6782,-73.9442,"Brooklyn");
    return function(){map.remove();mapInstanceRef.current=null};
  }, [fetchNearbyShops]);

  useEffect(function() {
    var map=mapInstanceRef.current; if(!map)return;
    markersRef.current.forEach(function(m){map.removeLayer(m)}); markersRef.current=[];
    filteredShops.forEach(function(shop) {
      if(!shop.lat||!shop.lng)return;
      var cls=shop.occupancy==="closed"?"closed":shop.occupancy;
      var sn=shop.name.length>14?shop.name.substring(0,14)+"\u2026":shop.name;
      var ic=L.divIcon({className:"custom-marker",html:'<div class="marker-bubble '+cls+'">'+sn+'</div>',iconSize:[0,0],iconAnchor:[60,30]});
      var mk=L.marker([shop.lat,shop.lng],{icon:ic}).addTo(map);
      mk.on("click",function(){setSelectedShop(shop);map.flyTo([shop.lat,shop.lng],16,{duration:0.5})});
      markersRef.current.push(mk);
    });
  }, [filteredShops]);

  var handleFilter=function(key){setActiveFilter(key);setFilteredShops(key==="all"?allShops:allShops.filter(function(s){return s.occupancy===key}))};
  var handleShopClick=function(shop){setSelectedShop(shop);if(mapInstanceRef.current)mapInstanceRef.current.flyTo([shop.lat,shop.lng],16,{duration:0.5})};
  var handleSearchArea=function(){var map=mapInstanceRef.current;if(!map)return;var c=map.getCenter();fetchNearbyShops(c.lat,c.lng,"this area");setShowSearchArea(false)};
  var locateUser=function(){if(navigator.geolocation)navigator.geolocation.getCurrentPosition(function(pos){var map=mapInstanceRef.current;if(map){var lat=pos.coords.latitude,lng=pos.coords.longitude;map.flyTo([lat,lng],15,{duration:0.8});var ui=L.divIcon({className:"user-location-marker",html:'<div style="width:16px;height:16px;background:#2979FF;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(41,121,255,0.25),0 2px 8px rgba(0,0,0,0.2)"></div>',iconSize:[16,16],iconAnchor:[8,8]});if(userMarkerRef.current)map.removeLayer(userMarkerRef.current);userMarkerRef.current=L.marker([lat,lng],{icon:ui,zIndexOffset:1000}).addTo(map);fetchNearbyShops(lat,lng,"near you");setShowSearchArea(false)}})};
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
      React.createElement("div", {className: "search-container"},
        searchOpen ? React.createElement("div", null,
          React.createElement("div", {className: "search-row"},
            React.createElement("input", {type: "text", className: "search-input", placeholder: "Search or pick a neighborhood...", value: searchQuery, onChange: handleSearchInput, autoFocus: true, onKeyDown: function(e){if(e.key==="Enter")handleSearchSubmit(e);if(e.key==="Escape"){setSearchOpen(false);setSearchQuery("")}}}),
            React.createElement("button", {className: "search-go-btn", onClick: handleSearchSubmit}, "Go"),
            React.createElement("button", {className: "search-cancel-btn", onClick: function(){setSearchOpen(false);setSearchQuery("")}}, "\u2715")
          ),
          React.createElement("div", {className: "neighborhood-dropdown"},
            React.createElement("div", {className: "neighborhood-section-label"}, "BROOKLYN"),
            React.createElement("div", {className: "neighborhood-grid"},
              filteredHoods.filter(function(h){return bkHoods.indexOf(h.name) !== -1}).map(function(hood) {
                return React.createElement("div", {key: hood.name, className: "neighborhood-chip", onClick: function(){handleHoodClick(hood)}}, hood.name);
              })
            ),
            React.createElement("div", {className: "neighborhood-section-label", style: {marginTop: "12px"}}, "MANHATTAN (below 23rd)"),
            React.createElement("div", {className: "neighborhood-grid"},
              filteredHoods.filter(function(h){return mhHoods.indexOf(h.name) !== -1}).map(function(hood) {
                return React.createElement("div", {key: hood.name, className: "neighborhood-chip manhattan", onClick: function(){handleHoodClick(hood)}}, hood.name);
              })
            )
          )
        ) : React.createElement("div", {className: "search-bar", onClick: function(){setSearchOpen(true);setFilteredHoods(neighborhoods)}},
          React.createElement("svg", {width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2"}, React.createElement("circle", {cx: "11", cy: "11", r: "8"}), React.createElement("path", {d: "m21 21-4.35-4.35"})),
          "Search cafes, neighborhoods..."
        )
      ),
      React.createElement("div", {className: "filter-row"}, filters.map(function(f) {
        return React.createElement("div", {key: f.key, className: "filter-chip" + (activeFilter===f.key?" active":""), onClick: function(){handleFilter(f.key)}}, f.label);
      })),
      React.createElement("div", {className: "location-label"},
        loading ? "Finding coffee shops..." : allShops.length + " spots within 1 mile \u00B7 " + locationLabel
      ),
      React.createElement("div", {className: "left-panel-content"},
        selectedShop ? React.createElement(SideDetail, {shop: selectedShop, onClose: function(){setSelectedShop(null)}, onCheckin: function(){setCheckinOpen(true)}}) : React.createElement("div", {className: "shop-list"},
          filteredShops.map(function(shop){return React.createElement(ShopListCard, {key: shop.id, shop: shop, onClick: handleShopClick, isSelected: false})}),
          !loading && filteredShops.length === 0 ? React.createElement("div", {className: "empty-state"}, "No coffee shops found. Try a different neighborhood or search.") : null
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
