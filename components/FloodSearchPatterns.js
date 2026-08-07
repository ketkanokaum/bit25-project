"use client";
import React, { useState, useMemo, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";
import TuneIcon from "@mui/icons-material/Tune";
import SearchIcon from "@mui/icons-material/Search";
import HubIcon from "@mui/icons-material/Hub";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ReportIcon from "@mui/icons-material/Report";
import VerifiedIcon from "@mui/icons-material/Verified";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import TimelineIcon from "@mui/icons-material/Timeline";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] flex items-center justify-center">
      <CircularProgress />
    </div>
  ),
});

const provinceRegions = {
  เชียงราย: "ภาคเหนือ", น่าน: "ภาคเหนือ", พะเยา: "ภาคเหนือ", เชียงใหม่: "ภาคเหนือ", แม่ฮ่องสอน: "ภาคเหนือ", แพร่: "ภาคเหนือ", ลำปาง: "ภาคเหนือ", ลำพูน: "ภาคเหนือ", อุตรดิตถ์: "ภาคเหนือ",
  กรุงเทพมหานคร: "ภาคกลาง", พิษณุโลก: "ภาคกลาง", สุโขทัย: "ภาคกลาง", เพชรบูรณ์: "ภาคกลาง", พิจิตร: "ภาคกลาง", กำแพงเพชร: "ภาคกลาง", นครสวรรค์: "ภาคกลาง", ลพบุรี: "ภาคกลาง", ชัยนาท: "ภาคกลาง", อุทัยธานี: "ภาคกลาง", สิงห์บุรี: "ภาคกลาง", อ่างทอง: "ภาคกลาง", สระบุรี: "ภาคกลาง", พระนครศรีอยุธยา: "ภาคกลาง", สุพรรณบุรี: "ภาคกลาง", นครนายก: "ภาคกลาง", ปทุมธานี: "ภาคกลาง", นนทบุรี: "ภาคกลาง", นครปฐม: "ภาคกลาง", สมุทรปราการ: "ภาคกลาง", สมุทรสาคร: "ภาคกลาง", สมุทรสงคราม: "ภาคกลาง",
  หนองคาย: "ภาคตะวันออกเฉียงเหนือ", นครพนม: "ภาคตะวันออกเฉียงเหนือ", สกลนคร: "ภาคตะวันออกเฉียงเหนือ", อุดรธานี: "ภาคตะวันออกเฉียงเหนือ", หนองบัวลำภู: "ภาคตะวันออกเฉียงเหนือ", เลย: "ภาคตะวันออกเฉียงเหนือ", มุกดาหาร: "ภาคตะวันออกเฉียงเหนือ", กาฬสินธุ์: "ภาคตะวันออกเฉียงเหนือ", ขอนแก่น: "ภาคตะวันออกเฉียงเหนือ", อำนาจเจริญ: "ภาคตะวันออกเฉียงเหนือ", ยโสธร: "ภาคตะวันออกเฉียงเหนือ", ร้อยเอ็ด: "ภาคตะวันออกเฉียงเหนือ", มหาสารคาม: "ภาคตะวันออกเฉียงเหนือ", ชัยภูมิ: "ภาคตะวันออกเฉียงเหนือ", นครราชสีมา: "ภาคตะวันออกเฉียงเหนือ", บุรีรัมย์: "ภาคตะวันออกเฉียงเหนือ", สุรินทร์: "ภาคตะวันออกเฉียงเหนือ", ศรีสะเกษ: "ภาคตะวันออกเฉียงเหนือ", อุบลราชธานี: "ภาคตะวันออกเฉียงเหนือ", บึงกาฬ: "ภาคตะวันออกเฉียงเหนือ",
  สระแก้ว: "ภาคตะวันออก", ปราจีนบุรี: "ภาคตะวันออก", ฉะเชิงเทรา: "ภาคตะวันออก", ชลบุรี: "ภาคตะวันออก", ระยอง: "ภาคตะวันออก", จันทบุรี: "ภาคตะวันออก", ตราด: "ภาคตะวันออก",
  ตาก: "ภาคตะวันตก", กาญจนบุรี: "ภาคตะวันตก", ราชบุรี: "ภาคตะวันตก", เพชรบุรี: "ภาคตะวันตก", ประจวบคีรีขันธ์: "ภาคตะวันตก",
  ชุมพร: "ภาคใต้", ระนอง: "ภาคใต้", สุราษฎร์ธานี: "ภาคใต้", นครศรีธรรมราช: "ภาคใต้", กระบี่: "ภาคใต้", พังงา: "ภาคใต้", ภูเก็ต: "ภาคใต้", พัทลุง: "ภาคใต้", ตรัง: "ภาคใต้", ปัตตานี: "ภาคใต้", สงขลา: "ภาคใต้", สตูล: "ภาคใต้", นราธิวาส: "ภาคใต้", ยะลา: "ภาคใต้",
};

const regionOrder = ["ภาคเหนือ", "ภาคตะวันออกเฉียงเหนือ", "ภาคกลาง", "ภาคตะวันออก", "ภาคตะวันตก", "ภาคใต้"];
const thaiMonthNames = { 1: "มกราคม", 2: "กุมภาพันธ์", 3: "มีนาคม", 4: "เมษายน", 5: "พฤษภาคม", 6: "มิถุนายน", 7: "กรกฎาคม", 8: "สิงหาคม", 9: "กันยายน", 10: "ตุลาคม", 11: "พฤศจิกายน", 12: "ธันวาคม" };
const shortMonthNames = { 1: "ม.ค.", 2: "ก.พ.", 3: "มี.ค.", 4: "เม.ย.", 5: "พ.ค.", 6: "มิ.ย.", 7: "ก.ค.", 8: "ส.ค.", 9: "ก.ย.", 10: "ต.ค.", 11: "พ.ย.", 12: "ธ.ค." };

const REAL_DATA_YEARS = [2020, 2021, 2022, 2023, 2024];
const RULE_BASE_YEARS = REAL_DATA_YEARS;

const SEARCH_END_YEAR = 2026;
const SEARCH_END_MONTH = 6;
const RAIN_END_YEAR = 2026;
const RAIN_END_MONTH = 5;

const LAST_SELECTABLE_YEAR = 2026;

const LAST_REAL_YEAR = REAL_DATA_YEARS[REAL_DATA_YEARS.length - 1];

const ALL_YEARS = [];
for (let y = REAL_DATA_YEARS[0]; y <= LAST_SELECTABLE_YEAR; y++) {
  ALL_YEARS.push(y);
}

const METHOD_CONFIRMED = "confirmed";
const METHOD_SEARCH_RAIN = "search_rain";
const METHOD_RAIN_ONLY = "rain_only";
const METHOD_HISTORY = "history";

const METHOD_LABELS = {
  [METHOD_CONFIRMED]: "สถิติจริง",
  [METHOD_SEARCH_RAIN]: "เทียบรูปแบบการค้นหาและปริมาณฝน",
  [METHOD_RAIN_ONLY]: "เทียบปริมาณฝน (ไม่มีข้อมูลการค้นหาปีนี้)",
  [METHOD_HISTORY]: "ความถี่ในอดีต (ไม่มีข้อมูลปีนี้)",
};

function formatThaiDate(dateStr) {
  const d = new Date(dateStr);
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const year = d.getUTCFullYear() + 543;
  return `${day} ${shortMonthNames[month]} ${String(year).slice(-2)}`;
}

function formatCountOrDash(n) {
  if (n > 0) return n.toLocaleString();
  return "-";
}

