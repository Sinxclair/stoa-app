import { useState } from "react";

const levels = [
  { label: "Not busy", desc: "Plenty of seats available", color: "#4CAF50" },
  { label: "Moderate", desc: "Some seats, getting full", color: "#FF9800" },
  { label: "Very busy", desc: "Hard to find a seat", color: "#E57373" },
  { label: "Packed", desc: "No seats available", color: "#B71C1C" },
];

export default function CheckIn({ shop, isOpen, onClose, onSubmit }) {
  const [selected, setSelected] = useState(null);

  const handleSubmit = () => {
    if (selected === null) return;
    onSubmit(selected);
    setSelected(null);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      setSelected(null);
    }
  };

  return (
    <div
      className={`checkin-overlay ${isOpen ? "open" : ""}`}
      onClick={handleOverlayClick}
    >
      <div className="checkin-modal">
        <div className="checkin-title">How busy is it?</div>
        <div className="checkin-sub">
          {shop ? shop.name : "Select a shop"} · Now
        </div>

        {levels.map((level, i) => (
          <div
            key={i}
            className={`level-option ${selected === i ? "selected" : ""}`}
            onClick={() => setSelected(i)}
          >
            <div>
              <div className="level-label">{level.label}</div>
              <div className="level-desc">{level.desc}</div>
            </div>
            <div className="level-dot" style={{ background: level.color }} />
          </div>
        ))}

        <button className="submit-report-btn" onClick={handleSubmit}>
          Submit Report
        </button>
      </div>
    </div>
  );
}
