
export const FLOOD_RISK_LEVELS = [
  {
    tier: 1,
    key: "low",
    label: "โอกาสเกิดน้ำท่วมต่ำ",
    range: "< 50 มิลลิเมตร",
    hex: { color: "#15803d", dot: "#22c55e" },
    tw: { badge: "bg-green-100 text-green-700" },
  },
  {
    tier: 2,
    key: "medium_high",
    label: "โอกาสเกิดน้ำท่วมปานกลางถึงสูง",
    range: "50 – 199.9 มิลลิเมตร",
    hex: { color: "#b45309", dot: "#f59e0b" },
    tw: { badge: "bg-amber-100 text-amber-700" },
  },
  {
    tier: 3,
    key: "high",
    label: "โอกาสเกิดน้ำท่วมสูง",
    range: "≥ 200 มิลลิเมตร",
    hex: { color: "#b91c1c", dot: "#ef4444" },
    tw: { badge: "bg-red-100 text-red-700" },
  },
];

const NO_DATA_LEVEL = {
  tier: null,
  key: "no_data",
  label: "ไม่มีข้อมูลปริมาณน้ำฝน",
  range: null,
  hex: { color: "#64748b", dot: "#94a3b8" },
  tw: { badge: "bg-slate-100 text-slate-500" },
};

export function classifyFloodRisk(rainMm) {
  if (rainMm == null) return NO_DATA_LEVEL;
  const value = Number(rainMm);
  if (isNaN(value)) return NO_DATA_LEVEL;
  if (value < 50) return FLOOD_RISK_LEVELS[0];
  if (value < 200) return FLOOD_RISK_LEVELS[1];
  return FLOOD_RISK_LEVELS[2];
}


export function isHighFloodRisk(rainMm) {
  const tier = classifyFloodRisk(rainMm);
  return tier.key === "high";
}
