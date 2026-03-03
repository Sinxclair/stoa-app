// This file now serves as a utility for occupancy labels/colors
// Real shop data comes from Google Places API in HomeMap.jsx

export const occupancyLabels = {
  low: "Available",
  mid: "Moderate",
  high: "Full",
  closed: "Closed",
};

export const occupancyColors = {
  low: "#4CAF50",
  mid: "#FF9800",
  high: "#E57373",
  closed: "#9E9E9E",
};

export const occupancyBgColors = {
  low: "#E8F5E9",
  mid: "#FFF3E0",
  high: "#FFEBEE",
  closed: "#F5F5F5",
};

export const occupancyTextColors = {
  low: "#2E7D32",
  mid: "#E65100",
  high: "#B71C1C",
  closed: "#757575",
};

// Assign occupancy — respects open/closed status
export function assignOccupancy(isOpen) {
  if (isOpen === false) {
    return { occupancy: "closed", occupancyPct: 0, updatedMinAgo: 0 };
  }
  const levels = ["low", "low", "low", "mid", "mid", "high"];
  const level = levels[Math.floor(Math.random() * levels.length)];
  const pcts = {
    low: Math.floor(Math.random() * 30 + 5),
    mid: Math.floor(Math.random() * 25 + 40),
    high: Math.floor(Math.random() * 20 + 75),
  };
  return {
    occupancy: level,
    occupancyPct: pcts[level],
    updatedMinAgo: Math.floor(Math.random() * 15 + 1),
  };
}

export default [];
