"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";
import TuneIcon from "@mui/icons-material/Tune";
import SearchIcon from "@mui/icons-material/Search";
import HubIcon from "@mui/icons-material/Hub";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ReportIcon from "@mui/icons-material/Report";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import TimelineIcon from "@mui/icons-material/Timeline";

import PlaceIcon from "@mui/icons-material/Place";
import { provinceRegions, regionOrder } from "@/lib/constants/provinces";
import { groupReportedAreas } from "@/lib/flood-areas";
import { classifyFloodRisk, isHighFloodRisk } from "@/lib/rainlevel";
const REAL_DATA_YEARS = [2020, 2021, 2022, 2023, 2024];
const LAST_REAL_YEAR = REAL_DATA_YEARS[REAL_DATA_YEARS.length - 1];

const METHOD_MODEL = "model";

const ASSESSMENT_HISTORICAL_ONLY = "historical_only";

const SEARCH_FIELDS = [
  "search_flood", "search_rain", "search_storm",
  "search_water_level", "search_water_situation", "search_evacuate",
];

const SEARCH_LABELS = {
  search_flood: "น้ำท่วม", search_rain: "ฝนตกหนัก", search_storm: "พายุเข้าไทย",
  search_water_level: "ระดับน้ำ", search_water_situation: "สถานการณ์น้ำ",
  search_evacuate: "อพยพ",
};

function hasAllSearchData(row) {
  for (let i = 0; i < SEARCH_FIELDS.length; i++) {
    if (row[SEARCH_FIELDS[i]] == null) return false;
  }
  return true;
}

function getAllYears(lastSelectableYear) {
  const years = [];
  for (let year = REAL_DATA_YEARS[0]; year <= lastSelectableYear; year++) years.push(year);
  return years;
}

function getFloodEvents(data, province, year, month) {
  const events = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row.province === province && parseInt(row.year) === parseInt(year) &&
        parseInt(row.month) === parseInt(month) && row.date) events.push(row);
  }
  return events;
}

function didFloodHappen(data, province, year, month) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row.province === province && parseInt(row.year) === parseInt(year) &&
        parseInt(row.month) === parseInt(month) && row.date) return true;
  }
  return false;
}

function countFloodYears(data, province, month) {
  const years = [];
  for (let i = 0; i < REAL_DATA_YEARS.length; i++) {
    const year = REAL_DATA_YEARS[i];
    if (didFloodHappen(data, province, year, month)) years.push(year);
  }
  return {
    years: years, count: years.length,
    total: REAL_DATA_YEARS.length,
    rate: years.length / REAL_DATA_YEARS.length,
  };
}

function getMonthRow(data, province, year, month) {
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row.province === province && parseInt(row.year) === parseInt(year) &&
        parseInt(row.month) === parseInt(month)) return row;
  }
  return null;
}

// ใช้เกณฑ์เดียวกับการจับคู่กฎความสัมพันธ์ คือค่าดัชนีตั้งแต่ 1 ขึ้นไปถือว่าเดือนนั้นมีการค้นหาคำนั้น
function getSearchActivityDetail(data, province, year, month) {
  const currentRow = getMonthRow(data, province, year, month);
  if (!currentRow)
    return null;

  if (!hasAllSearchData(currentRow))
    return null;

  const foundFields = [];
  for (let i = 0; i < SEARCH_FIELDS.length; i++) {
    const field = SEARCH_FIELDS[i];
    if (Number(currentRow[field]) >= SEARCH_INDEX_MIN) {
      foundFields.push(field);
    }
  }

  return { foundFields: foundFields, hasSearchActivity: foundFields.length > 0 };
}

function getHistoricalLevel(floodCount) {
  if (floodCount == null) return null;
  if (floodCount <= 1) return "low";
  if (floodCount <= 3) return "medium";
  return "high";
}

function getMonitoringLevel(floodCount, hasSearchActivity) {
  if (floodCount == null) return null;
  if (floodCount === 0) return "low";
  if (floodCount === 1) {
    if (hasSearchActivity) return "medium";
    return "low";
  }
  if (floodCount === 2 || floodCount === 3) {
    if (hasSearchActivity) return "high";
    return "medium";
  }
  return "high";
}

function isMonitoringRequired(level) {
  return level === "medium" || level === "high";
}


