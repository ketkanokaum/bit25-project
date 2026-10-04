// เกณฑ์โอกาสเกิดน้ำท่วมจากปริมาณฝน (มม./เดือน) — ใช้ตัวเลขฝนตรง ๆ ไม่เทียบกับค่าปกติ (baseline) อีกต่อไป
export const FLOOD_RISK_LEVELS = [
  {
    tier: 1,
    key: "low",
    label: "โอกาสเกิดน้ำท่วมต่ำ",
    shortLabel: "ต่ำ",
    range: "< 50 มม.",
    hex: { color: "#15803d", bg: "#f0fdf4", border: "#86efac", dot: "#22c55e" },
    tw: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-700" },
  },
  {
    tier: 2,
    key: "medium_high",
    label: "โอกาสเกิดน้ำท่วมปานกลางถึงสูง",
    shortLabel: "ปานกลางถึงสูง",
    range: "50 – 199.9 มม.",
    hex: { color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
    tw: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
  },
  {
    tier: 3,
    key: "high",
    label: "โอกาสเกิดน้ำท่วมสูง",
    shortLabel: "สูง",
    range: "≥ 200 มม.",
    hex: { color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444" },
    tw: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700" },
  },
];

const NO_DATA_LEVEL = {
  tier: null,
  key: "no_data",
  label: "ไม่มีข้อมูลปริมาณฝน",
  shortLabel: "ไม่มีข้อมูล",
  range: null,
  hex: { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", dot: "#94a3b8" },
  tw: { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", badge: "bg-slate-100 text-slate-500" },
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
