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
// ปีที่มีสถิติอุทกภัยยืนยันแล้วในตาราง flood_data
const REAL_DATA_YEARS = [2020, 2021, 2022, 2023, 2024];
// ใช้ปีเดียวกันเป็นฐานอ้างอิงทั้งหมด (เดิมตัดปี 2567 ออกโดยไม่จำเป็น)
const RULE_BASE_YEARS = REAL_DATA_YEARS;

// ขอบเขตข้อมูลจริงในฐานข้อมูล
const SEARCH_END_YEAR = 2025;    // search_trends มีถึง ธ.ค. 2568
const SEARCH_END_MONTH = 12;
const RAIN_END_YEAR = 2026;      // rainfall_monthly มีถึง พ.ค. 2569
const RAIN_END_MONTH = 5;

// ปีสุดท้ายที่ให้เลือกได้ในหน้าเว็บ (ต้องตรงกับตัวเลือกปีด้านล่าง)
const LAST_SELECTABLE_YEAR = 2027;

// ปีสุดท้ายที่มีสถิติจริง ใช้เป็นจุดต่อระหว่างเส้นทึบกับเส้นประ
const LAST_REAL_YEAR = REAL_DATA_YEARS[REAL_DATA_YEARS.length - 1];

// ปีทั้งหมดที่แสดงในหน้าเว็บ สร้างจากค่าคงที่ข้างบน จะได้ไม่ต้องแก้หลายที่
const ALL_YEARS = [];
for (let y = REAL_DATA_YEARS[0]; y <= LAST_SELECTABLE_YEAR; y++) {
  ALL_YEARS.push(y);
}

// วิธีที่ใช้หาคำตอบ เรียงจากข้อมูลมากไปน้อย
const METHOD_CONFIRMED = "confirmed";        // มีสถิติจริง
const METHOD_SEARCH_RAIN = "search_rain";    // เทียบคำค้น + ฝน
const METHOD_RAIN_ONLY = "rain_only";        // เทียบฝนอย่างเดียว
const METHOD_HISTORY = "history";            // ใช้ความถี่ในอดีต

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

const translateWord = (word) => {
  const dict = {
    Rain_Heavy: "ฝนตกหนัก",
    Search_ฝนตกหนัก: "ค้นหา 'ฝนตกหนัก'",
    Search_น้ำท่วม: "ค้นหา 'น้ำท่วม'",
    Search_พายุ: "ค้นหา 'พายุ'",
    Search_อพยพ: "ค้นหา 'อพยพ'",
    Search_ระดับน้ำ: "ค้นหา 'ระดับน้ำ'",
    Search_สถานการณ์น้ำ: "ค้นหา 'สถานการณ์น้ำ'",
  };
  return dict[word] || word;
};


const antecedentToField = {
  Search_น้ำท่วม: "search_flood",
  Search_ฝนตกหนัก: "search_rain",
  Search_พายุ: "search_storm",
  Search_ระดับน้ำ: "search_water_level",
  Search_สถานการณ์น้ำ: "search_water_situation",
  Search_อพยพ: "search_evacuate",
};

// antecedents ในฐานข้อมูลเก็บเป็นสตริง "Rain_Heavy, Search_พายุ"
// เดิมไม่ได้ split ทำให้กฎที่มีหลายเงื่อนไข (54% ของทั้งหมด) ถูกตัดทิ้ง
function asArray(x) {
  if (Array.isArray(x)) return x;
  if (x === undefined || x === null || x === "") return [];
  return String(x)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

// ── ฟังก์ชันช่วยเรื่องข้อมูลอุทกภัย ─────────────────────────

// ทุกแถวใน flood_data คือเหตุการณ์จริง
// ค่า 0 ใน affected_people แปลว่า "ไม่มีบันทึกผู้ประสบภัย" ไม่ใช่ "ไม่ท่วม"
function getFloodEvents(data, province, year, month) {
  return data.filter(
    (r) =>
      r.province === province &&
      parseInt(r.year) === parseInt(year) &&
      parseInt(r.month) === parseInt(month) &&
      r.date
  );
}

function didFloodHappen(data, province, year, month) {
  return getFloodEvents(data, province, year, month).length > 0;
}

// นับว่าเดือนนี้ของจังหวัดนี้เคยท่วมกี่ปี จากปีที่มีสถิติจริง
function countFloodYears(data, province, month) {
  const years = REAL_DATA_YEARS.filter((y) =>
    didFloodHappen(data, province, y, month)
  );
  return {
    years: years,
    count: years.length,
    total: REAL_DATA_YEARS.length,
    rate: years.length / REAL_DATA_YEARS.length,
  };
}

// หาแถวข้อมูลฝน + คำค้นของเดือนนั้น (แถวแรกพอ เพราะค่าเหมือนกันทุกแถว)
function getMonthRow(data, province, year, month) {
  return (
    data.find(
      (r) =>
        r.province === province &&
        parseInt(r.year) === parseInt(year) &&
        parseInt(r.month) === parseInt(month)
    ) || null
  );
}

// ── ค่าฝนปกติ (baseline) ของจังหวัดนั้นเดือนนั้น ──────────
// baseline_mean ติดมากับทุกแถวแล้วจาก LEFT JOIN ใน rainfall.js
// เดือน 8-12 ยังไม่มีในตาราง จะเป็น null ให้คำนวณจากค่าเฉลี่ยย้อนหลังแทน
function getBaseline(data, province, month) {
  const rows = data.filter(
    (r) => r.province === province && parseInt(r.month) === parseInt(month)
  );
  if (rows.length === 0) return { value: null, fromTable: false };

  const withBaseline = rows.find((r) => r.baseline_mean != null);
  if (withBaseline) {
    return { value: Math.round(parseFloat(withBaseline.baseline_mean)), fromTable: true };
  }

  const past = rows.filter((r) => RULE_BASE_YEARS.includes(parseInt(r.year)));
  if (past.length === 0) return { value: null, fromTable: false };
  let sum = 0;
  past.forEach((r) => {
    sum += parseFloat(r.average_rain) || 0;
  });
  return { value: Math.round(sum / past.length), fromTable: false };
}

// ── ฟังก์ชันพยากรณ์ ────────────────────────────────────────

const SEARCH_FIELDS = [
  "search_flood",
  "search_rain",
  "search_storm",
  "search_water_level",
  "search_water_situation",
  "search_evacuate",
];

// เลือกวิธีตามข้อมูลที่มีของปี-เดือนนั้น
function pickMethod(year, month) {
  const y = parseInt(year);
  const m = parseInt(month);
  if (REAL_DATA_YEARS.includes(y)) return METHOD_CONFIRMED;
  if (y * 12 + m <= SEARCH_END_YEAR * 12 + SEARCH_END_MONTH) return METHOD_SEARCH_RAIN;
  if (y * 12 + m <= RAIN_END_YEAR * 12 + RAIN_END_MONTH) return METHOD_RAIN_ONLY;
  return METHOD_HISTORY;
}

// สร้างรายการตัวเลขไว้เทียบกัน
function makeFeatures(row, useSearch) {
  if (!row) return null;
  const list = [];
  if (useSearch) {
    SEARCH_FIELDS.forEach((f) => list.push(Number(row[f]) || 0));
  }
  list.push(Number(row.average_rain) || 0);
  return list;
}

// ปรับให้ทุกตัวอยู่ช่วง 0-1 เพราะคำค้นอยู่ 0-100 แต่ฝนอยู่ 0-1500
function scaleAll(lists) {
  const size = lists[0].length;
  const mins = [];
  const maxs = [];
  for (let i = 0; i < size; i++) {
    let lo = Infinity;
    let hi = -Infinity;
    lists.forEach((l) => {
      if (l[i] < lo) lo = l[i];
      if (l[i] > hi) hi = l[i];
    });
    mins.push(lo);
    maxs.push(hi);
  }
  return lists.map((l) =>
    l.map((v, i) => (maxs[i] === mins[i] ? 0 : (v - mins[i]) / (maxs[i] - mins[i])))
  );
}

// ยิ่งใกล้กันยิ่งได้คะแนนสูง (0 ถึง 1)
function similarity(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) * (a[i] - b[i]);
  }
  return 1 / (1 + Math.sqrt(sum));
}

