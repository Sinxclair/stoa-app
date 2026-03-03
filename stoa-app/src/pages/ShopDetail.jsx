import { occupancyLabels, occupancyColors } from "../data/mockShops";

export default function ShopDetail({ shop, isOpen, onClose, onCheckin }) {
  if (!shop) return null;

  const statusColor = occupancyColors[shop.occupancy];
  const statusLabel = occupancyLabels[shop.occupancy];
  const currentHour = new Date().getHours();

  // Generate simulated busyness bars
  const hours = Array.from({ length: 12 }, (_, i) => {
    const h = 7 + i;
    const height = Math.floor(Math.random() * 80 + 10);
    const isCurrent = h === currentHour;
    const isPast = h < currentHour;
    return { h, height, isCurrent, isPast };
  });

  const openDirections = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`,
      "_blank"
    );
  };

  return (
    <div className={`detail-panel ${isOpen ? "open" : ""}`}>
      <div className="detail-hero">
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#F0EDE6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "48px",
          }}
        >
          ☕
        </div>
        <div className="detail-hero-gradient" />
        <button className="detail-back" onClick={onClose}>
          ←
        </button>
      </div>

      <div className="detail-body">
        <div className="detail-name">{shop.name}</div>
        <div className="detail-address">{shop.address}</div>

        {/* Occupancy Section */}
        <div className="detail-occ-section">
          <div className="detail-occ-header">
            <div className="detail-occ-label">Current Occupancy</div>
            <div className="detail-occ-status" style={{ color: statusColor }}>
              {statusLabel}
            </div>
          </div>
          <div className="occ-bar-track">
            <div
              className="occ-bar-fill"
              style={{
                width: `${shop.occupancyPct}%`,
                background: statusColor,
              }}
            />
          </div>
          <div className="detail-updated">
            Last updated: {shop.updatedMinAgo} min ago
          </div>
        </div>

        {/* Busyness Chart */}
        <div className="detail-section">
          <div className="detail-section-title">Typical Busyness</div>
          <div className="busy-chart">
            {hours.map((bar, i) => (
              <div
                key={i}
                className={`busy-bar ${bar.isCurrent ? "now" : bar.isPast ? "past" : ""}`}
                style={{ height: `${bar.height}%` }}
              />
            ))}
          </div>
          <div className="busy-labels">
            <span className="busy-label">7am</span>
            <span className="busy-label">10am</span>
            <span className="busy-label">1pm</span>
            <span className="busy-label">4pm</span>
            <span className="busy-label">7pm</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="detail-actions">
          <button className="btn-primary" onClick={openDirections}>
            Get Directions
          </button>
          <button className="btn-secondary" onClick={onCheckin}>
            Check In
          </button>
        </div>
      </div>
    </div>
  );
}
