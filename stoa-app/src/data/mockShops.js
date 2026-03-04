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
  /* fast food + chains */
  "mcdonald", "burger king", "wendy", "subway", "dunkin", "taco bell",
  "chick-fil-a", "popeyes", "kfc", "five guys", "chipotle", "panera",
  "shake shack", "wingstop", "domino", "pizza hut", "papa john",
  "ihop", "denny", "waffle house", "cracker barrel",
  "tim hortons", "krispy kreme", "le pain quotidien", "pret a manger",
  /* juice + smoothie */
  "smoothie", "jamba", "juice press", "juice bar", "juicery",
  "robeks", "nekter", "pressed juicery", "acai",
  /* convenience + grocery */
  "7-eleven", "wawa", "sheetz", "circle k", "gas station",
  "bodega", "grocery", "supermarket", "pharmacy", "cvs", "walgreens",
  /* bubble tea + tea */
  "kung fu tea", "gong cha", "tiger sugar", "coco tea", "happy lemon",
  "kung-fu tea", "boba guys", "vivi bubble tea", "tea and milk",
  "tbaar", "bubble tea", "boba", "tea house", "tea room",
  /* ice cream + frozen */
  "baskin", "carvel", "cold stone", "dairy queen", "rita's ice",
  "ice cream", "frozen yogurt", "froyo", "gelato", "sorbet",
  /* specific non-coffee spots that show up in NYC */
  "joe & the juice", "joes pizza", "joe's pizza",
  "max brenner", "eataly", "angelika", "buvette",
  "spot dessert", "book club bar",
  /* restaurants + dining keywords */
  "bistro", "brasserie", "trattoria", "tavern", "osteria",
  "steakhouse", "steak house", "chophouse",
  "sushi", "ramen", "noodle", "pho", "dim sum", "wok",
  "taqueria", "burrito", "enchilada",
  "wings", "fried chicken", "bbq", "barbecue",
  /* bars + nightlife */
  "wine bar", "cocktail bar", "speakeasy", "taproom", "brewery", "pub ",
  /* bakery + pastry (not coffee-first) */
  "paris baguette", "tous les jours",
  "patisserie", "pasticceria",
  /* dessert */
  "dessert bar", "chocolate bar", "chocolate shop",
  "candy", "confection", "fudge",
  "creperie", "crepe house",
  /* entertainment */
  "film center", "movie", "cinema", "theater", "theatre",
  "comedy club", "escape room", "bowling",
  /* food keywords */
  "food hall", "food court",
  "pizz", "bagel", "donut", "doughnut",
  /* deli - but careful not to catch "delicioso" etc */
  "deli ", " deli",
];

export function isRealCoffeeShop(name) {
  var lower = name.toLowerCase();
  return !EXCLUDED_NAMES.some(function(excluded) { return lower.includes(excluded); });
}

export function assignOccupancy(isOpen) {
  if (isOpen === false) {
    return { occupancy: "closed", occupancyPct: 0, updatedMinAgo: 0 };
  }
  var levels = ["low", "low", "low", "mid", "mid", "high"];
  var level = levels[Math.floor(Math.random() * levels.length)];
  var pcts = {
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