const RISK_LEVELS = [
  { key: "low", label: "สถานการณ์ปกติ",
    advice: { title: "ติดตามสถานการณ์ตามปกติ", bullets: ["ตรวจสอบพยากรณ์อากาศเป็นระยะ","ติดตามข่าวสารจากหน่วยงานในพื้นที่","ยังไม่จำเป็นต้องเตรียมการเป็นพิเศษ"] },
    tw: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", badge: "bg-green-100 text-green-700" } },
  { key: "medium", label: "เฝ้าระวังปานกลาง",
    advice: { title: "รับมืออุทกภัย", bullets: ["ติดตามพยากรณ์อากาศและประกาศเตือนภัย พร้อมปฏิบัติตามอย่างเคร่งครัด","จัดเตรียมสิ่งของเครื่องใช้ที่จำเป็นไว้ใช้เมื่อเกิดภัย (ถุงยังชีพ)","จัดสภาพแวดล้อมให้ปลอดภัยจากน้ำท่วม","หมั่นสังเกตสัญญาณความผิดปกติทางธรรมชาติ"] },
    tw: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" } },
  { key: "high", label: "เฝ้าระวังสูง",
    advice: { title: "ปฏิบัติตนปลอดภัย", bullets: ["ติดตามพยากรณ์อากาศและประกาศเตือนภัย พร้อมปฏิบัติตามอย่างเคร่งครัด","ขนย้ายสิ่งของเครื่องใช้ขึ้นที่สูง","ตัดกระแสไฟฟ้าและงดใช้เครื่องใช้ไฟฟ้าเมื่อน้ำท่วมบ้าน","ระมัดระวังภัยในช่วงน้ำท่วม อาทิ จมน้ำ สัตว์มีพิษ ไฟฟ้าดูด","หากสถานการณ์รุนแรง ให้อพยพไปตามเส้นทางที่ปลอดภัย"],
   } },
];

function getMonitoringLevelInfo(key) {
  if (key == null) return null;
  for (let i = 0; i < RISK_LEVELS.length; i++) {
    if (RISK_LEVELS[i].key === key) return RISK_LEVELS[i];
  }
  return null;
}

function predictFlood(data, province, year, month) {
  const selectedYear = parseInt(year);
  const selectedMonth = parseInt(month);
  const history = countFloodYears(data, province, selectedMonth);

  if (REAL_DATA_YEARS.includes(selectedYear)) {
    const events = getFloodEvents(data, province, selectedYear, selectedMonth);
    const occurred = events.length > 0;
    let score = 0;
    if (occurred) score = 1;
    return {
      method: "confirmed", label: "สถิติที่เกิดขึ้นจริง",
      score: score, occurred: occurred,
      requiresMonitoring: occurred, history: history, note: "",
    };
  }

  const activity = getSearchActivityDetail(data, province, selectedYear, selectedMonth);

  if (activity === null) {
    const historicalLevel = getHistoricalLevel(history.count);
    return {
      method: "climatology", label: "ระดับจากประวัติย้อนหลัง",
      assessmentType: ASSESSMENT_HISTORICAL_ONLY,
      historicalLevel: historicalLevel, monitoringLevel: null,
      requiresMonitoring: isMonitoringRequired(historicalLevel),
      history: history,
    };
  }

  const monitoringLevel = getMonitoringLevel(history.count, activity.hasSearchActivity);
  return {
    method: METHOD_MODEL, label: "ระดับการเฝ้าระวังสำหรับเดือน",
    assessmentType: "historical_plus_search",
    historicalLevel: null, monitoringLevel: monitoringLevel,
    requiresMonitoring: isMonitoringRequired(monitoringLevel),
    history: history,
  };
}

const FloodAreaMapView = dynamic(() => import("@/components/FloodAreaMapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold">
      กำลังโหลดแผนที่...
    </div>
  ),
});

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] flex items-center justify-center">
      <CircularProgress />
    </div>
  ),
});

const thaiMonthNames = { 1: "มกราคม", 2: "กุมภาพันธ์", 3: "มีนาคม", 4: "เมษายน", 5: "พฤษภาคม", 6: "มิถุนายน", 7: "กรกฎาคม", 8: "สิงหาคม", 9: "กันยายน", 10: "ตุลาคม", 11: "พฤศจิกายน", 12: "ธันวาคม" };
const shortMonthNames = { 1: "ม.ค.", 2: "ก.พ.", 3: "มี.ค.", 4: "เม.ย.", 5: "พ.ค.", 6: "มิ.ย.", 7: "ก.ค.", 8: "ส.ค.", 9: "ก.ย.", 10: "ต.ค.", 11: "พ.ย.", 12: "ธ.ค." };

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
    rain_level_High: "ปริมาณฝนตั้งแต่ระดับปานกลางถึงสูง",
    search_rain: "ค้นหา 'ฝนตกหนัก'",
    search_flood: "ค้นหา 'น้ำท่วม'",
    search_storm: "ค้นหา 'พายุเข้าไทย'",
    search_evacuate: "ค้นหา 'อพยพ'",
    search_water_level: "ค้นหา 'ระดับน้ำ'",
    search_water_situation: "ค้นหา 'สถานการณ์น้ำ'",
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

