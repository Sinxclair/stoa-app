import { occupancyLabels, occupancyBgColors, occupancyTextColors, occupancyColors } from "../data/mockShops";

const GOOGLE_API_KEY = "AIzaSyDzcPX4NtY51Hl28Nly3NeqsxpTDiYoY48";

export default function ShopCard({ shop, onClick }) {
  const occ = shop.occupancy;
  const badge = { background: occupancyBgColors[occ], color: occupancyTextColors[occ] };
  const barColor = occupancyColors[occ];
  const isClosed = occ === "closed";

  const getPhotoUrl = () => {
    if (!shop.photoRef) return null;
    return "https://places.googleapis.com/v1/" + shop.photoRef + "/media?maxWidthPx=400&key=" + GOOGLE_API_KEY;
  };

  const photoUrl = getPhotoUrl();

  return (
    <div
      className="shop-card-v2"
      onClick={() => onClick(shop)}
      style={isClosed ? { opacity: 0.55 } : {}}
    >
      <div className="shop-card-photo">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={shop.name}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="shop-card-photo-placeholder">☕</div>
        )}
      </div>
      <div className="shop-card-info">
        <div className="shop-card-header">
          <div className="shop-card-name">{shop.name}</div>
          <div className="occ-badge" style={badge}>
            {isClosed ? "CLOSED" : occupancyLabels[occ]}
          </div>
        </div>
        <div className="shop-card-address">{shop.address}</div>
        {!isClosed && (
          <div className="shop-card-stats">
            <div className="shop-card-stat">
              <div className="shop-card-stat-label">LIVE OCCUPANCY</div>
              <div className="shop-card-stat-value">
                <span style={{ color: barColor, fontWeight: 700, fontSize: "18px" }}>
                  {shop.occupancyPct}%
                </span>
                <span style={{ fontSize: "11px", color: "#999", marginLeft: "4px" }}>
                  {occupancyLabels[occ]}
                </span>
              </div>
            </div>
            {shop.rating && (
              <div className="shop-card-stat">
                <div className="shop-card-stat-label">RATING</div>
                <div className="shop-card-stat-value">
                  <span style={{ fontWeight: 700, fontSize: "18px" }}>⭐ {shop.rating}</span>
                </div>
              </div>
            )}
          </div>
        )}
        {!isClosed && (
          <div className="shop-card-bar-track">
            <div
              className="shop-card-bar-fill"
              style={{ width: shop.occupancyPct + "%", background: barColor }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
