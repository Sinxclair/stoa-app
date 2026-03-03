import { useState } from "react";
import ShopCard from "./ShopCard";

export default function BottomSheet({ shops, onShopClick }) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={`bottom-sheet ${collapsed ? "collapsed" : ""}`}>
      <div className="sheet-handle-area" onClick={() => setCollapsed(!collapsed)}>
        <div className="sheet-handle" />
      </div>
      <div className="sheet-header">
        <div>
          <div className="sheet-title">Nearby</div>
          <div className="sheet-subtitle">{shops.length} shops · Brooklyn</div>
        </div>
        <div
          className="occ-badge"
          style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: "9px" }}
        >
          LIVE
        </div>
      </div>
      <div className="sheet-list">
        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} onClick={onShopClick} />
        ))}
      </div>
    </div>
  );
}
