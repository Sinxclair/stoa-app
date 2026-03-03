import { occupancyLabels, occupancyColors } from "../data/mockShops";

const occBadgeStyles = {
  low: { background: "#E8F5E9", color: "#2E7D32" },
  mid: { background: "#FFF3E0", color: "#E65100" },
  high: { background: "#FFEBEE", color: "#B71C1C" },
};

export default function ShopCard({ shop, onClick }) {
  const badge = occBadgeStyles[shop.occupancy] || occBadgeStyles.low;
  const barColor = occupancyColors[shop.occupancy];

  return (
    <div className="shop-card" onClick={() => onClick(shop)}>
      <div className="card-top">
        <div className="shop-name">{shop.name}</div>
        <div className="occ-badge" style={badge}>
          {occupancyLabels[shop.occupancy]}
        </div>
      </div>
      <div className="card-meta">
        <span>📍 {shop.neighborhood}</span>
        <span>🕐 {shop.updatedMinAgo}m ago</span>
      </div>
      <div className="occ-bar-track">
        <div
          className="occ-bar-fill"
          style={{ width: `${shop.occupancyPct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}
