import { occupancyLabels, occupancyColors } from "../data/mockShops";

const GOOGLE_API_KEY = "AIzaSyDzcPX4NtY51Hl28Nly3NeqsxpTDiYoY48";

export default function ShopDetail({ shop, isOpen, onClose, onCheckin }) {
  if (!shop) return null;

  const isClosed = shop.occupancy === "closed";
  const statusColor = isClosed ? "#9E9E9E" : occupancyColors[shop.occupancy];
  const statusLabel = isClosed ? "Closed" : occupancyLabels[shop.occupancy];

  const formatHours = () => {
    if (!shop.hours || shop.hours.length === 0) return null;
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const jsDay = new Date().getDay();
    const today = dayNames[jsDay === 0 ? 6 : jsDay - 1];
    return shop.hours.map((h) => ({
      text: h,
      isToday: h.toLowerCase().startsWith(today.toLowerCase()),
    }));
  };

  const formattedHours = formatHours();

  const photoUrl = shop.photoRef
    ? "https://places.googleapis.com/v1/" + shop.photoRef + "/media?maxWidthPx=800&key=" + GOOGLE_API_KEY
    : null;

  const openDirections = () => {
    window.open(
      "https://www.google.com/maps/dir/?api=1&destination=" + shop.lat + "," + shop.lng,
      "_blank"
    );
  };

  return (
    <div className={"detail-panel " + (isOpen ? "open" : "")}>
      <div className="detail-hero">
        {photoUrl ? (
          <img src={photoUrl} alt={shop.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#F0EDE6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" }}>☕</div>
        )}
        <div className="detail-hero-gradient" />
        <button className="detail-back" onClick={onClose}>←</button>
      </div>

      <div className="detail-body">
        <div className="detail-name">{shop.name}</div>
        <div className="detail-address">{shop.address}</div>

        {shop.rating && (
          <div style={{ marginBottom: "16px", fontSize: "14px", color: "#5D4037" }}>⭐ {shop.rating} on Google</div>
        )}

        <div className="detail-occ-section">
          <div className="detail-occ-header">
            <div className="detail-occ-label">{isClosed ? "Status" : "Current Occupancy"}</div>
            <div className="detail-occ-status" style={{ color: statusColor }}>{statusLabel}</div>
          </div>
          {!isClosed && (
            <div>
              <div className="occ-bar-track">
                <div className="occ-bar-fill" style={{ width: shop.occupancyPct + "%", background: statusColor }} />
              </div>
              <div className="detail-updated">Last updated: {shop.updatedMinAgo} min ago</div>
            </div>
          )}
          {isClosed && (
            <div className="detail-updated">This shop is currently closed.</div>
          )}
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Hours</div>
          <div className="hours-card">
            {formattedHours ? formattedHours.map((h, i) => (
              <div key={i} className="hours-row" style={h.isToday ? { fontWeight: 700, color: "#3E2723" } : {}}>
                {h.isToday && "▸ "}{h.text}
              </div>
            )) : (
              <div style={{ fontSize: "13px", color: "#999", padding: "8px 0" }}>Hours not available</div>
            )}
          </div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Workspace Info</div>
          <div className="workspace-card">
            <div className="workspace-item">
              <div className="workspace-icon">🔌</div>
              <div className="workspace-info"><div className="workspace-label">Outlets</div><div className="workspace-value">Not yet reported</div></div>
            </div>
            <div className="workspace-item">
              <div className="workspace-icon">💻</div>
              <div className="workspace-info"><div className="workspace-label">Laptop Friendly</div><div className="workspace-value">Not yet reported</div></div>
            </div>
            <div className="workspace-item">
              <div className="workspace-icon">📶</div>
              <div className="workspace-info"><div className="workspace-label">WiFi</div><div className="workspace-value">Not yet reported</div></div>
            </div>
            <div className="workspace-item">
              <div className="workspace-icon">🔇</div>
              <div className="workspace-info"><div className="workspace-label">Noise Level</div><div className="workspace-value">Not yet reported</div></div>
            </div>
          </div>
          <div className="workspace-cta">Been here? Help others by reporting workspace details!</div>
        </div>

        <div className="detail-section">
          <div className="detail-section-title">Reviews</div>
          {shop.reviews && shop.reviews.length > 0 ? (
            <div className="reviews-list">
              {shop.reviews.map((review, i) => (
                <div key={i} className="review-card">
                  <div className="review-header">
                    <div className="review-author">{review.author}</div>
                    <div className="review-rating">{"⭐".repeat(Math.round(review.rating))}</div>
                  </div>
                  <div className="review-time">{review.relativeTime}</div>
                  <div className="review-text">{review.text}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "13px", color: "#999", padding: "8px 0" }}>No reviews yet</div>
          )}
        </div>

        <div className="detail-actions">
          <button className="btn-primary" onClick={openDirections}>Get Directions</button>
          {!isClosed && <button className="btn-secondary" onClick={onCheckin}>Check In</button>}
        </div>
      </div>
    </div>
  );
}