function translateWord(word) {
  const dict = {
    Rain_Heavy: "ฝนตกหนัก",
    Search_ฝนตก: "ค้นหา 'ฝนตก'",
    Search_น้ำท่วม: "ค้นหา 'น้ำท่วม'",
    Search_พายุ: "ค้นหา 'พายุ'",
    Search_อพยพ: "ค้นหา 'อพยพ'",
    Search_ระดับน้ำ: "ค้นหา 'ระดับน้ำ'",
    Search_สถานการณ์น้ำ: "ค้นหา 'สถานการณ์น้ำ'",
  };
  const translated = dict[word];
  if (translated) return translated;
  return word;
}

function translateWordList(words) {
  const result = [];
  for (let i = 0; i < words.length; i++) {
    result.push(translateWord(words[i]));
  }
  return result;
}

function hasNodeWithGroupAndId(nodes, group, id) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].group === group && nodes[i].id === id) return true;
  }
  return false;
}

function findSelectedWindowEntry(list) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].isSelected) return list[i];
  }
  return null;
}

function asArray(x) {
  if (Array.isArray(x)) return x;
  if (x === undefined || x === null || x === "") return [];
  const parts = String(x).split(",");
  const result = [];
  for (let i = 0; i < parts.length; i++) {
    const trimmed = parts[i].trim();
    if (trimmed !== "") result.push(trimmed);
  }
  return result;
}

function getFloodEvents(data, province, year, month) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (
      r.province === province &&
      parseInt(r.year) === parseInt(year) &&
      parseInt(r.month) === parseInt(month) &&
      r.date
    ) {
      result.push(r);
    }
  }
  return result;
}

function didFloodHappen(data, province, year, month) {
  return getFloodEvents(data, province, year, month).length > 0;
}

function countFloodYears(data, province, month) {
  const years = [];
  for (let i = 0; i < REAL_DATA_YEARS.length; i++) {
    const y = REAL_DATA_YEARS[i];
    if (didFloodHappen(data, province, y, month)) years.push(y);
  }
  return {
    years: years,
    count: years.length,
    total: REAL_DATA_YEARS.length,
    rate: years.length / REAL_DATA_YEARS.length,
  };
}

function getMonthRow(data, province, year, month) {
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (
      r.province === province &&
      parseInt(r.year) === parseInt(year) &&
      parseInt(r.month) === parseInt(month)
    ) {
      return r;
    }
  }
  return null;
}

function getBaseline(data, province, month) {
  const rows = [];
  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    if (r.province === province && parseInt(r.month) === parseInt(month)) {
      rows.push(r);
    }
  }
  if (rows.length === 0) return { value: null, fromTable: false };

  let withBaseline = null;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].baseline_mean != null) {
      withBaseline = rows[i];
      break;
    }
  }
  if (withBaseline) {
    return { value: Math.round(parseFloat(withBaseline.baseline_mean)), fromTable: true };
  }

  const past = [];
  for (let i = 0; i < rows.length; i++) {
    if (RULE_BASE_YEARS.includes(parseInt(rows[i].year))) past.push(rows[i]);
  }
  if (past.length === 0) return { value: null, fromTable: false };
  let sum = 0;
  for (let i = 0; i < past.length; i++) {
    sum += parseFloat(past[i].average_rain) || 0;
  }
  return { value: Math.round(sum / past.length), fromTable: false };
}

const SEARCH_FIELDS = [
  "search_flood",
  "search_rain",
  "search_storm",
  "search_water_level",
  "search_water_situation",
  "search_evacuate",
];

function pickMethod(year, month) {
  const y = parseInt(year);
  const m = parseInt(month);
  if (REAL_DATA_YEARS.includes(y)) return METHOD_CONFIRMED;
  if (y * 12 + m <= SEARCH_END_YEAR * 12 + SEARCH_END_MONTH) return METHOD_SEARCH_RAIN;
  if (y * 12 + m <= RAIN_END_YEAR * 12 + RAIN_END_MONTH) return METHOD_RAIN_ONLY;
  return METHOD_HISTORY;
}

function makeFeatures(row, useSearch) {
  if (!row) return null;
  const list = [];
  if (useSearch) {
    for (let i = 0; i < SEARCH_FIELDS.length; i++) {
      list.push(Number(row[SEARCH_FIELDS[i]]) || 0);
    }
  }
  list.push(Number(row.average_rain) || 0);
  return list;
}

function scaleAll(lists) {
  const size = lists[0].length;
  const mins = [];
  const maxs = [];
  for (let i = 0; i < size; i++) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = 0; j < lists.length; j++) {
      if (lists[j][i] < lo) lo = lists[j][i];
      if (lists[j][i] > hi) hi = lists[j][i];
    }
    mins.push(lo);
    maxs.push(hi);
  }
  const scaled = [];
  for (let j = 0; j < lists.length; j++) {
    const row = [];
    for (let i = 0; i < lists[j].length; i++) {
      if (maxs[i] === mins[i]) {
        row.push(0);
      } else {
        row.push((lists[j][i] - mins[i]) / (maxs[i] - mins[i]));
      }
    }
    scaled.push(row);
  }
  return scaled;
}

function similarity(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) * (a[i] - b[i]);
  }
  return 1 / (1 + Math.sqrt(sum));
}

function predictFlood(data, province, year, month) {
  const method = pickMethod(year, month);
  const history = countFloodYears(data, province, month);

  if (method === METHOD_CONFIRMED) {
    const events = getFloodEvents(data, province, year, month);
    return {
      method: method,
      label: METHOD_LABELS[method],
      willFlood: events.length > 0,
      chance: events.length > 0 ? 1 : 0,
      neighbors: [],
      history: history,
      note: "",
    };
  }

  if (method === METHOD_HISTORY) {
    return {
      method: method,
      label: METHOD_LABELS[method],
      willFlood: history.rate >= 0.5,
      chance: history.rate,
      neighbors: [],
      history: history,
      note: "ไม่มีข้อมูลฝนและการค้นหาของปีนี้ ผลจึงเท่ากันทุกปีสำหรับเดือนนี้",
    };
  }

  const useSearch = method === METHOD_SEARCH_RAIN;
  const targetRow = getMonthRow(data, province, year, month);
  const targetFeatures = makeFeatures(targetRow, useSearch);

  const candidates = [];
  for (let i = 0; i < REAL_DATA_YEARS.length; i++) {
    const y = REAL_DATA_YEARS[i];
    const row = getMonthRow(data, province, y, month);
    const features = makeFeatures(row, useSearch);
    if (!features) continue;
    candidates.push({
      year: y,
      features: features,
      flooded: didFloodHappen(data, province, y, month),
      rain: Math.round(Number(row.average_rain) || 0),
    });
  }

  if (!targetFeatures || candidates.length < 2) {
    return {
      method: METHOD_HISTORY,
      label: METHOD_LABELS[METHOD_HISTORY],
      willFlood: history.rate >= 0.5,
      chance: history.rate,
      neighbors: [],
      history: history,
      note: "ข้อมูลไม่พอสำหรับเทียบรูปแบบ ใช้ความถี่ในอดีตแทน",
    };
  }

  const listsToScale = [targetFeatures];
  for (let i = 0; i < candidates.length; i++) {
    listsToScale.push(candidates[i].features);
  }
  const scaled = scaleAll(listsToScale);

  const scoredCandidates = [];
  for (let i = 0; i < candidates.length; i++) {
    scoredCandidates.push({
      year: candidates[i].year,
      flooded: candidates[i].flooded,
      rain: candidates[i].rain,
      score: similarity(scaled[0], scaled[i + 1]),
    });
  }
  scoredCandidates.sort((a, b) => b.score - a.score);
  const neighbors = scoredCandidates.slice(0, 3);

  let floodWeight = 0;
  let totalWeight = 0;
  for (let i = 0; i < neighbors.length; i++) {
    totalWeight += neighbors[i].score;
    if (neighbors[i].flooded) floodWeight += neighbors[i].score;
  }
  let chance = 0;
  if (totalWeight > 0) chance = floodWeight / totalWeight;

  let note = "";
  if (!useSearch) note = "ไม่มีข้อมูลการค้นหาของปีนี้ เทียบจากปริมาณฝนอย่างเดียว";

  return {
    method: method,
    label: METHOD_LABELS[method],
    willFlood: chance >= 0.5,
    chance: chance,
    neighbors: neighbors,
    history: history,
    note: note,
  };
}

