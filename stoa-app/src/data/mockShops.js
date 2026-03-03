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

export const EXCLUDED_NAMES = [
  "mcdonald", "burger king", "wendy", "subway", "dunkin", "taco bell",
  "chick-fil-a", "popeyes", "kfc", "five guys", "chipotle", "panera",
  "shake shack", "wingstop", "domino", "pizza hut", "papa john",
  "smoothie king", "jamba", "tropical smoothie", "juice press",
  "robeks", "nekter", "pressed juicery",
  "7-eleven", "wawa", "sheetz", "circle k", "gas station",
  "deli", "bodega", "grocery", "market", "pharmacy", "cvs", "walgreens",
  "kung fu tea", "gong cha", "tiger sugar", "coco tea", "happy lemon",
  "kung-fu tea", "boba guys", "vivi bubble tea", "tea and milk",
  "tbaar", "bubble tea", "boba",
  "baskin", "carvel", "cold stone", "dairy queen", "rita's ice",
  "joe & the juice", "joes pizza", "joe's pizza",
  "ihop", "denny", "waffle house", "cracker barrel",
  "tim hortons",
];

export function isRealCoffeeShop(name) {
  const lower = name.toLowerCase();
  return !EXCLUDED_NAMES.some((excluded) => lower.includes(excluded));
}

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