// พยากรณ์ว่าเดือนนั้นจะเกิดอุทกภัยหรือไม่
// ทุกวิธีใช้ฐานปี 2563-2567 เหมือนกัน ต่างกันแค่มีอะไรให้เทียบ
function predictFlood(data, province, year, month) {
  const method = pickMethod(year, month);
  const history = countFloodYears(data, province, month);

  // มีสถิติจริงแล้ว ไม่ต้องเดา
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

  // ไม่มีทั้งคำค้นและฝน ใช้ความถี่ในอดีตอย่างเดียว
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

  // เทียบรูปแบบกับปีที่มีสถิติจริง
  const useSearch = method === METHOD_SEARCH_RAIN;
  const targetRow = getMonthRow(data, province, year, month);
  const targetFeatures = makeFeatures(targetRow, useSearch);

  const candidates = [];
  REAL_DATA_YEARS.forEach((y) => {
    const row = getMonthRow(data, province, y, month);
    const features = makeFeatures(row, useSearch);
    if (!features) return;
    candidates.push({
      year: y,
      features: features,
      flooded: didFloodHappen(data, province, y, month),
      rain: Math.round(Number(row.average_rain) || 0),
    });
  });

  // ถ้าเทียบไม่ได้ ถอยไปใช้ความถี่ในอดีต ไม่ปล่อยให้ว่าง
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

  const scaled = scaleAll([targetFeatures].concat(candidates.map((c) => c.features)));
  const neighbors = candidates
    .map((c, i) => ({
      year: c.year,
      flooded: c.flooded,
      rain: c.rain,
      score: similarity(scaled[0], scaled[i + 1]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // โหวตโดยให้น้ำหนักตามความคล้าย
  let floodWeight = 0;
  let totalWeight = 0;
  neighbors.forEach((n) => {
    totalWeight += n.score;
    if (n.flooded) floodWeight += n.score;
  });
  const chance = totalWeight > 0 ? floodWeight / totalWeight : 0;

  return {
    method: method,
    label: METHOD_LABELS[method],
    willFlood: chance >= 0.5,
    chance: chance,
    neighbors: neighbors,
    history: history,
    note: useSearch ? "" : "ไม่มีข้อมูลการค้นหาของปีนี้ เทียบจากปริมาณฝนอย่างเดียว",
  };
}

function nodeCanvasObject(node, ctx, globalScale) {
  const label = node.id;
  const fontSize = 12 / globalScale;
  ctx.font = `bold ${fontSize}px Sans-Serif`;
  ctx.fillStyle = node.group === "cause" ? "#f97316" : "#0369a1";
  ctx.beginPath();
  ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false);
  ctx.fill();
  ctx.fillStyle = "#334155";
  ctx.fillText(label, node.x + 8, node.y + 3);
}

export default function FloodSearchPatterns({ initialData = [], initialRules = [] }) {
  const [isClient, setIsClient] = useState(false);
  const data = initialData;
  const rulesArray = Array.isArray(initialRules) ? initialRules : [];
  const [selectedProvince, setSelectedProvince] = useState("ขอนแก่น");
  const [searchQuery, setSearchQuery] = useState("");
const [selectedYear, setSelectedYear] = useState("2026");
const [selectedMonth, setSelectedMonth] = useState(1);
 useEffect(() => {
  // ตั้งค่าเริ่มต้นเป็น "เดือนหน้า" เพื่อให้เปิดมาเห็นแนวโน้มล่วงหน้าทันที
  const now = new Date();
  const currentYear  = now.getFullYear();   // ค.ศ.
  const currentMonth = now.getMonth() + 1;  // 1-12

  // เดือนหน้า: ถ้าเดือนปัจจุบันคือ 12 ให้ข้ามไปปีถัดไป
  let nextMonth = currentMonth + 1;
  let nextYear  = currentYear;
  if (nextMonth > 12) {
    nextMonth = 1;
    nextYear  = currentYear + 1;
  }

  // ถ้าเดือนหน้าเลยช่วงที่ตัวเลือกปีรองรับ ให้หยุดที่ปีสุดท้าย
  if (nextYear > LAST_SELECTABLE_YEAR) {
    nextYear = LAST_SELECTABLE_YEAR;
    nextMonth = 12;
  }

  setSelectedYear(String(nextYear));
  setSelectedMonth(nextMonth);
  setIsClient(true);
}, []);
  const provinceOptions = useMemo(() => {
      const options = Object.keys(provinceRegions).map((name) => ({ name, region: provinceRegions[name] }));
      options.sort((a, b) => {
          const ai = regionOrder.indexOf(a.region);
          const bi = regionOrder.indexOf(b.region);
          if (ai !== bi) return ai - bi;
          return a.name.localeCompare(b.name);
      });
      return options;
    }, []);

  // กรองรายชื่อจังหวัดในกล่องเลือก ตามคำที่พิมพ์ในช่องค้นหา
  const filteredProvinces = useMemo(() => {
      const q = searchQuery.trim();
      if (q === "") return provinceOptions;
      return provinceOptions.filter((p) => p.name.includes(q));
    }, [provinceOptions, searchQuery]);

  // ถ้าพิมพ์แล้วจังหวัดที่เลือกอยู่ไม่อยู่ในผลค้นหา ให้เลือกตัวแรกที่เจอแทน
  // หน้าเว็บจะได้ไม่แสดงข้อมูลของจังหวัดที่ผู้ใช้มองไม่เห็นในรายการ
  useEffect(() => {
      if (filteredProvinces.length === 0) return;
      const stillThere = filteredProvinces.some((p) => p.name === selectedProvince);
      if (!stillThere) setSelectedProvince(filteredProvinces[0].name);
    }, [filteredProvinces, selectedProvince]);

  const allYears = useMemo(() => {
      const years = new Set(ALL_YEARS);
      data.forEach((r) => {
          if (r.year) years.add(parseInt(r.year));
      });
      rulesArray.forEach((r) => {
          if (r.year) years.add(parseInt(r.year));
      });
      return Array.from(years).sort((a, b) => b - a);
    }, [rulesArray, data]);
  const isForecastYear = !REAL_DATA_YEARS.includes(parseInt(selectedYear));
  const monthRow = useMemo(() => {
      const found = data.find(
        (row) =>
        row.province === selectedProvince &&
        parseInt(row.year) === parseInt(selectedYear) &&
        parseInt(row.month) === parseInt(selectedMonth)
      );
      return found || null;
    }, [data, selectedProvince, selectedYear, selectedMonth]);
  const avgRain = monthRow ? Math.round(parseFloat(monthRow.average_rain) || 0) : 0;
  // เทียบฝนเดือนนี้กับค่าปกติของจังหวัดนี้เดือนนี้ แทนการใช้ตัวเลขเดียวทั้งประเทศ
  const baseline = useMemo(
      () => getBaseline(data, selectedProvince, selectedMonth),
      [data, selectedProvince, selectedMonth]
    );
  const isHeavyRainActual = monthRow && baseline.value != null && avgRain > baseline.value;
  // สูงกว่าค่าปกติกี่เปอร์เซ็นต์
  const rainPercentDiff =
    monthRow && baseline.value ? Math.round(((avgRain - baseline.value) / baseline.value) * 100) : null;
  const currentRules = useMemo(() => {
      if (isForecastYear) return [];
      return rulesArray
      .filter(
        (r) =>
        r.province === selectedProvince &&
        parseInt(r.year) === parseInt(selectedYear) &&
        parseInt(r.month) === parseInt(selectedMonth)
      )
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    }, [rulesArray, selectedProvince, selectedYear, selectedMonth, isForecastYear]);
  const historicalMonthRules = useMemo(() => {
      const pool = rulesArray.filter(
        (r) =>
        r.province === selectedProvince &&
        parseInt(r.month) === parseInt(selectedMonth) &&
        RULE_BASE_YEARS.includes(parseInt(r.year))
      );
      const map = new Map();
      pool.forEach((r) => {
          const key = asArray(r.antecedents).join(",") + "=>" + asArray(r.consequents).join(",");
          if (!map.has(key)) {
            map.set(key, {
                antecedents: asArray(r.antecedents),
                consequents: asArray(r.consequents),
                confidenceSum: 0,
                count: 0,
                monthsWithFlood: 0,
            });
          }
          const entry = map.get(key);
          entry.confidenceSum += r.confidence || 0;
          entry.count += 1;
          entry.monthsWithFlood += parseInt(r.months_with_flood) || 0;
      });
      let merged = Array.from(map.values()).map((e) => ({
            antecedents: e.antecedents,
            consequents: e.consequents,
            confidence: e.confidenceSum / e.count,
            monthsWithFlood: e.monthsWithFlood,
      }));
      merged.sort((a, b) => b.confidence - a.confidence);
      if (merged.length > 8) {
        const filtered = merged.filter((m) => m.monthsWithFlood > 0);
        merged = filtered.length > 0 ? filtered : merged.slice(0, 8);
      }
      return merged;
    }, [rulesArray, selectedProvince, selectedMonth]);
  const historicalAvgByField = useMemo(() => {
      const fields = ["search_flood", "search_rain", "search_storm", "search_water_level", "search_water_situation", "search_evacuate"];
      const sums = {};
      const counts = {};
      fields.forEach((f) => {
          sums[f] = 0;
          counts[f] = 0;
      });
      data.forEach((row) => {
          if (row.province === selectedProvince && parseInt(row.month) === parseInt(selectedMonth) && RULE_BASE_YEARS.includes(parseInt(row.year))) {
            fields.forEach((f) => {
                sums[f] += Number(row[f]) || 0;
                counts[f] += 1;
            });
          }
      });
      const avg = {};
      fields.forEach((f) => {
          avg[f] = counts[f] > 0 ? sums[f] / counts[f] : 0;
      });
      return avg;
    }, [data, selectedProvince, selectedMonth]);
  // กรองเฉพาะกฎที่เข้าเงื่อนไขสำหรับปีพยากรณ์
  const forecastRules = useMemo(() => {
      if (!isForecastYear || !monthRow) return [];
      return historicalMonthRules
      .map((rule) => {
          const checks = rule.antecedents.map((ant) => {
              if (ant === "Rain_Heavy") {
                return { label: translateWord(ant), met: isHeavyRainActual };
              }
              const field = antecedentToField[ant];
              if (!field) return { label: translateWord(ant), met: null };
              const currentVal = Number(monthRow[field]) || 0;
              const histAvg = historicalAvgByField[field] || 0;
              return { label: translateWord(ant), met: currentVal >= histAvg };
          });
          const metCount = checks.filter((c) => c.met === true).length;
          return { ...rule, checks, metCount, totalConditions: checks.length };
      })
      .filter((rule) => rule.metCount > 0); // แสดงเฉพาะกฎที่เข้าเงื่อนไข
    }, [isForecastYear, monthRow, historicalMonthRules, isHeavyRainActual, historicalAvgByField]);
  // คำนวณความเชื่อมั่นเฉลี่ยเฉพาะกฎที่พบจริง
  const avgConfidencePct = useMemo(() => {
      const source = isForecastYear ? forecastRules : currentRules;
      if (!source || source.length === 0) return null;
      const sum = source.reduce((acc, r) => acc + (r.confidence || 0), 0);
      return Math.round((sum / source.length) * 100);
    }, [currentRules, forecastRules, isForecastYear]);
  const graphData = useMemo(() => {
      const rulesForGraph = isForecastYear ? forecastRules : currentRules;
      const nodesMap = new Map();
      const links = [];
      const maxRules = Math.min(rulesForGraph.length, 15);
      for (let i = 0; i < maxRules; i++) {
        const rule = rulesForGraph[i];
        asArray(rule.antecedents).forEach((antRaw) => {
            const antLabel = translateWord(antRaw);
            if (!nodesMap.has(antLabel)) nodesMap.set(antLabel, { id: antLabel, group: "cause", val: 3 });
            asArray(rule.consequents).forEach((conRaw) => {
                const conLabel = translateWord(conRaw);
                if (!nodesMap.has(conLabel)) nodesMap.set(conLabel, { id: conLabel, group: "effect", val: 3 });
                links.push({ source: antLabel, target: conLabel });
            });
        });
      }
      return { nodes: Array.from(nodesMap.values()), links };
    }, [currentRules, forecastRules, isForecastYear]);
  // เหตุการณ์จริงทั้งหมดในเดือนนี้ (มีแถว = เกิดจริง)
  const realEvents = useMemo(() => {
      const years = isForecastYear ? REAL_DATA_YEARS : [parseInt(selectedYear)];
      const list = [];
      years.forEach((y) => {
          getFloodEvents(data, selectedProvince, y, selectedMonth).forEach((e) => list.push(e));
      });
      return list.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    }, [data, selectedProvince, selectedMonth, selectedYear, isForecastYear]);
  const hasRealEvent = realEvents.length > 0;
  // เดือนที่เลือกเกิดอุทกภัยจริงหรือไม่
  const matchedRealEvent = useMemo(() => {
      if (isForecastYear) return false;
      return didFloodHappen(data, selectedProvince, selectedYear, selectedMonth);
    }, [data, selectedProvince, selectedYear, selectedMonth, isForecastYear]);
  // ผลพยากรณ์ของเดือนที่เลือก
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
  function getYearRuleConfidencePct(year) {
    const rulesOfYear = rulesArray.filter(
      (r) =>
      r.province === selectedProvince &&
      parseInt(r.year) === year &&
      parseInt(r.month) === parseInt(selectedMonth)
    );
    if (rulesOfYear.length === 0) return null;
    const sum = rulesOfYear.reduce((acc, r) => acc + (r.confidence || 0), 0);
    return Math.round((sum / rulesOfYear.length) * 100);
  }
  const lineChartData = useMemo(() => {
      const yearsSequence = ALL_YEARS;
      return yearsSequence.map((y) => {
          const isForecast = !REAL_DATA_YEARS.includes(y);
          const row = getMonthRow(data, selectedProvince, y, selectedMonth);
          const result = predictFlood(data, selectedProvince, y, selectedMonth);
          const chancePct = Math.round(result.chance * 100);

          return {
            ปี: `พ.ศ. ${y + 543}`,
            // ปีที่ไม่มีข้อมูลฝนให้เป็น null กราฟจะเว้นช่วง ไม่ใช่ลากลงศูนย์
            ปริมาณฝน: row ? Math.round(parseFloat(row.average_rain) || 0) : null,
            // แยกสองเส้นตามชนิดข้อมูล เพื่อไม่ให้ข้อเท็จจริงกับค่าประเมินปนกัน
            // ปีรอยต่อ (2567) ใส่ค่าทั้งสองเส้น เส้นประจะได้ต่อจากเส้นทึบไม่ขาด
            สถิติจริง: isForecast ? null : chancePct,
            ค่าประเมิน: isForecast || y === LAST_REAL_YEAR ? chancePct : null,
            วิธี: result.label,
            isForecast,
          };
      });
    }, [selectedProvince, selectedMonth, data]);


    // ── เพิ่มใหม่ต่อจาก lineChartData ──
// ใช้เมื่อเลือกปีที่มีข้อมูลจริง (ไม่ใช่ปีพยากรณ์)
// แสดง ±3 เดือนรอบเดือนที่เลือก
const monthWindowData = useMemo(() => {
  if (isForecastYear) return [];

  const result = [];

  // สร้างช่วงเดือน: เดือนที่เลือก -3 ถึง +3
  for (let offset = -3; offset <= 3; offset++) {
    let m = selectedMonth + offset;
    let y = parseInt(selectedYear);

    // ปรับปีถ้าเดือนเกินขอบเขต 1-12
    if (m < 1) {
      m = m + 12;
      y = y - 1;
    }
    if (m > 12) {
      m = m - 12;
      y = y + 1;
    }

    // รวมทุกเหตุการณ์ในเดือนนั้น ไม่ใช่แค่แถวแรก
    const events = getFloodEvents(data, selectedProvince, y, m);
    const occurred = events.length > 0;
    let affected = 0;
    events.forEach((e) => {
      affected += parseInt(e.affected_people) || 0;
    });

    // โอกาสเกิดอุทกภัยของเดือนนั้น จากตรรกะเดียวกับกราฟรายปี
    const monthResult = predictFlood(data, selectedProvince, y, m);

    result.push({
      label: `${shortMonthNames[m]} ${String(y + 543).slice(-2)}`,
      month: m,
      year: y,
      ผู้ได้รับผลกระทบ: affected,
      โอกาสเกิดอุทกภัย: Math.round(monthResult.chance * 100),
      occurred,
      isSelected: offset === 0,  // เดือนที่เลือกจะ highlight
    });
  }

  return result;
}, [isForecastYear, selectedMonth, selectedYear, selectedProvince, data, rulesArray]);

  const monthOptions = Object.keys(thaiMonthNames).map((m) => parseInt(m));
  if (!isClient) {
    return (
      <div className="min-h-[400px] bg-transparent rounded-2xl animate-pulse flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-sky-700/20 border-t-sky-700 rounded-full animate-spin"></div>
      <div className="text-sky-600 font-bold uppercase tracking-widest text-sm">กำลังโหลดข้อมูล...</div>
    </div>
    );
  }
  return (
    <div className="space-y-6">

    {/* ── ตัวกรองข้อมูล ── */}
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
                {regionOrder
                  .filter((region) => filteredProvinces.some((p) => p.region === region))
                  .map((region) => (
                    <optgroup key={region} label={region}>
                      {filteredProvinces
                        .filter((p) => p.region === region)
                        .map((opt) => (
                          <option key={opt.name} value={opt.name}>
                            {opt.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
              </select>
              <div className="pointer-events-none text-slate-400 ml-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
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
                {allYears.map((year) => (
                  <option key={year} value={year}>
                    พ.ศ. {year + 543}
                    {!REAL_DATA_YEARS.includes(year) ? " (ประเมิน)" : ""}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none text-slate-400 ml-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
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
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {thaiMonthNames[m]}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none text-slate-400 ml-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
              </div>
            </div>
          </div>

        </div>

        {searchQuery !== "" && (
          <p className="text-[11px] font-bold text-slate-400 mt-3 pl-2">
            {filteredProvinces.length > 0
              ? `พบ ${filteredProvinces.length} จังหวัด`
              : `ไม่พบจังหวัดที่ตรงกับ "${searchQuery}"`}
          </p>
        )}
      </div>

      {isForecastYear && (
        <div className="px-5 pb-4 -mt-1 space-y-2">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold">
            <AutoGraphIcon fontSize="small" />
            ปีนี้ยังไม่มีสถิติอุทกภัยยืนยัน — ประเมินจากฐานข้อมูลปี {REAL_DATA_YEARS[0] + 543}–{LAST_REAL_YEAR + 543} โดยวิธี: {prediction.label}
          </div>
          {prediction.note && (
            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-[11px] font-bold">
              หมายเหตุ: {prediction.note}
            </div>
          )}
        </div>
      )}
    </div>

    {/* ── การ์ดสรุป 2 ใบ ── */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div className={`p-6 rounded-[2rem] border-2 shadow-sm ${
      prediction.willFlood ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200"
    }`}>
    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
    {isForecastYear ? "โอกาสเกิดอุทกภัย (ประเมิน)" : "สถานะอุทกภัย (สถิติจริง)"}
  </p>
    <div className="flex items-baseline gap-1">
    {isForecastYear ? (
        <>
        <span className={`text-4xl font-black ${prediction.willFlood ? "text-orange-600" : "text-emerald-600"}`}>
        {Math.round(prediction.chance * 100)}
      </span>
        <span className={`text-sm font-bold opacity-70 ${prediction.willFlood ? "text-orange-600" : "text-emerald-600"}`}>
        %
      </span>
      </>
    ) : (
        <span className={`text-3xl font-black ${matchedRealEvent ? "text-orange-600" : "text-emerald-600"}`}>
        {matchedRealEvent ? "เกิดอุทกภัย" : "ไม่เกิดอุทกภัย"}
      </span>
    )}
  </div>
    <p className="text-[11px] text-slate-500 font-bold mt-1">
    {isForecastYear
      ? prediction.neighbors.length > 0
      ? `ใกล้เคียงกับ พ.ศ. ${prediction.neighbors[0].year + 543} มากที่สุด (${Math.round(prediction.neighbors[0].score * 100)}%)`
      : `เดือนนี้เคยเกิดอุทกภัย ${floodHistory.count} จาก ${floodHistory.total} ปี`
      : `${realEvents.length} เหตุการณ์ · เดือนนี้เคยเกิด ${floodHistory.count} จาก ${floodHistory.total} ปี`}
  </p>
  </div>
    <div className="p-6 rounded-[2rem] border-2 bg-purple-50 border-purple-200 shadow-sm">
    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
    ปริมาณน้ำฝนประจำเดือน
  </p>
    <div className="flex items-baseline gap-1">
    {monthRow ? (
        <>
        <span className="text-4xl font-black text-purple-600">{avgRain}</span>
        <span className="text-sm font-bold opacity-70 text-purple-600">มม.</span>
      </>
    ) : (
        <span className="text-2xl font-black text-slate-400">ไม่มีข้อมูล</span>
    )}
  </div>
    <p className="text-[11px] text-slate-400/70 font-bold mt-1">
    {monthRow ? rainVsBaselineLabel : `ยังไม่มีข้อมูลฝนของเดือนนี้ · ${rainVsBaselineLabel}`}
  </p>
  </div>
  </div>

   {/* ── กล่องแนวโน้มความเสี่ยงอุทกภัย ── */}
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
        {selectedProvince} ·{" "}
        {isForecastYear
          ? `เดือน${thaiMonthNames[selectedMonth]} ปี ${REAL_DATA_YEARS[0] + 543}–${LAST_SELECTABLE_YEAR + 543}`
          : `${thaiMonthNames[selectedMonth]} ±3 เดือน · พ.ศ. ${parseInt(selectedYear) + 543}`}
      </p>
    </div>
  </div>

  <div className="p-6">

    {/* ── MODE 1: ปีพยากรณ์ → แสดงรายปี (เหมือนเดิม) ── */}
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
            formatter={(value, name) => {
              if (name === "สถิติจริง") {
                return [value === 100 ? "เกิดอุทกภัย" : "ไม่เกิดอุทกภัย", "สถิติจริง"];
              }
              if (name === "ค่าประเมิน") {
                return [`${value}%`, "โอกาสเกิดอุทกภัย (ประเมิน)"];
              }
              if (name === "ปริมาณฝน") {
                return value === null ? ["ไม่มีข้อมูล", "ปริมาณฝน"] : [`${value} มม.`, "ปริมาณฝน"];
              }
              return [value, name];
            }}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return `${label} · ${payload[0].payload.วิธี}`;
              }
              return label;
            }}
          />

          {/* แรเงาพื้นหลังช่วงที่เป็นค่าประเมิน ให้แยกออกจากช่วงสถิติจริงชัดเจน */}
          <ReferenceArea
            yAxisId="chance"
            x1={`พ.ศ. ${LAST_REAL_YEAR + 543}`}
            x2={`พ.ศ. ${LAST_SELECTABLE_YEAR + 543}`}
            fill="#8b5cf6"
            fillOpacity={0.07}
            label={{ value: "ช่วงประเมิน", position: "insideTop", fontSize: 10, fill: "#8b5cf6" }}
          />

          {/* เส้น 50% = เกณฑ์ตัดสินว่าเกิดหรือไม่เกิด */}
          <ReferenceLine
            yAxisId="chance"
            y={50}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: "เกณฑ์ 50%", position: "right", fontSize: 10, fill: "#94a3b8" }}
          />

          {/* เส้นทึบ: ข้อเท็จจริงจากสถิติ มีแค่ 0% กับ 100% */}
          <Line
            yAxisId="chance"
            type="monotone"
            dataKey="สถิติจริง"
            stroke="#f97316"
            strokeWidth={2.5}
            connectNulls={false}
            dot={(props) => {
              const { cx, cy, value } = props;
              if (value === null) return null;
              return (
                <circle
                  key={`r-${cx}`}
                  cx={cx} cy={cy} r={6}
                  fill={value >= 50 ? "#ef4444" : "#94a3b8"}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }}
          />

          {/* เส้นประ: ค่าประเมิน จุดกลวงเพื่อบอกว่าไม่ใช่ข้อเท็จจริง */}
          <Line
            yAxisId="chance"
            type="monotone"
            dataKey="ค่าประเมิน"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            strokeDasharray="7 4"
            connectNulls={true}
            dot={(props) => {
              const { cx, cy, payload, value } = props;
              if (value === null || !payload.isForecast) return null;
              return (
                <circle
                  key={`f-${cx}`}
                  cx={cx} cy={cy} r={6}
                  fill="#fff"
                  stroke={value >= 50 ? "#ef4444" : "#94a3b8"}
                  strokeWidth={3}
                />
              );
            }}
          />

          {/* เส้นแบ่งช่วงที่มีสถิติจริง กับช่วงที่ประเมิน */}
          <ReferenceLine
            yAxisId="chance"
            x={`พ.ศ. ${LAST_REAL_YEAR + 1 + 543}`}
            stroke="#8b5cf6"
            strokeDasharray="4 2"
            strokeOpacity={0.5}
            label={{ value: "เริ่มประเมิน", position: "top", fontSize: 10, fill: "#8b5cf6" }}
          />

        </LineChart>
      </ResponsiveContainer>
    )}

    {/* ── MODE 2: ปีจริง → แสดง ±3 เดือนรอบเดือนที่เลือก ── */}
    {!isForecastYear && (
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={monthWindowData}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

          <XAxis
            dataKey="label"
            tick={(props) => {
              const { x, y, payload } = props;
              // เดือนที่เลือก = ตัวหนาสีเข้ม
              const isSelected = monthWindowData.find(
                (d) => d.label === payload.value && d.isSelected
              );

              return (
                <text
                  x={x} y={y + 12}
                  textAnchor="middle"
                  fill={isSelected ? "#ef4444" : "#475569"}
                  fontWeight={isSelected ? 900 : 600}
                  fontSize={isSelected ? 13 : 11}
                >
                  {payload.value}
                </text>
              );
            }}
          />

          <YAxis
            yAxisId="chance"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
          />

          <Tooltip
            formatter={(value, name) => {
              if (name === "โอกาสเกิดอุทกภัย") {
                return [`${value}%`, "โอกาสเกิดอุทกภัย"];
              }
              if (name === "ผู้ได้รับผลกระทบ") {
                return [`${value.toLocaleString()} คน`, "ผู้ได้รับผลกระทบ"];
              }
              return [value, name];
            }}
          />

          {/* เส้น 50% = เกณฑ์ตัดสิน */}
          <ReferenceLine
            yAxisId="chance"
            y={50}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            label={{ value: "เกณฑ์ 50%", position: "right", fontSize: 10, fill: "#94a3b8" }}
          />

          {/* เส้นเดียว: โอกาสเกิดอุทกภัยรายเดือน */}
          <Line
            yAxisId="chance"
            type="monotone"
            dataKey="โอกาสเกิดอุทกภัย"
            stroke="#f97316"
            strokeWidth={2.5}
            connectNulls={true}
            dot={(props) => {
              const { cx, cy, payload, value } = props;

              if (payload.isSelected) {
                // เดือนที่เลือก → จุดใหญ่เด่น
                return (
                  <g key={`s-${cx}`}>
                    <circle cx={cx} cy={cy} r={14} fill="#ef4444" fillOpacity={0.15} />
                    <circle
                      cx={cx} cy={cy} r={8}
                      fill={value >= 50 ? "#ef4444" : "#94a3b8"}
                      stroke="#fff"
                      strokeWidth={3}
                    />
                  </g>
                );
              }

              // เดือนอื่น → จุดเล็กกว่า
              return (
                <circle
                  key={`d-${cx}`}
                  cx={cx} cy={cy} r={5}
                  fill={value >= 50 ? "#ef4444" : "#cbd5e1"}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }}
          />

          {/* เส้นแนวตั้ง highlight เดือนที่เลือก */}
          {monthWindowData.find((d) => d.isSelected) && (
            <ReferenceLine
              yAxisId="chance"
              x={monthWindowData.find((d) => d.isSelected).label}
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

    {/* คำอธิบาย legend */}
    <div className="flex flex-wrap items-center gap-5 mt-4 justify-center">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
        <span className="text-xs font-bold text-slate-500">ตั้งแต่ 50% ขึ้นไป · เกิดอุทกภัย</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
        <span className="text-xs font-bold text-slate-500">ต่ำกว่า 50% · ไม่เกิดอุทกภัย</span>
      </div>
      {isForecastYear ? (
        <>
          <div className="flex items-center gap-2">
            <span className="w-5 inline-block" style={{ borderTop: "2.5px solid #f97316", height: "1px" }} />
            <span className="text-xs font-bold text-slate-500">สถิติจริง · จุดทึบ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 inline-block" style={{ borderTop: "2.5px dashed #8b5cf6", height: "1px" }} />
            <span className="text-xs font-bold text-purple-600">ค่าประเมิน · จุดกลวง</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <span className="w-5 inline-block" style={{ borderTop: "2px solid #f97316", height: "1px" }} />
            <span className="text-xs font-bold text-slate-500">โอกาสเกิดอุทกภัย (%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-400 border-2 border-white shadow inline-block" />
            <span className="text-xs font-bold text-red-600">เดือนที่เลือก (เด่นชัด)</span>
          </div>
        </>
      )}
    </div>

    {/* อธิบายวิธีอ่านกราฟ */}
    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
      <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
        {isForecastYear
          ? `กราฟนี้ดูเดือน${thaiMonthNames[selectedMonth]} เดือนเดียว แต่เทียบข้ามปี · เส้นทึบสีส้มคือสถิติจริงปี ${REAL_DATA_YEARS[0] + 543}-${LAST_REAL_YEAR + 543} ค่าจึงเป็น 100% (เกิดอุทกภัย) หรือ 0% (ไม่เกิด) เท่านั้น · เส้นประสีม่วงในพื้นที่แรเงาคือค่าประเมินปี ${LAST_REAL_YEAR + 1 + 543}-${LAST_SELECTABLE_YEAR + 543} จุดกลวงหมายถึงยังไม่ใช่ข้อเท็จจริง · ค่าประเมินคำนวณจากสถิติ 5 ปีที่อยู่ทางซ้ายของกราฟ จึงตรวจสอบที่มาได้เอง`
          : `กราฟนี้ดูปี ${parseInt(selectedYear) + 543} ปีเดียว แต่เทียบข้ามเดือน · แสดง 3 เดือนก่อนและหลังเดือน${thaiMonthNames[selectedMonth]} เพื่อให้เห็นว่าเดือนที่เลือกอยู่ตรงไหนของฤดูน้ำหลาก · จุดสีแดงคือเดือนที่เกิดอุทกภัยจริง`}
      </p>
    </div>

    {/* สรุปใต้กราฟ */}
    <p className="text-sm text-slate-600 mt-4 text-center">
      {isForecastYear
        ? `เทียบข้ามปี · เดือน${thaiMonthNames[selectedMonth]} ที่ ${selectedProvince} ตั้งแต่ พ.ศ. ${REAL_DATA_YEARS[0] + 543} ถึง ${LAST_SELECTABLE_YEAR + 543}`
        : `เทียบข้ามเดือน · ${selectedProvince} ช่วง ±3 เดือนรอบ${thaiMonthNames[selectedMonth]} พ.ศ. ${parseInt(selectedYear) + 543}`}
    </p>

  </div>
</div>
    {/* ── ส่วนแสดงผลการวิเคราะห์เปรียบเทียบ (2 คอลัมน์) ── */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
    {/* คอลัมน์ซ้าย: พฤติกรรมการค้นหา */}
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
    <div className="p-2 rounded-lg bg-sky-700 shadow-sm text-white flex">
    <HubIcon fontSize="small" />
  </div>
    <div>
    <h3 className="text-slate-800 font-bold tracking-tight leading-none text-base">
    พฤติกรรมการค้นหา เทียบกับสถานการณ์จริง
  </h3>
    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
    {selectedProvince} · {thaiMonthNames[selectedMonth]} {parseInt(selectedYear) + 543}
  </p>
  </div>
  </div>
    {graphData.nodes.length > 0 && (
        <div className="border-b border-slate-100">
        <ForceGraph2D
        graphData={graphData}
        height={260}
        nodeLabel="id"
        nodeAutoColorBy="group"
        linkDirectionalArrowLength={5}
        linkDirectionalArrowRelPos={1}
        nodeCanvasObject={nodeCanvasObject}
        />
      </div>
    )}

    <div className="flex-1 overflow-y-auto max-h-[350px]">
    {!isForecastYear ? (
        currentRules.length > 0 ? (
          <div className="divide-y divide-slate-100">
          {currentRules.map((rule, i) => {
                const antecedentLabels = asArray(rule.antecedents).map(translateWord);
                return (
                  <div key={i} className="flex flex-col gap-3 p-5">
                  <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">คำค้นหาที่พบ</span>
                  <div className="flex flex-wrap gap-2">
                  {antecedentLabels.map((label, idx) => (
                        <span key={idx} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-xl text-xs font-bold border border-orange-100">
                        {label}
                      </span>
                  ))}
                </div>
                </div>
                  <div className="flex items-center gap-2">
                  <ArrowBackIcon className="text-slate-300 rotate-[-90deg]" fontSize="small" />
                  <div className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    isHeavyRainActual ? "bg-sky-50 border-sky-200 text-sky-700" : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}>
                  <WaterDropIcon fontSize="small" />
                  {baseline.value == null
                    ? `ฝน ${avgRain} มม. (ไม่มีค่าปกติเทียบ)`
                    : isHeavyRainActual
                    ? `ฝนสูงกว่าปกติ ${rainPercentDiff}% (${avgRain} มม.)`
                    : `ฝนไม่เกินค่าปกติ (${avgRain} จาก ${baseline.value} มม.)`}
                </div>
                  <span className="text-xs font-bold text-green-600 ml-auto shrink-0">
                  {Math.round((rule.confidence || 0) * 100)}%
                </span>
                </div>
                </div>
                );
          })}
        </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
          <HubIcon className="text-slate-200" sx={{ fontSize: 40 }} />
          <p className="text-slate-500 font-bold text-sm">ไม่พบรูปแบบความสัมพันธ์ของคำค้นหาในเดือนนี้</p>
        </div>
        )
      ) : forecastRules.length > 0 ? (
        <div className="divide-y divide-slate-100">
        {forecastRules.map((rule, i) => (
              <div key={i} className="flex flex-col gap-3 p-5">
              <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">คำค้นหาที่ผ่านเกณฑ์</span>
              <div className="flex flex-wrap gap-2">
              {rule.checks.map((c, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-orange-50 text-orange-700 border-orange-200">
                    {c.label} ✓
                  </span>
              ))}
            </div>
            </div>
              <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
              เข้าเงื่อนไข {rule.metCount}/{rule.totalConditions}
            </span>
              <div className="px-3 py-2 rounded-xl border text-xs font-bold ml-auto bg-amber-50 border-amber-200 text-amber-600">
              ตรงกับรูปแบบความเสี่ยง
            </div>
            </div>
            </div>
        ))}
      </div>
      ) : (
        <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
        <TimelineIcon className="text-slate-200" sx={{ fontSize: 40 }} />
        <p className="text-slate-500 font-bold text-sm">ไม่พบรูปแบบการค้นหาที่เข้าเงื่อนไขความเสี่ยงในปีนี้</p>
      </div>
    )}
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
    {/* สถิติตารางวันที่เกิดขึ้นจริง */}
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
        {realEvents.map((e, idx) => (
              <tr key={idx} className="hover:bg-[#fff9d4]/50 transition-colors">
              <td className="px-4 py-3 font-bold text-slate-800 text-[13px]">
              {e.date ? formatThaiDate(e.date) : `${thaiMonthNames[selectedMonth]} ${parseInt(e.year) + 543}`}
            </td>
              <td className="px-4 py-3 text-center font-bold text-sky-700 text-[13px]">
              {parseInt(e.affected_people) > 0 ? parseInt(e.affected_people).toLocaleString() : "ไม่มีบันทึก"}
            </td>
              <td className="px-4 py-3 text-center font-bold text-slate-400 text-[13px]">
              {parseInt(e.fatalities) > 0 ? parseInt(e.fatalities).toLocaleString() : "-"}
            </td>
            </tr>
        ))}
      </tbody>
      </table>
      </div>
      ) : (
        <div className="p-8 flex flex-col items-center justify-center gap-3 bg-white h-full text-center">
        <div className="p-4 bg-slate-100 rounded-full border border-slate-200 text-slate-400">
        <WaterDropIcon fontSize="large" />
      </div>
        <p className="text-slate-500 font-bold text-sm">
        {isForecastYear
          ? "ไม่พบสถิติรายงานอุทกภัยในอดีตสำหรับเดือนนี้"
          : `ไม่มีรายงานเหตุอุทกภัยจริงในเดือน${thaiMonthNames[selectedMonth]} พ.ศ. ${parseInt(selectedYear) + 543}`}
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
    {!isForecastYear ? (
        matchedRealEvent ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
          <VerifiedIcon className="text-red-500 shrink-0 mt-0.5" fontSize="small" />
          <span>
          เกิดอุทกภัยจริงในเดือน{thaiMonthNames[selectedMonth]} พ.ศ. {parseInt(selectedYear) + 543} รวม {realEvents.length} เหตุการณ์ · เดือนนี้เคยเกิดอุทกภัย {floodHistory.count} จาก {floodHistory.total} ปี
        </span>
        </div>
        ) : (
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 flex items-start gap-2">
          <ReportIcon className="text-slate-400 shrink-0 mt-0.5" fontSize="small" />
          <span>
          ไม่มีรายงานอุทกภัยในเดือน{thaiMonthNames[selectedMonth]} พ.ศ. {parseInt(selectedYear) + 543} · เดือนนี้เคยเกิดอุทกภัย {floodHistory.count} จาก {floodHistory.total} ปี
        </span>
        </div>
        )
      ) : prediction.willFlood ? (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 flex items-start gap-2">
        <AutoGraphIcon className="text-orange-600 shrink-0 mt-0.5" fontSize="small" />
        <span>
        ประเมิน พ.ศ. {parseInt(selectedYear) + 543}: มีโอกาสเกิดอุทกภัย {Math.round(prediction.chance * 100)}% · {prediction.label}
        {prediction.neighbors.length > 0 && ` · ใกล้เคียงกับ พ.ศ. ${prediction.neighbors[0].year + 543} มากที่สุด`}
      </span>
      </div>
      ) : (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
        <VerifiedIcon className="text-emerald-600 shrink-0 mt-0.5" fontSize="small" />
        <span>
        ประเมิน พ.ศ. {parseInt(selectedYear) + 543}: มีโอกาสเกิดอุทกภัย {Math.round(prediction.chance * 100)}% · {prediction.label}
        {prediction.neighbors.length > 0 && ` · ใกล้เคียงกับ พ.ศ. ${prediction.neighbors[0].year + 543} มากที่สุด`}
      </span>
      </div>
    )}
  </div>
  </div>
  </div>
  </div>
  </div>
  );
}