function nodeCanvasObject(node, ctx, globalScale) {
  const label = node.id;
  const fontSize = 12 / globalScale;
  ctx.font = `bold ${fontSize}px Sans-Serif`;
  if (node.group === "cause") {
    ctx.fillStyle = "#f97316";
  } else {
    ctx.fillStyle = "#0369a1";
  }
  ctx.beginPath();
  ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
  ctx.fill();
  ctx.fillStyle = "#334155";
  ctx.fillText(label, node.x + 8, node.y + 3);
}

function forecastTooltipFormatter(value, name) {
  if (name === "สถิติจริง") {
    if (value === 100) return ["เกิดอุทกภัย", "สถิติจริง"];
    return ["ไม่เกิดอุทกภัย", "สถิติจริง"];
  }
  if (name === "ค่าแนวโน้ม") {
    return [`${value}%`, "โอกาสเกิดอุทกภัย (แนวโน้ม)"];
  }
  if (name === "ปริมาณฝน") {
    if (value === null) return ["ไม่มีข้อมูล", "ปริมาณฝน"];
    return [`${value} มม.`, "ปริมาณฝน"];
  }
  return [value, name];
}

function forecastLabelFormatter(label, payload) {
  if (payload && payload[0]) {
    return `${label} · ${payload[0].payload.วิธี}`;
  }
  return label;
}

function actualDot(props) {
  const cx = props.cx;
  const cy = props.cy;
  const value = props.value;
  if (value === null) return null;
  let fillColor;
  if (value >= 50) {
    fillColor = "#ef4444";
  } else {
    fillColor = "#94a3b8";
  }
  return (
    <circle key={`r-${cx}`} cx={cx} cy={cy} r={6} fill={fillColor} stroke="#fff" strokeWidth={2} />
  );
}

function forecastDot(props) {
  const cx = props.cx;
  const cy = props.cy;
  const payload = props.payload;
  const value = props.value;
  if (value === null || !payload.isForecast) return null;
  let strokeColor;
  if (value >= 50) {
    strokeColor = "#ef4444";
  } else {
    strokeColor = "#94a3b8";
  }
  return (
    <circle key={`f-${cx}`} cx={cx} cy={cy} r={6} fill="#fff" stroke={strokeColor} strokeWidth={3} />
  );
}

function monthWindowTooltipFormatter(value, name) {
  if (name === "โอกาสเกิดอุทกภัย") {
    return [`${value}%`, "โอกาสเกิดอุทกภัย"];
  }
  if (name === "ผู้ได้รับผลกระทบ") {
    return [`${value.toLocaleString()} คน`, "ผู้ได้รับผลกระทบ"];
  }
  return [value, name];
}

