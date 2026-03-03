import { occupancyLabels, occupancyColors, occupancyBgColors, occupancyTextColors } from "../data/mockShops";

export default function ShopCard({ shop, onClick }) {
  const occ = shop.occupancy;
  const badge = { background: occupancyBgColors[occ], color: occupancyTextColors[occ] };
  const barColor = occupancyColors[occ];
  const isClosed = occ === "closed";

  return (
    <div
      className="shop-card"
      onClick={() => onClick(shop)}
      style={isClosed ? { opacity: 0.6 } : {}}
    >
      <div className="card-top">
        <div className="shop-name">{shop.name}</div>
        <div className="occ-badge" style={badge}>
          {occupancyLabels[occ]}
        </div>
      </div>
      <div className="card-meta">
        <span>📍 {shop.neighborhood}</span>
        {shop.rating && <span>⭐ {shop.rating}</span>}
        {!isClosed && <span>🕐 {shop.updatedMinAgo}m ago</span>}
      </div>
      {!isClosed && (
        <div className="occ-bar-track">
          <div
            className="occ-bar-fill"
            style={{ width: `${shop.occupancyPct}%`, background: barColor }}
          />
        </div>
      )}
    </div>
  );
}
