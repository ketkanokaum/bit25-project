

export function percentOfNormal(rain, baselineMean) {
  if (baselineMean == null || baselineMean === 0 || rain == null) return null;
  return (rain / baselineMean) * 100;
}

export const RAIN_LEVELS = [
  {
    tier: 1,
    key: "drought",
    label: "ฝนน้อยกว่าปกติ (เสี่ยงแล้ง)",
    range: "< 80%",
    hex: { color: "#b45309", bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" },
    tw: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" },
  },
  {
    tier: 2,
    key: "normal",
    label: "ฝนอยู่ในเกณฑ์ปกติ",
    range: "80 – 110%",
    hex: { color: "#15803d", bg: "#f0fdf4", border: "#86efac", dot: "#22c55e" },
    tw: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-700" },
  },
  {
    tier: 3,
    key: "flood_risk",
    label: "ฝนมากกว่าปกติ (เสี่ยงน้ำท่วม)",
    range: "> 110%",
    hex: { color: "#b91c1c", bg: "#fef2f2", border: "#fca5a5", dot: "#ef4444" },
    tw: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-700" },
  },
];

const NO_DATA_LEVEL = {
  tier: null,
  key: "no_data",
  label: "ไม่มีค่าปกติเทียบ",
  range: null,
  hex: { color: "#64748b", bg: "#f8fafc", border: "#e2e8f0", dot: "#94a3b8" },
  tw: { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", badge: "bg-slate-100 text-slate-500" },
};

export function classifyRainLevel(percent) {
  if (percent == null) return NO_DATA_LEVEL;
  if (percent < 80) return RAIN_LEVELS[0];
  if (percent <= 110) return RAIN_LEVELS[1];
  return RAIN_LEVELS[2];
}