export default function FloodSearchPatterns({ initialData = [], initialRules = [] }) {
  const [isClient, setIsClient] = useState(false);
  const data = initialData;
  const rulesArray = Array.isArray(initialRules) ? initialRules : [];
  const [selectedProvince, setSelectedProvince] = useState("ขอนแก่น");
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState(1);

  useEffect(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = currentYear + 1;
    }

    if (nextYear > LAST_SELECTABLE_YEAR) {
      nextYear = LAST_SELECTABLE_YEAR;
      nextMonth = 12;
    }

    setSelectedYear(String(nextYear));
    setSelectedMonth(nextMonth);
    setIsClient(true);
  }, []);

  const provinceOptions = useMemo(() => {
    const names = Object.keys(provinceRegions);
    const options = [];
    for (let i = 0; i < names.length; i++) {
      options.push({ name: names[i], region: provinceRegions[names[i]] });
    }
    options.sort((a, b) => {
      const ai = regionOrder.indexOf(a.region);
      const bi = regionOrder.indexOf(b.region);
      if (ai !== bi) return ai - bi;
      return a.name.localeCompare(b.name);
    });
    return options;
  }, []);

  const filteredProvinces = useMemo(() => {
    const q = searchQuery.trim();
    if (q === "") return provinceOptions;
    const result = [];
    for (let i = 0; i < provinceOptions.length; i++) {
      if (provinceOptions[i].name.includes(q)) result.push(provinceOptions[i]);
    }
    return result;
  }, [provinceOptions, searchQuery]);

  useEffect(() => {
    if (filteredProvinces.length === 0) return;
    let stillThere = false;
    for (let i = 0; i < filteredProvinces.length; i++) {
      if (filteredProvinces[i].name === selectedProvince) {
        stillThere = true;
        break;
      }
    }
    if (!stillThere) setSelectedProvince(filteredProvinces[0].name);
  }, [filteredProvinces, selectedProvince]);

  const allYears = useMemo(() => {
    const years = [];
    for (let i = 0; i < ALL_YEARS.length; i++) {
      years.push(ALL_YEARS[i]);
    }
    for (let i = 0; i < data.length; i++) {
      const y = parseInt(data[i].year);
      if (data[i].year && !years.includes(y)) years.push(y);
    }
    for (let i = 0; i < rulesArray.length; i++) {
      const y = parseInt(rulesArray[i].year);
      if (rulesArray[i].year && !years.includes(y)) years.push(y);
    }
    const filteredYears = [];
    for (let i = 0; i < years.length; i++) {
      if (years[i] >= REAL_DATA_YEARS[0] && years[i] <= LAST_SELECTABLE_YEAR) {
        filteredYears.push(years[i]);
      }
    }
    filteredYears.sort((a, b) => b - a);
    return filteredYears;
  }, [rulesArray, data]);

  const isForecastYear = !REAL_DATA_YEARS.includes(parseInt(selectedYear));

  const monthRow = useMemo(() => {
    return getMonthRow(data, selectedProvince, selectedYear, selectedMonth);
  }, [data, selectedProvince, selectedYear, selectedMonth]);

  const avgRain = monthRow ? Math.round(parseFloat(monthRow.average_rain) || 0) : 0;

  const baseline = useMemo(
    () => getBaseline(data, selectedProvince, selectedMonth),
    [data, selectedProvince, selectedMonth]
  );

  const isHeavyRainActual = monthRow && baseline.value != null && avgRain > baseline.value;

  let rainPercentDiff = null;
  if (monthRow && baseline.value) {
    rainPercentDiff = Math.round(((avgRain - baseline.value) / baseline.value) * 100);
  }

  const currentRules = useMemo(() => {
    if (isForecastYear) return [];
    const filtered = [];
    for (let i = 0; i < rulesArray.length; i++) {
      const r = rulesArray[i];
      if (
        r.province === selectedProvince &&
        parseInt(r.year) === parseInt(selectedYear) &&
        parseInt(r.month) === parseInt(selectedMonth)
      ) {
        filtered.push(r);
      }
    }
    filtered.sort((a, b) => (a.confidence || 0) - (b.confidence || 0));
    return filtered;
  }, [rulesArray, selectedProvince, selectedYear, selectedMonth, isForecastYear]);

  const antecedentToField = {
    Search_น้ำท่วม: "search_flood",
    Search_ฝนตก: "search_rain",
    Search_พายุ: "search_storm",
    Search_ระดับน้ำ: "search_water_level",
    Search_สถานการณ์น้ำ: "search_water_situation",
    Search_อพยพ: "search_evacuate",
  };

  const fieldThresholds = useMemo(() => {
    const result = {};
    for (let f = 0; f < SEARCH_FIELDS.length; f++) {
      const field = SEARCH_FIELDS[f];
      const values = [];
      for (let i = 0; i < data.length; i++) {
        const r = data[i];
        if (r.province === selectedProvince && RULE_BASE_YEARS.includes(parseInt(r.year)) && r[field] != null) {
          values.push(Number(r[field]));
        }
      }
      values.sort((a, b) => a - b);
      if (values.length === 0) {
        result[field] = null;
      } else {
        result[field] = {
          p33: values[Math.floor(values.length * 0.33)],
          p67: values[Math.floor(values.length * 0.67)],
        };
      }
    }
    return result;
  }, [data, selectedProvince]);

  function levelOfValue(value, thr) {
    if (value == null || thr == null) return null;
    if (value <= thr.p33) return "Low";
    if (value <= thr.p67) return "Medium";
    return "High";
  }

  const currentLevels = useMemo(() => {
    const levels = {};
    for (let f = 0; f < SEARCH_FIELDS.length; f++) {
      const field = SEARCH_FIELDS[f];
      let val = null;
      if (monthRow && monthRow[field] != null) val = Number(monthRow[field]);
      levels[field] = levelOfValue(val, fieldThresholds[field]);
    }
    if (isHeavyRainActual) {
      levels.rain = "High";
    } else {
      levels.rain = "NotHigh";
    }
    return levels;
  }, [monthRow, fieldThresholds, isHeavyRainActual]);

  const pendingRules = useMemo(() => {
    if (!isForecastYear) return [];
    const pool = [];
    for (let i = 0; i < rulesArray.length; i++) {
      const r = rulesArray[i];
      if (r.province === selectedProvince && parseInt(r.month) === parseInt(selectedMonth)) {
        pool.push(r);
      }
    }

    const grouped = {};
    const groupKeys = [];
    for (let i = 0; i < pool.length; i++) {
      const r = pool[i];
      const key = asArray(r.antecedents).join(",") + "=>" + asArray(r.consequents).join(",");
      if (!grouped[key]) {
        grouped[key] = { antecedents: asArray(r.antecedents), consequents: asArray(r.consequents), confidenceSum: 0, count: 0 };
        groupKeys.push(key);
      }
      grouped[key].confidenceSum += r.confidence || 0;
      grouped[key].count += 1;
    }

    const merged = [];
    for (let i = 0; i < groupKeys.length; i++) {
      const e = grouped[groupKeys[i]];
      merged.push({
        antecedents: e.antecedents,
        consequents: e.consequents,
        confidence: e.confidenceSum / e.count,
      });
    }

    const matching = [];
    for (let i = 0; i < merged.length; i++) {
      const rule = merged[i];
      let allHigh = true;
      for (let j = 0; j < rule.antecedents.length; j++) {
        const ant = rule.antecedents[j];
        if (ant === "Rain_Heavy") {
          if (currentLevels.rain !== "High") allHigh = false;
        } else {
          const field = antecedentToField[ant];
          if (!field || currentLevels[field] !== "High") allHigh = false;
        }
      }
      if (allHigh) matching.push(rule);
    }
    matching.sort((a, b) => a.confidence - b.confidence);
    return matching;
  }, [isForecastYear, rulesArray, selectedProvince, selectedMonth, currentLevels]);

  const ruleCountInfo = useMemo(() => {
    let source;
    if (isForecastYear) {
      source = pendingRules;
    } else {
      source = currentRules;
    }
    const total = source ? source.length : 0;
    let shown = 0;
    if (source) {
      for (let i = 0; i < source.length; i++) {
        if ((source[i].confidence || 0) >= confidenceThreshold) shown++;
      }
    }
    return { total, shown };
  }, [currentRules, pendingRules, isForecastYear, confidenceThreshold]);

  const graphData = useMemo(() => {
    let source;
    if (isForecastYear) {
      source = pendingRules;
    } else {
      source = currentRules;
    }
    const rulesForGraph = source.slice();
    rulesForGraph.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    const nodesByLabel = {};
    const nodeOrder = [];
    const links = [];
    let maxRules;
    if (rulesForGraph.length > 15) {
      maxRules = 15;
    } else {
      maxRules = rulesForGraph.length;
    }

    for (let i = 0; i < maxRules; i++) {
      const rule = rulesForGraph[i];
      const antecedents = asArray(rule.antecedents);
      const consequents = asArray(rule.consequents);
      for (let j = 0; j < antecedents.length; j++) {
        const antLabel = translateWord(antecedents[j]);
        if (!nodesByLabel[antLabel]) {
          nodesByLabel[antLabel] = { id: antLabel, group: "cause", val: 3 };
          nodeOrder.push(antLabel);
        }
        for (let k = 0; k < consequents.length; k++) {
          const conLabel = translateWord(consequents[k]);
          if (!nodesByLabel[conLabel]) {
            nodesByLabel[conLabel] = { id: conLabel, group: "effect", val: 3 };
            nodeOrder.push(conLabel);
          }
          links.push({ source: antLabel, target: conLabel });
        }
      }
    }

    const nodes = [];
    for (let i = 0; i < nodeOrder.length; i++) {
      nodes.push(nodesByLabel[nodeOrder[i]]);
    }
    return { nodes, links };
  }, [currentRules, pendingRules, isForecastYear]);

  const realEvents = useMemo(() => {
    let years;
    if (isForecastYear) {
      years = REAL_DATA_YEARS;
    } else {
      years = [parseInt(selectedYear)];
    }
    const list = [];
    for (let i = 0; i < years.length; i++) {
      const events = getFloodEvents(data, selectedProvince, years[i], selectedMonth);
      for (let j = 0; j < events.length; j++) {
        list.push(events[j]);
      }
    }
    list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return list;
  }, [data, selectedProvince, selectedMonth, selectedYear, isForecastYear]);

  const hasRealEvent = realEvents.length > 0;

  const matchedRealEvent = useMemo(() => {
    if (isForecastYear) return false;
    return didFloodHappen(data, selectedProvince, selectedYear, selectedMonth);
  }, [data, selectedProvince, selectedYear, selectedMonth, isForecastYear]);

  const prediction = useMemo(
    () => predictFlood(data, selectedProvince, selectedYear, selectedMonth),
    [data, selectedProvince, selectedYear, selectedMonth]
  );
  const floodHistory = prediction.history;

  let rainVsBaselineLabel = "";
  if (baseline.value == null) {
    rainVsBaselineLabel = "ไม่มีค่าฝนปกติของเดือนนี้";
  } else if (!monthRow) {
    rainVsBaselineLabel = `ค่าปกติของเดือนนี้ ${baseline.value} มม.`;
  } else if (rainPercentDiff > 0) {
    rainVsBaselineLabel = `สูงกว่าค่าปกติ ${rainPercentDiff}% (ปกติ ${baseline.value} มม.)`;
  } else if (rainPercentDiff < 0) {
    rainVsBaselineLabel = `ต่ำกว่าค่าปกติ ${Math.abs(rainPercentDiff)}% (ปกติ ${baseline.value} มม.)`;
  } else {
    rainVsBaselineLabel = `เท่ากับค่าปกติ (${baseline.value} มม.)`;
  }

  const lineChartData = useMemo(() => {
    const result = [];
    for (let i = 0; i < ALL_YEARS.length; i++) {
      const y = ALL_YEARS[i];
      const isForecast = !REAL_DATA_YEARS.includes(y);
      const row = getMonthRow(data, selectedProvince, y, selectedMonth);
      const predicted = predictFlood(data, selectedProvince, y, selectedMonth);
      const chancePct = Math.round(predicted.chance * 100);

      let rainValue = null;
      if (row) rainValue = Math.round(parseFloat(row.average_rain) || 0);

      let realStat = null;
      if (!isForecast) realStat = chancePct;

      let trendValue = null;
      if (isForecast || y === LAST_REAL_YEAR) trendValue = chancePct;

      result.push({
        ปี: `พ.ศ. ${y + 543}`,
        ปริมาณฝน: rainValue,
        สถิติจริง: realStat,
        ค่าแนวโน้ม: trendValue,
        วิธี: predicted.label,
        isForecast,
      });
    }
    return result;
  }, [selectedProvince, selectedMonth, data]);

  const monthWindowData = useMemo(() => {
    if (isForecastYear) return [];

    const result = [];

    for (let offset = -3; offset <= 3; offset++) {
      let m = selectedMonth + offset;
      let y = parseInt(selectedYear);

      if (m < 1) {
        m = m + 12;
        y = y - 1;
      }
      if (m > 12) {
        m = m - 12;
        y = y + 1;
      }

      const events = getFloodEvents(data, selectedProvince, y, m);
      const occurred = events.length > 0;
      let affected = 0;
      for (let i = 0; i < events.length; i++) {
        affected += parseInt(events[i].affected_people) || 0;
      }

      const monthResult = predictFlood(data, selectedProvince, y, m);

      result.push({
        label: `${shortMonthNames[m]} ${String(y + 543).slice(-2)}`,
        month: m,
        year: y,
        ผู้ได้รับผลกระทบ: affected,
        โอกาสเกิดอุทกภัย: Math.round(monthResult.chance * 100),
        occurred,
        isSelected: offset === 0,
      });
    }

    return result;
  }, [isForecastYear, selectedMonth, selectedYear, selectedProvince, data, rulesArray]);

  const monthOptions = [];
  for (const key in thaiMonthNames) {
    monthOptions.push(parseInt(key));
  }

  if (!isClient) {
    return (
      <div className="min-h-[400px] bg-transparent rounded-2xl animate-pulse flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-sky-700/20 border-t-sky-700 rounded-full animate-spin"></div>
        <div className="text-sky-600 font-bold uppercase tracking-widest text-sm">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  const provinceOptgroups = [];
  for (let r = 0; r < regionOrder.length; r++) {
    const region = regionOrder[r];
    const namesInRegion = [];
    for (let i = 0; i < filteredProvinces.length; i++) {
      if (filteredProvinces[i].region === region) namesInRegion.push(filteredProvinces[i].name);
    }
    if (namesInRegion.length > 0) {
      const optionEls = [];
      for (let i = 0; i < namesInRegion.length; i++) {
        optionEls.push(<option key={namesInRegion[i]} value={namesInRegion[i]}>{namesInRegion[i]}</option>);
      }
      provinceOptgroups.push(
        <optgroup key={region} label={region}>
          {optionEls}
        </optgroup>
      );
    }
  }

  const yearOptionElements = [];
  for (let i = 0; i < allYears.length; i++) {
    const year = allYears[i];
    let suffix = "";
    if (!REAL_DATA_YEARS.includes(year)) suffix = " (แนวโน้ม)";
    yearOptionElements.push(
      <option key={year} value={year}>
        พ.ศ. {year + 543}
        {suffix}
      </option>
    );
  }

  const monthOptionElements = [];
  for (let i = 0; i < monthOptions.length; i++) {
    const m = monthOptions[i];
    monthOptionElements.push(<option key={m} value={m}>{thaiMonthNames[m]}</option>);
  }

  let searchHintText = "";
  if (searchQuery !== "") {
    if (filteredProvinces.length > 0) {
      searchHintText = `พบ ${filteredProvinces.length} จังหวัด`;
    } else {
      searchHintText = `ไม่พบจังหวัดที่ตรงกับ "${searchQuery}"`;
    }
  }

  let predictionCardTitle;
  if (isForecastYear) {
    predictionCardTitle = "โอกาสเกิดอุทกภัย (แนวโน้ม)";
  } else {
    predictionCardTitle = "สถานะอุทกภัย (สถิติจริง)";
  }

  let predictionValueBlock;
  if (isForecastYear) {
    let colorClass;
    if (prediction.willFlood) {
      colorClass = "text-orange-600";
    } else {
      colorClass = "text-emerald-600";
    }
    predictionValueBlock = (
      <>
        <span className={`text-4xl font-black ${colorClass}`}>
          {Math.round(prediction.chance * 100)}
        </span>
        <span className={`text-sm font-bold opacity-70 ${colorClass}`}>
          %
        </span>
      </>
    );
  } else {
    let colorClass;
    if (matchedRealEvent) {
      colorClass = "text-orange-600";
    } else {
      colorClass = "text-emerald-600";
    }
    let statusText;
    if (matchedRealEvent) {
      statusText = "เกิดอุทกภัย";
    } else {
      statusText = "ไม่เกิดอุทกภัย";
    }
    predictionValueBlock = (
      <span className={`text-3xl font-black ${colorClass}`}>
        {statusText}
      </span>
    );
  }

  let predictionSubtext;
  if (isForecastYear) {
    if (prediction.neighbors.length > 0) {
      predictionSubtext = `ใกล้เคียงกับ พ.ศ. ${prediction.neighbors[0].year + 543} มากที่สุด (${Math.round(prediction.neighbors[0].score * 100)}%)`;
    } else {
      predictionSubtext = `เดือนนี้เคยเกิดอุทกภัย ${floodHistory.count} จาก ${floodHistory.total} ปี`;
    }
  } else {
    predictionSubtext = `${realEvents.length} เหตุการณ์ · เดือนนี้เคยเกิด ${floodHistory.count} จาก ${floodHistory.total} ปี`;
  }

  let rainValueBlock;
  if (monthRow) {
    rainValueBlock = (
      <>
        <span className="text-4xl font-black text-purple-600">{avgRain}</span>
        <span className="text-sm font-bold opacity-70 text-purple-600">มม.</span>
      </>
    );
  } else {
    rainValueBlock = <span className="text-2xl font-black text-slate-400">ไม่มีข้อมูล</span>;
  }

  let trendSubtitle;
  if (isForecastYear) {
    trendSubtitle = `เดือน${thaiMonthNames[selectedMonth]} ปี ${REAL_DATA_YEARS[0] + 543}–${LAST_SELECTABLE_YEAR + 543}`;
  } else {
    trendSubtitle = `${thaiMonthNames[selectedMonth]} ±3 เดือน · พ.ศ. ${parseInt(selectedYear) + 543}`;
  }

  let bottomSummaryText;
  if (isForecastYear) {
    bottomSummaryText = `เดือน${thaiMonthNames[selectedMonth]} จังหวัด ${selectedProvince} ตั้งแต่ พ.ศ. ${REAL_DATA_YEARS[0] + 543} ถึง ${LAST_SELECTABLE_YEAR + 543}`;
  } else {
    bottomSummaryText = `${selectedProvince} ช่วง ±3 เดือนรอบ${thaiMonthNames[selectedMonth]} พ.ศ. ${parseInt(selectedYear) + 543}`;
  }

  const selectedWindowEntry = findSelectedWindowEntry(monthWindowData);

  function monthWindowTick(props) {
    const x = props.x;
    const y = props.y;
    const payload = props.payload;
    let isSelected = false;
    for (let i = 0; i < monthWindowData.length; i++) {
      if (monthWindowData[i].label === payload.value && monthWindowData[i].isSelected) {
        isSelected = true;
        break;
      }
    }
    let fillColor;
    let fontWeightValue;
    let fontSizeValue;
    if (isSelected) {
      fillColor = "#ef4444";
      fontWeightValue = 900;
      fontSizeValue = 13;
    } else {
      fillColor = "#475569";
      fontWeightValue = 600;
      fontSizeValue = 11;
    }
    return (
      <text x={x} y={y + 12} textAnchor="middle" fill={fillColor} fontWeight={fontWeightValue} fontSize={fontSizeValue}>
        {payload.value}
      </text>
    );
  }

  function monthWindowDot(props) {
    const cx = props.cx;
    const cy = props.cy;
    const payload = props.payload;
    const value = props.value;

    if (payload.isSelected) {
      let fillColor;
      if (value >= 50) {
        fillColor = "#ef4444";
      } else {
        fillColor = "#94a3b8";
      }
      return (
        <g key={`s-${cx}`}>
          <circle cx={cx} cy={cy} r={14} fill="#ef4444" fillOpacity={0.15} />
          <circle cx={cx} cy={cy} r={8} fill={fillColor} stroke="#fff" strokeWidth={3} />
        </g>
      );
    }

    let fillColor;
    if (value >= 50) {
      fillColor = "#ef4444";
    } else {
      fillColor = "#cbd5e1";
    }
    return <circle key={`d-${cx}`} cx={cx} cy={cy} r={5} fill={fillColor} stroke="#fff" strokeWidth={2} />;
  }

  let causeLegendText;
  if (hasNodeWithGroupAndId(graphData.nodes, "cause", "Rain_Heavy")) {
    causeLegendText = "เกิดเหตุการณ์ฝนตกหนัก พร้อมมีการค้นหาคำเหล่านี้";
  } else {
    causeLegendText = "มีการค้นหาคำเหล่านี้";
  }

  let effectLegendText;
  if (hasNodeWithGroupAndId(graphData.nodes, "effect", "Rain_Heavy")) {
    effectLegendText = "มักเกิดเหตุการณ์ฝนตกหนักตามมา";
  } else {
    effectLegendText = "มักตามมาด้วยการค้นหาคำนี้";
  }

  const visibleConfirmedRules = [];
  for (let i = 0; i < currentRules.length; i++) {
    if ((currentRules[i].confidence || 0) >= confidenceThreshold) visibleConfirmedRules.push(currentRules[i]);
  }
  const visiblePendingRules = [];
  for (let i = 0; i < pendingRules.length; i++) {
    if ((pendingRules[i].confidence || 0) >= confidenceThreshold) visiblePendingRules.push(pendingRules[i]);
  }

  let rainStatusBoxClass;
  if (isHeavyRainActual) {
    rainStatusBoxClass = "px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 bg-sky-50 border-sky-200 text-sky-700";
  } else {
    rainStatusBoxClass = "px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 bg-slate-50 border-slate-200 text-slate-500";
  }
  let rainStatusText;
  if (baseline.value == null) {
    rainStatusText = `ฝน ${avgRain} มม. (ไม่มีค่าปกติเทียบ)`;
  } else if (isHeavyRainActual) {
    rainStatusText = `ฝนสูงกว่าปกติ ${rainPercentDiff}% (${avgRain} มม.)`;
  } else {
    rainStatusText = `ฝนไม่เกินค่าปกติ (${avgRain} จาก ${baseline.value} มม.)`;
  }

  let ruleListSection;
  if (!isForecastYear) {
    if (visibleConfirmedRules.length > 0) {
      const cards = [];
      for (let i = 0; i < visibleConfirmedRules.length; i++) {
        const rule = visibleConfirmedRules[i];
        const antecedentLabels = translateWordList(asArray(rule.antecedents));
        const antecedentTags = [];
        for (let j = 0; j < antecedentLabels.length; j++) {
          antecedentTags.push(
            <span key={j} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl text-xs font-bold border border-orange-100">
              {antecedentLabels[j]}
            </span>
          );
        }
        cards.push(
          <div key={i} className="flex flex-col gap-3 p-5">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">คำค้นหาที่พบ</span>
              <div className="flex flex-wrap gap-2">
                {antecedentTags}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowBackIcon className="text-slate-300 rotate-[-90deg]" fontSize="small" />
              <div className={rainStatusBoxClass}>
                <WaterDropIcon fontSize="small" />
                {rainStatusText}
              </div>
              <span className="text-xs font-bold text-green-600 ml-auto shrink-0">
                {Math.round((rule.confidence || 0) * 100)}%
              </span>
            </div>
          </div>
        );
      }
      ruleListSection = <div className="divide-y divide-slate-100">{cards}</div>;
    } else {
      let emptyMessage;
      if (currentRules.length > 0) {
        emptyMessage = "ไม่มีกฎที่ผ่านเกณฑ์ความมั่นใจที่เลือกไว้";
      } else {
        emptyMessage = "ไม่พบรูปแบบความสัมพันธ์ของคำค้นหาในเดือนนี้";
      }
      ruleListSection = (
        <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
          <HubIcon className="text-slate-200" sx={{ fontSize: 40 }} />
          <p className="text-slate-500 font-bold text-sm">
            {emptyMessage}
          </p>
        </div>
      );
    }
  } else {
    if (visiblePendingRules.length > 0) {
      const cards = [];
      for (let i = 0; i < visiblePendingRules.length; i++) {
        const rule = visiblePendingRules[i];
        const antecedentLabels = translateWordList(asArray(rule.antecedents));
        const consequentLabels = translateWordList(asArray(rule.consequents));
        const antecedentTags = [];
        for (let j = 0; j < antecedentLabels.length; j++) {
          antecedentTags.push(
            <span key={j} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl text-xs font-bold border border-orange-100">
              {antecedentLabels[j]}
            </span>
          );
        }
        const consequentTags = [];
        for (let j = 0; j < consequentLabels.length; j++) {
          consequentTags.push(
            <span key={j} className="px-3 py-1.5 bg-sky-50 text-sky-700 rounded-xl text-xs font-bold border border-sky-100">
              {consequentLabels[j]}
            </span>
          );
        }
        cards.push(
          <div key={i} className="flex flex-col gap-3 p-5">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">รูปแบบที่ตรงกับข้อมูลจริง</span>
              <div className="flex flex-wrap gap-2">
                {antecedentTags}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ArrowBackIcon className="text-slate-300 rotate-[-90deg]" fontSize="small" />
              <div className="flex flex-wrap gap-2">
                {consequentTags}
              </div>
              <span className="text-xs font-bold text-green-600 ml-auto shrink-0">
                {Math.round((rule.confidence || 0) * 100)}%
              </span>
            </div>
          </div>
        );
      }
      ruleListSection = <div className="divide-y divide-slate-100">{cards}</div>;
    } else {
      let emptyMessage;
      if (pendingRules.length > 0) {
        emptyMessage = "ไม่มีกฎที่ผ่านเกณฑ์ความมั่นใจที่เลือกไว้";
      } else {
        emptyMessage = "ไม่พบรูปแบบที่ตรงกับข้อมูลจริงในเดือนนี้";
      }
      ruleListSection = (
        <div className="w-full min-h-[250px] p-8 flex flex-col items-center justify-center gap-3 text-center">
          <TimelineIcon className="text-slate-200" sx={{ fontSize: 40 }} />
          <p className="text-slate-500 font-bold text-sm">
            {emptyMessage}
          </p>
        </div>
      );
    }
  }

  const realEventRows = [];
  for (let i = 0; i < realEvents.length; i++) {
    const e = realEvents[i];
    let dateText;
    if (e.date) {
      dateText = formatThaiDate(e.date);
    } else {
      dateText = `${thaiMonthNames[selectedMonth]} ${parseInt(e.year) + 543}`;
    }
    let affectedText;
    if (parseInt(e.affected_people) > 0) {
      affectedText = parseInt(e.affected_people).toLocaleString();
    } else {
      affectedText = "ไม่มีบันทึก";
    }
    realEventRows.push(
      <tr key={i} className="hover:bg-[#fff9d4]/50 transition-colors">
        <td className="px-4 py-3 font-bold text-slate-800 text-[13px]">
          {dateText}
        </td>
        <td className="px-4 py-3 text-center font-bold text-sky-700 text-[13px]">
          {affectedText}
        </td>
        <td className="px-4 py-3 text-center font-bold text-slate-400 text-[13px]">
          {formatCountOrDash(parseInt(e.fatalities))}
        </td>
      </tr>
    );
  }

  let noEventText;
  if (isForecastYear) {
    noEventText = "ไม่พบสถิติรายงานอุทกภัยในอดีตสำหรับเดือนนี้";
  } else {
    noEventText = `ไม่มีรายงานเหตุอุทกภัยจริงในเดือน${thaiMonthNames[selectedMonth]} พ.ศ. ${parseInt(selectedYear) + 543}`;
  }

  let summaryBox;
  if (!isForecastYear) {
    if (matchedRealEvent) {
      summaryBox = (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
          <VerifiedIcon className="text-red-500 shrink-0 mt-0.5" fontSize="small" />
          <span>
            เกิดอุทกภัยจริงในเดือน{thaiMonthNames[selectedMonth]} พ.ศ. {parseInt(selectedYear) + 543} รวม {realEvents.length} เหตุการณ์ · เดือนนี้เคยเกิดอุทกภัย {floodHistory.count} จาก {floodHistory.total} ปี
          </span>
        </div>
      );
    } else {
      summaryBox = (
        <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 flex items-start gap-2">
          <ReportIcon className="text-slate-400 shrink-0 mt-0.5" fontSize="small" />
          <span>
            ไม่มีรายงานอุทกภัยในเดือน{thaiMonthNames[selectedMonth]} พ.ศ. {parseInt(selectedYear) + 543} · เดือนนี้เคยเกิดอุทกภัย {floodHistory.count} จาก {floodHistory.total} ปี
          </span>
        </div>
      );
    }
  } else if (prediction.willFlood) {
    summaryBox = (
      <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 flex items-start gap-2">
        <AutoGraphIcon className="text-orange-600 shrink-0 mt-0.5" fontSize="small" />
        <span>
          แนวโน้มที่จะเกิดขึ้นในเดือน {thaiMonthNames[selectedMonth]} พ.ศ. {parseInt(selectedYear) + 543}: มีโอกาสเกิดอุทกภัย {Math.round(prediction.chance * 100)}% · {prediction.label}
          {prediction.neighbors.length > 0 && ` · ใกล้เคียงกับ พ.ศ. ${prediction.neighbors[0].year + 543} มากที่สุด`}
        </span>
      </div>
    );
  } else {
    summaryBox = (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
        <VerifiedIcon className="text-emerald-600 shrink-0 mt-0.5" fontSize="small" />
        <span>
          แนวโน้มที่จะเกิดขึ้นในเดือน {thaiMonthNames[selectedMonth]} พ.ศ. {parseInt(selectedYear) + 543}: มีโอกาสเกิดอุทกภัย {Math.round(prediction.chance * 100)}% · {prediction.label}
          {prediction.neighbors.length > 0 && ` · ใกล้เคียงกับ พ.ศ. ${prediction.neighbors[0].year + 543} มากที่สุด`}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 bg-sky-700">
          <div className="p-2 rounded-lg bg-white/15 flex items-center justify-center shadow-sm flex-shrink-0 text-white">
            <TuneIcon fontSize="small" />
          </div>
          <h3 className="text-white font-bold text-sm m-0">ตัวกรองข้อมูล</h3>
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">ค้นหาจังหวัด</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                <span className="text-slate-400 mr-2 flex-shrink-0">
                  <SearchIcon fontSize="small" />
                </span>
                <input
                  type="text"
                  className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none placeholder:text-slate-400 placeholder:font-normal cursor-text w-full"
                  placeholder="พิมพ์ชื่อจังหวัด..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery !== "" && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400 hover:text-slate-600 ml-2 flex-shrink-0 text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">จังหวัด</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer w-full"
                >
                  {provinceOptgroups}
                </select>
                <div className="pointer-events-none text-slate-400 ml-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">ปี พ.ศ.</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer w-full"
                >
                  {yearOptionElements}
                </select>
                <div className="pointer-events-none text-slate-400 ml-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">เดือน</label>
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer w-full"
                >
                  {monthOptionElements}
                </select>
                <div className="pointer-events-none text-slate-400 ml-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                </div>
              </div>
            </div>

          </div>

          {searchQuery !== "" && (
            <p className="text-[11px] font-bold text-slate-400 mt-3 pl-2">
              {searchHintText}
            </p>
          )}
        </div>

        {isForecastYear && (
          <div className="px-5 pb-4 -mt-1 space-y-2">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold">
              <AutoGraphIcon fontSize="small" />
              ปีนี้ยังไม่มีสถิติอุทกภัยยืนยัน — หาแนวโน้มจากฐานข้อมูลปี {REAL_DATA_YEARS[0] + 543}–{LAST_REAL_YEAR + 543}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className={`p-6 rounded-[2rem] border-2 shadow-sm ${prediction.willFlood ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200"}`}>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
            {predictionCardTitle}
          </p>
          <div className="flex items-baseline gap-1">
            {predictionValueBlock}
          </div>
          <p className="text-[11px] text-slate-500 font-bold mt-1">
            {predictionSubtext}
          </p>
        </div>
        <div className="p-6 rounded-[2rem] border-2 bg-purple-50 border-purple-200 shadow-sm">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
            ปริมาณน้ำฝนประจำเดือน
          </p>
          <div className="flex items-baseline gap-1">
            {rainValueBlock}
          </div>
          <p className="text-[11px] text-slate-400/70 font-bold mt-1">
            {rainVsBaselineLabel}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">

        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-sky-700 shadow-sm text-white flex">
            <ShowChartIcon fontSize="small" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold tracking-tight leading-none text-lg">
              แนวโน้มความเสี่ยงอุทกภัย
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
              {selectedProvince} · {trendSubtitle}
            </p>
          </div>
        </div>

        <div className="p-6">

          {isForecastYear && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={lineChartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                <XAxis
                  dataKey="ปี"
                  tick={{ fontSize: 12, fontWeight: 700, fill: "#475569" }}
                />

                <YAxis
                  yAxisId="chance"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />

                <Tooltip
                  formatter={forecastTooltipFormatter}
                  labelFormatter={forecastLabelFormatter}
                />

                <ReferenceArea
                  yAxisId="chance"
                  x1={`พ.ศ. ${LAST_REAL_YEAR + 543}`}
                  x2={`พ.ศ. ${LAST_SELECTABLE_YEAR + 543}`}
                  fill="#8b5cf6"
                  fillOpacity={0.07}
                  label={{ value: "ช่วงแนวโน้ม", position: "insideTop", fontSize: 10, fill: "#8b5cf6" }}
                />

                <ReferenceLine
                  yAxisId="chance"
                  y={50}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: "เกณฑ์ 50%", position: "right", fontSize: 10, fill: "#94a3b8" }}
                />

                <Line
                  yAxisId="chance"
                  type="monotone"
                  dataKey="สถิติจริง"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={actualDot}
                />

                <Line
                  yAxisId="chance"
                  type="monotone"
                  dataKey="ค่าแนวโน้ม"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  strokeDasharray="7 4"
                  connectNulls={true}
                  dot={forecastDot}
                />

                <ReferenceLine
                  yAxisId="chance"
                  x={`พ.ศ. ${LAST_REAL_YEAR + 1 + 543}`}
                  stroke="#8b5cf6"
                  strokeDasharray="4 2"
                  strokeOpacity={0.5}
                  label={{ value: "เริ่มแนวโน้ม", position: "top", fontSize: 10, fill: "#8b5cf6" }}
                />

              </LineChart>
            </ResponsiveContainer>
          )}

          {!isForecastYear && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={monthWindowData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                <XAxis
                  dataKey="label"
                  tick={monthWindowTick}
                />

                <YAxis
                  yAxisId="chance"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />

                <Tooltip
                  formatter={monthWindowTooltipFormatter}
                />

                <ReferenceLine
                  yAxisId="chance"
                  y={50}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: "เกณฑ์ 50%", position: "right", fontSize: 10, fill: "#94a3b8" }}
                />

                <Line
                  yAxisId="chance"
                  type="monotone"
                  dataKey="โอกาสเกิดอุทกภัย"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  connectNulls={true}
                  dot={monthWindowDot}
                />

                {selectedWindowEntry && (
                  <ReferenceLine
                    yAxisId="chance"
                    x={selectedWindowEntry.label}
                    stroke="#ef4444"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    strokeOpacity={0.5}
                    label={{
                      value: "เดือนที่เลือก",
                      position: "top",
                      fontSize: 10,
                      fill: "#ef4444",
                    }}
                  />
                )}

              </LineChart>
            </ResponsiveContainer>
          )}

          <div className="flex flex-wrap items-center gap-5 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span className="text-xs font-bold text-slate-500">ตั้งแต่ 50% ขึ้นไป · เกิดอุทกภัย</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
              <span className="text-xs font-bold text-slate-500">ต่ำกว่า 50% · ไม่เกิดอุทกภัย</span>
            </div>
          </div>

          <p className="text-sm text-slate-600 mt-4 text-center">
            {bottomSummaryText}
          </p>

        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-sky-700 shadow-sm text-white flex">
                <HubIcon fontSize="small" />
              </div>
              <div>
                <h3 className="text-slate-800 font-bold tracking-tight leading-none text-base">
                  พฤติกรรมการค้นหาจาก Google Trends เทียบกับสถานการณ์จริง
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                  {selectedProvince} · {thaiMonthNames[selectedMonth]} {parseInt(selectedYear) + 543}
                </p>
              </div>
            </div>

            {graphData.nodes.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 pt-3 mt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                    {causeLegendText}
                  </span>
                </div>

                <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                    {effectLegendText}
                  </span>
                </div>
              </div>
            )}
          </div>

          {graphData.nodes.length > 0 && (
            <div className="border-b border-slate-100 h-[260px] bg-[#fafcff] flex justify-center items-center relative overflow-hidden">
              <div className="cursor-grab active:cursor-grabbing w-full flex justify-center items-center">
                <ForceGraph2D
                  graphData={graphData}
                  nodeColor={(node) => {
                    if (node.group === "cause") return "#F59E0B";
                    return "#0EA5E9";
                  }}
                  nodeVal="val"
                  linkDirectionalParticles={2}
                  height={260}
                  nodeCanvasObject={(node, ctx, globalScale) => {
                    const label = node.id;
                    const fontSize = 14 / globalScale;
                    ctx.font = `${fontSize}px Arial`;
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#334155";
                    ctx.fillText(label, node.x, node.y + 12);
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
                    if (node.group === "cause") {
                      ctx.fillStyle = "#F59E0B";
                    } else {
                      ctx.fillStyle = "#0EA5E9";
                    }
                    ctx.fill();
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 px-5 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                เกณฑ์ขั้นต่ำในการคัดกรองรูปแบบความสัมพันธ์
              </label>
              <span className="text-[11px] font-bold text-slate-400">
                {ruleCountInfo.shown}/{ruleCountInfo.total} รูปแบบ
              </span>
            </div>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100 w-fit">
              <select
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="bg-transparent py-2.5 pr-8 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"
              >
                <option value={0}>ทั้งหมด</option>
                <option value={0.1}>≥10%</option>
                <option value={0.3}>≥30%</option>
                <option value={0.5}>≥50%</option>
              </select>
              <svg className="w-4 h-4 text-slate-400 -ml-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[350px]">
            {ruleListSection}
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 bg-sky-700 flex items-center gap-3">
            <div className="p-1.5 bg-black/10 rounded-lg text-white flex items-center justify-center">
              <ReportIcon fontSize="small" />
            </div>
            <div>
              <h3 className="text-white font-bold tracking-tight text-base leading-none">
                เหตุการณ์อุทกภัยจริงที่เคยเกิดขึ้น{" "}
                {isForecastYear ? `(อ้างอิงอดีต พ.ศ. ${REAL_DATA_YEARS[0] + 543}–${LAST_REAL_YEAR + 543})` : `(พ.ศ. ${parseInt(selectedYear) + 543})`}
              </h3>
              <p className="text-white/90 text-[11.5px] mt-1">
                {selectedProvince} · เดือน{thaiMonthNames[selectedMonth]}
              </p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[280px]">
            {hasRealEvent ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-[12px] font-bold text-sky-700">วันที่ / ปี</th>
                      <th className="px-4 py-3 text-[12px] font-bold text-sky-700 text-center">ผู้ได้รับผลกระทบ</th>
                      <th className="px-4 py-3 text-[12px] font-bold text-sky-700 text-center">เสียชีวิต</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/50 bg-[#fffdf0]">
                    {realEventRows}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center gap-3 bg-white h-full text-center">
                <div className="p-4 bg-slate-100 rounded-full border border-slate-200 text-slate-400">
                  <WaterDropIcon fontSize="large" />
                </div>
                <p className="text-slate-500 font-bold text-sm">
                  {noEventText}
                </p>
              </div>
            )}
          </div>
          <div className="p-5 bg-slate-50 border-t border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <EmojiObjectsIcon className="text-amber-500" fontSize="small" />
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                สรุปผล
              </h4>
            </div>
            <div className="text-xs font-bold leading-relaxed">
              {summaryBox}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