// ใช้สร้างป้ายคำ (tag) หลายอัน เช่น คำค้นหาที่พบ หรือรูปแบบที่ตรงกับข้อมูลจริง
// colorClasses คือ class สี Tailwind เช่น "bg-orange-50 text-orange-700 border-orange-100"
function buildWordTagList(words, colorClasses) {
  const tags = [];
  for (let i = 0; i < words.length; i++) {
    tags.push(
      <span key={i} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${colorClasses}`}>
        {words[i]}
      </span>
    );
  }
  return tags;
}


function hasNodeWithGroupAndId(nodes, group, rawId) {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].group === group && nodes[i].rawId === rawId) return true;
  }
  return false;
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

const SEARCH_INDEX_MIN = 1;


function buildCurrentLevels(monthRow) {
  const levels = {};

  for (let i = 0; i < SEARCH_FIELDS.length; i++) {
    const field = SEARCH_FIELDS[i];

    if (!monthRow || monthRow[field] == null) {
      levels[field] = "NoData";
      continue;
    }

    const value = parseFloat(monthRow[field]);
    if (isNaN(value)) {
      levels[field] = "NoData";
      continue;
    }

    levels[field] = value >= SEARCH_INDEX_MIN ? "High" : "NotHigh";
  }

  if (monthRow && monthRow.average_rain != null) {
    levels.rain = isHighFloodRisk(monthRow.average_rain) ? "High" : "NotHigh";
  } else {
    levels.rain = "NoData";
  }

  return levels;
}

function getItemLevel(item, levels) {
  if (item === "rain_level_High") {
    return levels.rain;
  }
  return levels[item];
}


function checkRule(rule, levels) {
  const items = asArray(rule.antecedents).concat(asArray(rule.consequents));
  let hasNoData = false;

  for (let i = 0; i < items.length; i++) {
    const level = getItemLevel(items[i], levels);
    if (level === "NoData" || level === undefined) {
      hasNoData = true;
      continue;
    }
    if (level !== "High") return "NotMatched";
  }

  if (hasNoData) return "Undetermined";
  return "Matched";
}


function getRulesForProvinceMonth(rules, province, month) {
  const result = [];
  const targetMonth = parseInt(month);

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (rule.province === province && parseInt(rule.month) === targetMonth) {
      result.push(rule);
    }
  }

  return result;
}

function getMatchingRules(rules, levels) {
  const result = [];

  for (let i = 0; i < rules.length; i++) {
    if (checkRule(rules[i], levels) === "Matched") {
      result.push(rules[i]);
    }
  }

  result.sort((a, b) => (a.confidence || 0) - (b.confidence || 0));
  return result;
}

function filterRulesByConfidence(rules, threshold) {
  const result = [];
  for (let i = 0; i < rules.length; i++) {
    if ((rules[i].confidence || 0) >= threshold) {
      result.push(rules[i]);
    }
  }
  return result;
}

const EMPTY_BOUNDARIES = { searchEndYear: 0, searchEndMonth: 0, rainEndYear: 0, rainEndMonth: 0, lastSelectableYear: LAST_REAL_YEAR };

export default function FloodSearchPatterns({
  initialProvince = "ขอนแก่น",
  initialData = [],
  initialRules = [],
  initialFloodEvents = [],
  boundaries = EMPTY_BOUNDARIES,
}) {
  const [isClient, setIsClient] = useState(false);

  // แคชข้อมูลรายจังหวัดไว้ในฝั่ง client เพื่อไม่ต้องยิง API ซ้ำเมื่อสลับกลับไปจังหวัดที่เคยโหลดแล้ว
  // (เติมข้อมูลจังหวัดเริ่มต้นเข้าแคชใน useEffect ด้านล่าง ไม่อ่านค่า ref ระหว่าง render)
  const provinceCacheRef = useRef({});
  const [currentProvinceData, setCurrentProvinceData] = useState(() => ({
    data: initialData,
    rules: Array.isArray(initialRules) ? initialRules : [],
    floodEvents: Array.isArray(initialFloodEvents) ? initialFloodEvents : [],
  }));
  const [loadingProvinceData, setLoadingProvinceData] = useState(false);

  const data = currentProvinceData.data;
  const rulesArray = currentProvinceData.rules;
  const floodEvents = currentProvinceData.floodEvents;

  const baseYears = useMemo(() => getAllYears(boundaries.lastSelectableYear), [boundaries]);
  const [selectedProvince, setSelectedProvince] = useState(initialProvince);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState(1);

  // โหลดข้อมูลของจังหวัดที่เลือกเฉพาะตอนที่ยังไม่มีอยู่ในแคช (ลดการดึงข้อมูลทุกจังหวัดพร้อมกันตั้งแต่เปิดหน้า)
  useEffect(() => {
    if (!provinceCacheRef.current[initialProvince]) {
      provinceCacheRef.current[initialProvince] = {
        data: initialData,
        rules: Array.isArray(initialRules) ? initialRules : [],
        floodEvents: Array.isArray(initialFloodEvents) ? initialFloodEvents : [],
      };
    }

    const cached = provinceCacheRef.current[selectedProvince];
    if (cached) {
      setCurrentProvinceData(cached);
      setLoadingProvinceData(false);
      return;
    }

    let cancelled = false;
    setLoadingProvinceData(true);

    fetch(`/api/pattern?province=${encodeURIComponent(selectedProvince)}`)
      .then((res) => {
        if (!res.ok) throw new Error("โหลดข้อมูลจังหวัดไม่สำเร็จ");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const entry = {
          data: Array.isArray(json.data) ? json.data : [],
          rules: Array.isArray(json.rules) ? json.rules : [],
          floodEvents: Array.isArray(json.floodEvents) ? json.floodEvents : [],
        };
        provinceCacheRef.current[selectedProvince] = entry;
        setCurrentProvinceData(entry);
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentProvinceData({ data: [], rules: [], floodEvents: [] });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinceData(false);
      });

    return () => { cancelled = true; };
  }, [selectedProvince, initialProvince, initialData, initialRules, initialFloodEvents]);

  useEffect(() => {
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth() + 1;

    if (targetYear > boundaries.lastSelectableYear) {
      targetYear = boundaries.lastSelectableYear;
      targetMonth = 12;
    }

    setSelectedYear(String(targetYear));
    setSelectedMonth(targetMonth);
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
    for (let i = 0; i < baseYears.length; i++) {
      years.push(baseYears[i]);
    }
    for (let i = 0; i < data.length; i++) {
      const y = parseInt(data[i].year);
      if (data[i].year && !years.includes(y)) years.push(y);
    }
    const filteredYears = [];
    for (let i = 0; i < years.length; i++) {
      if (years[i] >= REAL_DATA_YEARS[0] && years[i] <= boundaries.lastSelectableYear) {
        filteredYears.push(years[i]);
      }
    }
    filteredYears.sort((a, b) => b - a);
    return filteredYears;
  }, [rulesArray, data, baseYears, boundaries]);

  const isForecastYear = !REAL_DATA_YEARS.includes(parseInt(selectedYear));

  const monthRow = useMemo(() => {
    return getMonthRow(data, selectedProvince, selectedYear, selectedMonth);
  }, [data, selectedProvince, selectedYear, selectedMonth]);

  let avgRain = null;
  if (monthRow && monthRow.average_rain != null) {
    avgRain = Math.round(parseFloat(monthRow.average_rain));
  }

  const currentLevels = useMemo(() => {
    return buildCurrentLevels(monthRow);
  }, [monthRow]);

 
  const candidateRules = useMemo(() => {
    return getRulesForProvinceMonth(rulesArray, selectedProvince, selectedMonth);
  }, [rulesArray, selectedProvince, selectedMonth]);

  const activeRules = useMemo(() => {
    return getMatchingRules(candidateRules, currentLevels);
  }, [candidateRules, currentLevels]);

  const visibleRules = filterRulesByConfidence(activeRules, confidenceThreshold);
  const sortedRules = [...activeRules].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  const ruleCountInfo = {
    total: activeRules.length,
    shown: visibleRules.length,
  };

  const graphData = useMemo(() => {
    const rulesForGraph = filterRulesByConfidence(activeRules, confidenceThreshold);
    rulesForGraph.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));


    const nodesById = {};
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
        const antId = `cause:${antecedents[j]}`;
        if (!nodesById[antId]) {
          nodesById[antId] = { id: antId, label: translateWord(antecedents[j]), rawId: antecedents[j], group: "cause", val: 3 };
          nodeOrder.push(antId);
        }
        for (let k = 0; k < consequents.length; k++) {
          const conId = `effect:${consequents[k]}`;
          if (!nodesById[conId]) {
            nodesById[conId] = { id: conId, label: translateWord(consequents[k]), rawId: consequents[k], group: "effect", val: 3 };
            nodeOrder.push(conId);
          }
          links.push({ source: antId, target: conId });
        }
      }
    }

    const nodes = [];
    for (let i = 0; i < nodeOrder.length; i++) {
      nodes.push(nodesById[nodeOrder[i]]);
    }
    return { nodes, links };
  }, [activeRules, confidenceThreshold]);

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


  const reportedAreas = useMemo(() => {
    const years = isForecastYear ? REAL_DATA_YEARS : [parseInt(selectedYear)];
    return groupReportedAreas(floodEvents, {
      province: selectedProvince,
      month: selectedMonth,
      years,
    });
  }, [floodEvents, selectedProvince, selectedMonth, selectedYear, isForecastYear]);

  
  const [selectedDistrict, setSelectedDistrict] = useState("");
  useEffect(() => {
    setSelectedDistrict("");
  }, [selectedProvince, selectedMonth, selectedYear, isForecastYear]);

  let selectedDistrictData = null;
  for (let i = 0; i < reportedAreas.districts.length; i++) {
    if (reportedAreas.districts[i].name === selectedDistrict) {
      selectedDistrictData = reportedAreas.districts[i];
      break;
    }
  }

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
    if (!REAL_DATA_YEARS.includes(year)) suffix = " (เฝ้าระวัง)";
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
    if (prediction.method === METHOD_MODEL) {
      predictionCardTitle = `${prediction.label}${thaiMonthNames[selectedMonth]} ${parseInt(selectedYear) + 543}`;
    } else {
      predictionCardTitle = prediction.label;
    }
  } else {
    predictionCardTitle = "สถานะอุทกภัย (สถิติจริง)";
  }

  const isHistoricalOnly =
    isForecastYear && prediction.assessmentType === ASSESSMENT_HISTORICAL_ONLY;

  const riskLevel = isForecastYear
    ? getMonitoringLevelInfo(
        isHistoricalOnly ? prediction.historicalLevel : prediction.monitoringLevel
      )
    : null;

  let predictionCardSubtitle = "";
  if (isForecastYear) {
    if (isHistoricalOnly) {
      predictionCardSubtitle =
        `อ้างอิงจากประวัติอุทกภัยของจังหวัดและเดือนเดียวกันในช่วง ` +
        `พ.ศ. ${REAL_DATA_YEARS[0] + 543}–${LAST_REAL_YEAR + 543}`;
    } else {
      predictionCardSubtitle = "ประเมินจากประวัติอุทกภัยและข้อมูลการค้นหา";
    }
  }

let predictionValueBlock;
if (isForecastYear) {
  let displayLevel = "ไม่สามารถประเมินได้";

  if (riskLevel) {
    if (riskLevel.key === "low") {
      displayLevel = "สถานการณ์ปกติ";
    } else {
      displayLevel = riskLevel.label;
    }
  }
  predictionValueBlock = (
    <span className={`text-3xl font-black ${riskLevel ? riskLevel.tw.text : "text-slate-600"}`}>
      {displayLevel}
    </span>
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

  let rainValueBlock;
  if (avgRain != null) {
    rainValueBlock = (
      <>
        <span className="text-4xl font-black text-purple-600">{avgRain}</span>
        <span className="text-sm font-bold opacity-70 text-purple-600">มม.</span>
      </>
    );
  } else {
    rainValueBlock = <span className="text-2xl font-black text-slate-400">ไม่มีข้อมูล</span>;
  }

  const districtLabel = selectedProvince === "กรุงเทพมหานคร" ? "เขต" : "อำเภอ";
  const subdistrictLabel = selectedProvince === "กรุงเทพมหานคร" ? "แขวง" : "ตำบล";

  let areaCardTitle;
  if (isForecastYear) {
    areaCardTitle =
      `พื้นที่ที่เคยมีรายงานอุทกภัยในเดือน${thaiMonthNames[selectedMonth]} ` +
      `พ.ศ. ${REAL_DATA_YEARS[0] + 543}–${LAST_REAL_YEAR + 543}`;
  } else {
    areaCardTitle = "พื้นที่ที่ได้รับผลกระทบจากเหตุการณ์อุทกภัย";
  }


  let areaEmptyText;
  if (!reportedAreas.hasEvents) {
    areaEmptyText = isForecastYear
      ? `ไม่พบรายงานการเกิดอุทกภัยของเดือนนี้ในช่วง พ.ศ. ${REAL_DATA_YEARS[0] + 543}–${LAST_REAL_YEAR + 543}`
      : `ไม่พบรายงานการเกิดอุทกภัยในเดือน${thaiMonthNames[selectedMonth]} พ.ศ. ${parseInt(selectedYear) + 543}`;
  } else {
    areaEmptyText = "มีรายงานการเกิดอุทกภัยในเดือนนี้ แต่ยังไม่มีรายละเอียดระดับพื้นที่ในชุดข้อมูล";
  }



  let causeLegendText;
  if (hasNodeWithGroupAndId(graphData.nodes, "cause", "rain_level_High")) {
    causeLegendText = "เกิดเหตุการณ์ฝนตกหนัก พร้อมมีการค้นหาคำเหล่านี้";
  } else {
    causeLegendText = "มีการค้นหาคำเหล่านี้";
  }


  let effectLegendText;
  if (hasNodeWithGroupAndId(graphData.nodes, "effect", "rain_level_High")) {
    effectLegendText = "มักพบฝนตกหนักในเดือนเดียวกัน";
  } else {
    effectLegendText = "มักพบการค้นหาคำนี้ในเดือนเดียวกัน";
  }

  
  const rainTier = avgRain != null ? classifyFloodRisk(avgRain) : null;

  let rainStatusBoxClass =
    "px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ";
  if (rainTier) {
    rainStatusBoxClass += `${rainTier.tw.bg} ${rainTier.tw.border} ${rainTier.tw.text}`;
  } else {
    rainStatusBoxClass += "bg-slate-50 border-slate-200 text-slate-500";
  }

  let rainStatusText;
  if (avgRain == null) {
    rainStatusText = "ไม่มีข้อมูลปริมาณฝนเดือนนี้";
  } else {
    rainStatusText = `${rainTier.label} (${avgRain} มม.)`;
  }

  let ruleListSection;
  if (!isForecastYear) {
    if (visibleRules.length > 0) {
      const cards = [];
      for (let i = 0; i < visibleRules.length; i++) {
        const rule = visibleRules[i];
        const antecedentLabels = translateWordList(asArray(rule.antecedents));
        const antecedentTags = buildWordTagList(antecedentLabels, "bg-orange-50 text-orange-700 border-orange-100");
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
      if (activeRules.length > 0) {
        emptyMessage = "ไม่พบรูปแบบที่ผ่านเกณฑ์ความสอดคล้องที่เลือกไว้";
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
    if (visibleRules.length > 0) {
      const cards = [];
      for (let i = 0; i < visibleRules.length; i++) {
        const rule = visibleRules[i];
        const antecedentLabels = translateWordList(asArray(rule.antecedents));
        const consequentLabels = translateWordList(asArray(rule.consequents));
        const antecedentTags = buildWordTagList(antecedentLabels, "bg-orange-50 text-orange-700 border-orange-100");
        const consequentTags = buildWordTagList(consequentLabels, "bg-sky-50 text-sky-700 border-sky-100");
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
      if (activeRules.length > 0) {
        emptyMessage = "ไม่พบรูปแบบที่ผ่านเกณฑ์ความสอดคล้องที่เลือกไว้";
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
      affectedText = "ไม่ระบุจำนวน";
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
    noEventText = "ไม่พบสถิติรายงานการเกิดอุทกภัยในอดีตสำหรับเดือนนี้";
  } else {
    noEventText = `ไม่มีรายงานการเกิดอุทกภัยจริงในเดือน${thaiMonthNames[selectedMonth]} พ.ศ. ${parseInt(selectedYear) + 543}`;
  }

  const selectedMonthText = `เดือน${thaiMonthNames[selectedMonth]} พ.ศ. ${
    parseInt(selectedYear) + 543
  }`;

let historyRatioText;
    if (floodHistory.total === 0) {
  historyRatioText = "ไม่มีข้อมูลเหตุการณ์ย้อนหลังเพียงพอ";
} else if (floodHistory.count === 0) {
  historyRatioText = `เดือนเดียวกันนี้ไม่เคยเกิดอุทกภัยในรอบ ${floodHistory.total} ปี`;
} else {
  historyRatioText = `เดือนเดียวกันนี้เคยเกิดอุทกภัย ${floodHistory.count} จาก ${floodHistory.total} ปี`;
}

  

  function joinThaiList(parts) {
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} และ ${parts[1]}`;
    return `${parts.slice(0, -1).join(", ")} และ ${parts[parts.length - 1]}`;
  }


  let hasTargetSearchData = false;
  if (monthRow) {
    for (let i = 0; i < SEARCH_FIELDS.length; i++) {
      if (monthRow[SEARCH_FIELDS[i]] != null) {
        hasTargetSearchData = true;
        break;
      }
    }
  }

  const SEARCH_BEHAVIOR_CATEGORY = {
    search_flood: "flood",
    search_rain: "rain",
    search_storm: "storm",
    search_water_level: "water_watch",
    search_water_situation: "water_watch",
    search_evacuate: "response",
  };
  const SEARCH_BEHAVIOR_CATEGORY_ORDER = ["flood", "rain", "storm", "water_watch", "response"];

  function searchBehaviorCategoryPhrase(category, fieldsInCategory) {
    if (category === "flood") return "น้ำท่วม";
    if (category === "rain") return "ฝนตกหนัก";
    if (category === "storm") return "พายุเข้าไทย";
    if (category === "water_watch") {
      const hasLevel = fieldsInCategory.includes("search_water_level");
      const hasSituation = fieldsInCategory.includes("search_water_situation");
      if (hasLevel && hasSituation) return "การติดตามสถานการณ์น้ำ";
      if (hasLevel) return "การติดตามระดับน้ำ";
      return "การติดตามสถานการณ์น้ำ";
    }
    return "การรับมือหรือการอพยพ";
  }


  function searchBehaviorPhraseList(highFields) {
    const byCategory = {};
    for (let i = 0; i < highFields.length; i++) {
      const cat = SEARCH_BEHAVIOR_CATEGORY[highFields[i]];
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(highFields[i]);
    }
    const phrases = [];
    for (let i = 0; i < SEARCH_BEHAVIOR_CATEGORY_ORDER.length; i++) {
      const cat = SEARCH_BEHAVIOR_CATEGORY_ORDER[i];
      if (byCategory[cat]) phrases.push(searchBehaviorCategoryPhrase(cat, byCategory[cat]));
    }
    return phrases;
  }


  function describeSearchBehaviorSummary(highFields) {
    if (highFields.length === 0) return "";
    const phrases = searchBehaviorPhraseList(highFields);
    return `เดือนนี้มีการค้นหาเกี่ยวกับ${joinThaiList(phrases)}`;
  }

  const targetHighFields = [];
  for (let i = 0; i < SEARCH_FIELDS.length; i++) {
    if (currentLevels[SEARCH_FIELDS[i]] === "High") {
      targetHighFields.push(SEARCH_FIELDS[i]);
    }
  }
  const searchBehaviorSummaryText = describeSearchBehaviorSummary(targetHighFields);

  const summaryCardClass = "bg-sky-50 border-sky-200";

  let summaryDetail = "";

  let summaryMethodologyText = "";

  if (!isForecastYear) {

    if (matchedRealEvent) {

      summaryDetail =
      
        `${thaiMonthNames[selectedMonth]} มีรายงานการเกิดอุทกภัยใน ${selectedMonthText} 
        โดย${historyRatioText} ` +
        `และ${rainStatusText}`;
    } else {

      summaryDetail =
        `${selectedMonthText} ไม่พบรายงานการเกิดอุทกภัยในข้อมูลที่รวบรวมไว้ ` +
        `โดย${historyRatioText} และ${rainStatusText}`;
    }
  } else if (!riskLevel) {
    summaryMethodologyText = "";
  } else {
    let levelWord;
    if (riskLevel.key === "low") {
      levelWord = "สถานการณ์ปกติ";
    } else if (riskLevel.key === "medium") {
      levelWord = "ปานกลาง";
    } else if (riskLevel.key === "high") {
      levelWord = "สูง";
    } else {
      levelWord = riskLevel.label;
    }

    if (isHistoricalOnly) {
      const monthYearText =
        `เดือน${thaiMonthNames[selectedMonth]} ${parseInt(selectedYear) + 543}`;

      let historyClause;
      if (floodHistory.count === 0) {
        historyClause =
          `ไม่พบรายงานการเกิดอุทกภัยในเดือน${thaiMonthNames[selectedMonth]} `;
      } else {
        historyClause =
          `พบรายงานการเกิดอุทกภัยในเดือน${thaiMonthNames[selectedMonth]} ` +
          `${floodHistory.count} จาก ${floodHistory.total} ปีย้อนหลัง`;
      }

      summaryMethodologyText =
        `${monthYearText} ${historyClause} ` +
        `สะท้อนระดับการเกิดอุทกภัยย้อนหลัง${levelWord} `;
    } else {
      const studyYearRange = `(พ.ศ. ${REAL_DATA_YEARS[0] + 543}–${LAST_REAL_YEAR + 543})`;

      let provinceHistoryClause;
      if (floodHistory.count === 0) {
        provinceHistoryClause =
          `ไม่มีรายงานอุทกภัยในเดือน${thaiMonthNames[selectedMonth]}ในช่วง ${floodHistory.total} ปีที่ศึกษา ${studyYearRange}`;
      } else if (floodHistory.count === floodHistory.total) {
        provinceHistoryClause =
          `มีรายงานอุทกภัยในเดือน${thaiMonthNames[selectedMonth]}ครบทั้ง ${floodHistory.total} ปีที่ศึกษา ${studyYearRange}`;
      } else {
        provinceHistoryClause =
          `มีรายงานอุทกภัยในเดือน${thaiMonthNames[selectedMonth]} ${floodHistory.count} จาก ${floodHistory.total} ปีที่ศึกษา ${studyYearRange}`;
      }

      let provinceNamePart;
      if (selectedProvince === "กรุงเทพมหานคร") {
        provinceNamePart = selectedProvince;
      } else {
        provinceNamePart = `จังหวัด${selectedProvince}`;
      }
      const historySentence = `${provinceNamePart}${provinceHistoryClause}`;

      if (riskLevel.key === "low") {
        summaryMethodologyText = `${historySentence} จึงอยู่ในสถานการณ์ปกติ`;
      } else {
        summaryMethodologyText = `${historySentence} โดยระบบประเมินระดับเฝ้าระวังอยู่ในระดับ${levelWord}`;
      }
    }

    // แสดงคำค้นหาที่พบในเดือนนั้นทั้งหมด (ค่าดัชนีตั้งแต่ 1 ขึ้นไป) ไม่ใช่เฉพาะคำจากกฎใดกฎหนึ่ง
    if (targetHighFields.length > 0) {
      const foundWords = [];
      for (let i = 0; i < targetHighFields.length; i++) {
        foundWords.push(`“${SEARCH_LABELS[targetHighFields[i]]}”`);
      }

      let associationClause = `เมื่อพิจารณาข้อมูล Google Trends ในเดือนที่เลือก พบการสืบค้นคำว่า ${joinThaiList(foundWords)}`;
      if (sortedRules.length > 0) {
        associationClause =
          associationClause + " ซึ่งตรงกับรูปแบบความสัมพันธ์ที่ค้นพบจากการวิเคราะห์ข้อมูลย้อนหลัง";
      }

      summaryMethodologyText = `${summaryMethodologyText} ${associationClause}`;
    }
  }

  const adviceBulletItems = [];
  if (riskLevel && riskLevel.advice) {
    for (let i = 0; i < riskLevel.advice.bullets.length; i++) {
      adviceBulletItems.push(
        <li
          key={i}
          className="flex gap-2 text-[15px] font-semibold leading-relaxed text-slate-700"
        >
          <span className="shrink-0 text-emerald-600" aria-hidden="true">✓</span>
          <span>{riskLevel.advice.bullets[i]}</span>
        </li>
      );
    }
  }

  const districtOptionElements = [];
  for (let i = 0; i < reportedAreas.districts.length; i++) {
    const district = reportedAreas.districts[i];
    districtOptionElements.push(
      <option key={district.name} value={district.name}>
        {districtLabel}{district.name}
      </option>
    );
  }

  let selectedDistrictYearsText = "";
  const selectedDistrictSubdistrictItems = [];
  if (selectedDistrictData) {
    const yearTexts = [];
    for (let i = 0; i < selectedDistrictData.years.length; i++) {
      yearTexts.push(selectedDistrictData.years[i] + 543);
    }
    selectedDistrictYearsText = yearTexts.join(", ");

    for (let i = 0; i < selectedDistrictData.subdistricts.length; i++) {
      const subdistrict = selectedDistrictData.subdistricts[i];
      selectedDistrictSubdistrictItems.push(
        <div key={subdistrict.name} className="flex flex-col gap-0.5">
          <span className="text-[13px] font-bold text-slate-700">{subdistrictLabel}{subdistrict.name}</span>
          {selectedProvince !== "กรุงเทพมหานคร" && (
            <span className="text-xs font-semibold text-slate-500">{subdistrict.mooText}</span>
          )}
        </div>
      );
    }
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

          {loadingProvinceData && (
            <p className="flex items-center gap-2 text-[11px] font-bold text-sky-600 mt-3 pl-2">
              <CircularProgress size={12} />
              กำลังโหลดข้อมูล{selectedProvince}...
            </p>
          )}
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`px-5 py-4 rounded-2xl border-2 shadow-sm ${prediction.requiresMonitoring ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200"}`}>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
            {predictionCardTitle}
          </p>
          <div className="flex items-baseline gap-1">
            {predictionValueBlock}
          </div>
          {predictionCardSubtitle && (
            <p className="text-[11px] text-slate-400/70 font-bold mt-1">
              {predictionCardSubtitle}
            </p>
          )}
        </div>
        <div className="px-5 py-4 rounded-2xl border-2 bg-purple-50 border-purple-200 shadow-sm">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
            ปริมาณน้ำฝนประจำเดือน
          </p>
          <div className="flex items-baseline gap-1">
            {rainValueBlock}
          </div>
          <p className="text-[11px] text-slate-400/70 font-bold mt-1">
            {rainStatusText}
          </p>
        </div>
      </div>


       <div className={`p-6 rounded-2xl border-2 shadow-sm ${summaryCardClass}`}>

  <p className="mb-1 flex items-center gap-1.5 text-m font-bold uppercase tracking-wider text-slate-500">
    <EmojiObjectsIcon
      className="text-amber-500"
      fontSize="medium"
    />
    สรุปผล
  </p>


  {isForecastYear ? (
    <div className="mt-1 flex flex-col divide-y divide-slate-200/70">

      {summaryMethodologyText && (
        <p className="m-0 py-4 text-[15px] font-semibold leading-relaxed text-slate-700">
          {summaryMethodologyText}
        </p>
      )}

      {riskLevel?.advice && (riskLevel.key === "medium" || riskLevel.key === "high") && (
        <div className="pt-4 flex flex-col gap-3">
          <p className="m-0 text-[15px] font-black text-slate-800">
            แนวทางเตรียมความพร้อม: {riskLevel.advice.title}
          </p>
          <ul className="m-0 flex list-none flex-col gap-1.5 pl-0">
            {adviceBulletItems}
          </ul>
          {riskLevel.advice.hotline && (
            <p className="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[15px] font-black text-red-700">
              {riskLevel.advice.hotline}
            </p>
          )}
        </div>
      )}

    </div>
  ) : (
    /* กรณีดูข้อมูลย้อนหลัง */
    <p className="mt-2 text-[15px] font-semibold leading-relaxed text-slate-600">
      {summaryDetail}
    </p>
  )}
</div>


      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-slate-500 shadow-sm text-white flex">
            <PlaceIcon fontSize="small" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold tracking-tight leading-none text-base">
              {areaCardTitle}
            </h3>
          </div>
        </div>

        <div className="p-5">
          {reportedAreas.hasAreaDetail ? (
            <div className="flex flex-col gap-3">

              <p className="m-0 text-xs text-slate-500">
                พบ {reportedAreas.districts.length} {districtLabel}ที่เคยมีรายงาน
              </p>

              <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200">
                <FloodAreaMapView
                  districts={reportedAreas.districts}
                  province={selectedProvince}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">
                  ดูรายละเอียดราย{districtLabel}
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer w-full"
                  >
                    <option value="">— เลือก{districtLabel} —</option>
                    {districtOptionElements}
                  </select>
                  <div className="pointer-events-none text-slate-400 ml-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
              </div>

              {selectedDistrictData && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-2.5">
                  <p className="m-0 pb-2 border-b border-slate-200 text-[11px] font-bold text-slate-400">
                    เหตุการณ์ล่าสุด: {selectedDistrictData.latestDate ? formatThaiDate(selectedDistrictData.latestDate) : "ไม่ระบุวันที่"}
                    {" · "}ปีที่เคยมีรายงาน: {selectedDistrictYearsText}
                  </p>
                  {selectedDistrictSubdistrictItems}
                </div>
              )}

              <p className="m-0 text-[11px] text-slate-400">
                {/* พิกัดตำบลจากชุดข้อมูล &ldquo;พิกัดตำบล อำเภอ จังหวัดของประเทศ&rdquo; โดยกรมการปกครอง */}
                เผยแพร่ผ่าน{' '}
                <a href="https://gistdaportal.gistda.or.th/portal/home/item.html?id=a9e042bb191a43a9994e469ada3fa66e" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                  GISTDA
                </a>
                {' · '}DGA Open Government License
              </p>
            </div>
          ) : (
            <div className="p-6 flex flex-col items-center justify-center gap-2 text-center">
              <PlaceIcon className="text-slate-200" sx={{ fontSize: 36 }} />
              <p className="text-slate-500 font-bold text-sm m-0">{areaEmptyText}</p>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-sky-700 shadow-sm text-white flex">
                <HubIcon fontSize="small" />
              </div>
              <div>
                <h3 className="text-slate-800 font-bold tracking-tight leading-none text-base">
                  ข้อมูลการค้นหาจาก Google Trends เทียบกับสถานการณ์จริง
                </h3>
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


          <div className="px-6 py-5 border-b border-slate-100 flex flex-col gap-4">
            {!hasTargetSearchData ? (
              <p className="m-0 text-sm font-semibold text-slate-500">
                ยังไม่มีข้อมูลการค้นหาสำหรับเดือนและปีที่เลือก
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    ข้อมูลการค้นหาในเดือน{thaiMonthNames[selectedMonth]} {parseInt(selectedYear) + 543}
                  </span>
                  {targetHighFields.length === 0 ? (
                    <p className="m-0 text-sm font-semibold leading-relaxed text-slate-600">
                      ไม่มีคำค้นหา
                    </p>
                  ) : (
                    <p className="m-0 text-sm font-semibold leading-relaxed text-slate-700">
                      {searchBehaviorSummaryText}
                    </p>
                  )}
                </div>
              </>
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
                    const label = node.label;
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 bg-sky-700 flex items-center gap-3">
            <div className="p-1.5 bg-black/10 rounded-lg text-white flex items-center justify-center">
              <ReportIcon fontSize="small" />
            </div>
            <div>
              <h3 className="text-white font-bold tracking-tight text-base leading-none">
                เหตุการณ์อุทกภัยจริงที่เคยเกิดขึ้น{" "}
                {isForecastYear ? `(อ้างอิงอดีต พ.ศ. ${REAL_DATA_YEARS[0] + 543}–${LAST_REAL_YEAR + 543})` : `(พ.ศ. ${parseInt(selectedYear) + 543})`}
              </h3>
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
        </div>
      </div>
    </div>
  );
}
