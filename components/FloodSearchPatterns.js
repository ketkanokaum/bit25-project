"use client";
import React, { useState, useMemo, useEffect } from "react";
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
import { percentOfNormal, classifyRainLevel } from "@/lib/rainlevel";
import {
  getDataBoundaries,
  getAllYears,
  predictFlood,
  getFloodEvents,
  didFloodHappen,
  getMonthRow,
  getBaseline,
  REAL_DATA_YEARS,
  LAST_REAL_YEAR,
  SEARCH_FIELDS,
  SEARCH_LABELS,
  getMonitoringLevelInfo,
  ASSESSMENT_HISTORICAL_ONLY,
  METHOD_MODEL,
} from "@/lib/prediction";

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
    rain_level_High: "ปริมาณฝนสูงกว่าปกติ",
    search_rain: "ค้นหา 'ฝนตก'",
    search_flood: "ค้นหา 'น้ำท่วม'",
    search_storm: "ค้นหา 'พายุ'",
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


function buildCurrentLevels(monthRow, baseline) {
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

  if (
    monthRow &&
    monthRow.average_rain != null &&
    baseline.value != null &&
    baseline.value !== 0
  ) {
    const rain = parseFloat(monthRow.average_rain);
    const percent = (rain / baseline.value) * 100;
    levels.rain = percent > 110 ? "High" : "NotHigh";
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

export default function FloodSearchPatterns({ initialData = [], initialRules = [], initialFloodEvents = [] }) {
  const [isClient, setIsClient] = useState(false);
  const data = initialData;
  const rulesArray = Array.isArray(initialRules) ? initialRules : [];


  const floodEvents = Array.isArray(initialFloodEvents) ? initialFloodEvents : [];
  const boundaries = useMemo(() => getDataBoundaries(data), [data]);
  const baseYears = useMemo(() => getAllYears(boundaries.lastSelectableYear), [boundaries]);
  const [selectedProvince, setSelectedProvince] = useState("ขอนแก่น");
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedMonth, setSelectedMonth] = useState(1);

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

  const baseline = useMemo(
    () => getBaseline(data, selectedProvince, selectedMonth),
    [data, selectedProvince, selectedMonth]
  );

  const currentLevels = useMemo(() => {
    return buildCurrentLevels(monthRow, baseline);
  }, [monthRow, baseline]);

 
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


  let rainVsBaselineLabel = "";
  if (baseline.value == null) {
    rainVsBaselineLabel = "ไม่มีปริมาณน้ำฝนปกติของเดือนนี้";
  } else if (avgRain == null) {
    rainVsBaselineLabel = `ค่าปกติของเดือนนี้ ${baseline.value} มม.`;
  } else {

    const rainPercent = percentOfNormal(parseFloat(monthRow.average_rain), baseline.value);
    rainVsBaselineLabel = `${classifyRainLevel(rainPercent).label} (ค่าปกติ ${baseline.value} มม.)`;
  }

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

  const selectedDistrictData = reportedAreas.districts.find((d) => d.name === selectedDistrict) || null;

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

  
  const rainTier =
    avgRain != null && baseline.value != null
      ? classifyRainLevel(percentOfNormal(parseFloat(monthRow.average_rain), baseline.value))
      : null;

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
  } else if (baseline.value == null) {
    rainStatusText = `ฝน ${avgRain} มม. (ไม่มีค่าปกติเทียบ)`;
  } else {
    rainStatusText = `${rainTier.label} (${avgRain} จาก ${baseline.value} มม.)`;
  }

  let ruleListSection;
  if (!isForecastYear) {
    if (visibleRules.length > 0) {
      const cards = [];
      for (let i = 0; i < visibleRules.length; i++) {
        const rule = visibleRules[i];
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
    if (parts.length === 2) return `${parts[0]} และ${parts[1]}`;
    return `${parts.slice(0, -1).join(", ")} และ${parts[parts.length - 1]}`;
  }

  function ruleItemWord(item) {
    if (item === "rain_level_High") return "ปริมาณฝนสูงกว่าปกติ";
    return SEARCH_LABELS[item] ? SEARCH_LABELS[item] : item;
  }

  function selectDiverseRules(rules, maxCount) {
    const seenConsequent = new Set();
    const picked = [];
    for (let i = 0; i < rules.length && picked.length < maxCount; i++) {
      const key = asArray(rules[i].consequents).slice().sort().join(",");
      if (seenConsequent.has(key)) continue;
      seenConsequent.add(key);
      picked.push(rules[i]);
    }
    return picked;
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
    if (category === "rain") return "ฝนตกในพื้นที่";
    if (category === "storm") return "พายุ";
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

  const targetHighFields = SEARCH_FIELDS.filter((f) => currentLevels[f] === "High");
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
  } else {

  
  if (riskLevel) {
  const levelWord =
    { low: "สถานการณ์ปกติ", medium: "ปานกลาง", high: "สูง" }[riskLevel.key] ||
    riskLevel.label;

  const monthYearText =
    `เดือน${thaiMonthNames[selectedMonth]} ${parseInt(selectedYear) + 543}`;

  let historyClause;
  if (floodHistory.count === 0) {
    historyClause =
      `ไม่พบรายงานการเกิดอุทกภัยในเดือน${thaiMonthNames[selectedMonth]} ` ;
      
  } else {
    historyClause =
      `พบรายงานการเกิดอุทกภัยในเดือน${thaiMonthNames[selectedMonth]} ` +
      `${floodHistory.count} จาก ${floodHistory.total} ปีย้อนหลัง`;
  }

  if (!isHistoricalOnly) {

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

    const provinceNamePart =
      selectedProvince === "กรุงเทพมหานคร" ? selectedProvince : `จังหวัด${selectedProvince}`;
    const historySentence = `${provinceNamePart}${provinceHistoryClause}`;

    if (riskLevel.key === "low") {
      summaryMethodologyText = `${historySentence} จึงอยู่ในสถานการณ์ปกติ`;
    } else {
      summaryMethodologyText = `${historySentence} โดยระบบประเมินระดับเฝ้าระวังอยู่ในระดับ${levelWord}`;
    }

  } else {

    summaryMethodologyText =
      `${monthYearText} ${historyClause} ` +
      `สะท้อนระดับการเกิดอุทกภัยย้อนหลัง${levelWord} ` ;
  }


  if (sortedRules.length > 0) {

    const topRule = selectDiverseRules(sortedRules, 1)[0];

    const ruleTopics = [];
    if (topRule) {
      const ruleItems = asArray(topRule.antecedents).concat(asArray(topRule.consequents));
      for (let i = 0; i < ruleItems.length; i++) {
        const item = ruleItems[i];
        const topic = item === "rain_level_High" ? "ปริมาณฝน" : `“${ruleItemWord(item)}”`;
        if (ruleTopics.indexOf(topic) === -1) ruleTopics.push(topic);
      }
    }

    let associationClause = "เมื่อพิจารณาข้อมูล Google Trends ในเดือนที่เลือก";
    if (ruleTopics.length > 0) {
      associationClause =
        associationClause +
        ` พบการสืบค้นคำว่า ${joinThaiList(ruleTopics)} ซึ่งตรงกับรูปแบบความสัมพันธ์ที่ค้นพบจากการวิเคราะห์ข้อมูลย้อนหลัง`;
    }

    summaryMethodologyText = `${summaryMethodologyText} ${associationClause}`;
  }

} else {
  summaryMethodologyText =
    "";
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
        </div>

        {isForecastYear && (
          <div className="px-5 pb-4 -mt-1 space-y-2">
            {/* <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold">
              <AutoGraphIcon fontSize="small" />
              ปีนี้ยังไม่มีสถิติอุทกภัยยืนยัน — หาแนวโน้มจากฐานข้อมูลปี {REAL_DATA_YEARS[0] + 543}–{LAST_REAL_YEAR + 543}
            </div> */}
          </div>
        )}
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
            {rainVsBaselineLabel}
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
        <p className="m-0 py-4 text-sm font-semibold leading-normal text-slate-700">
          {summaryMethodologyText}
        </p>
      )}

      {riskLevel?.advice && (riskLevel.key === "medium" || riskLevel.key === "high") && (
        <div className="pt-4 flex flex-col gap-3">
          <p className="m-0 text-sm font-black text-slate-800">
            แนวทางเตรียมความพร้อม: {riskLevel.advice.title}
          </p>
          <ul className="m-0 flex list-none flex-col gap-1.5 pl-0">
            {riskLevel.advice.bullets.map((bullet, index) => (
              <li
                key={index}
                className="flex gap-2 text-sm font-semibold leading-relaxed text-slate-700"
              >
                <span className="shrink-0 text-emerald-600" aria-hidden="true">✓</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          {riskLevel.advice.note && (
            <p className="m-0 text-xs font-semibold leading-relaxed text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {riskLevel.advice.note}
            </p>
          )}
          {/* <div className="flex flex-wrap gap-2">
            <a
              href={OFFICIAL_SOURCES[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold hover:bg-sky-100 transition-colors"
            >
              ตรวจสอบประกาศทางการ
            </a>
          </div> */}
          {/* <p className="m-0 text-[11px] text-slate-400 leading-relaxed">
            แนวทางเหล่านี้อ้างอิง{" "}
            <a
              href={ADVICE_SOURCE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600"
            >
              {ADVICE_SOURCE.label}
            </a>
            {" "}· แหล่งข้อมูลอื่น: {OFFICIAL_SOURCES.slice(1).map((s) => s.name).join(" · ")}
            {" "}· {DISCLAIMER}
          </p> */}
        </div>
      )}
{/* 
      {riskLevel?.key === "low" && (
        <div className="pt-4 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <a
              href={OFFICIAL_SOURCES[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold hover:bg-sky-100 transition-colors"
            >
              ตรวจสอบประกาศทางการ
            </a>
          </div>
          <p className="m-0 text-[11px] text-slate-400 leading-relaxed">{DISCLAIMER}</p>
        </div> */}
      

    </div>
  ) : (
    /* กรณีดูข้อมูลย้อนหลัง */
    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
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
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
            
              {/* {isForecastYear
                ? ` อ้างอิงข้อมูลย้อนหลัง พ.ศ. ${REAL_DATA_YEARS[0] + 543}–${LAST_REAL_YEAR + 543}`
                : `  พ.ศ. ${parseInt(selectedYear) + 543}`} */}
            </p>
          </div>
        </div>

        <div className="p-5">
          {reportedAreas.hasAreaDetail ? (
            <div className="flex flex-col gap-3">

              <p className="m-0 text-xs text-slate-500">
                พบ {reportedAreas.districts.length} {districtLabel}ที่เคยมีรายงาน หมุดที่อยู่ใกล้กันรวมเป็นกลุ่มไว้ ซูมเข้าเพื่อดู{subdistrictLabel}และหมู่
              </p>

              <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200">
                <FloodAreaMapView
                  districts={reportedAreas.districts}
                  province={selectedProvince}
                />
              </div>

              {/* <p className="m-0 text-[11px] text-slate-400">
                หมุดแทนตำบลที่เคยมีรายงานอุทกภัย ไม่ใช่ตำแหน่งหรือขอบเขตน้ำท่วมจริง และไม่ได้แปลว่าพื้นที่นั้นกำลังมีน้ำท่วมอยู่ในขณะนี้
              </p> */}

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
                    {reportedAreas.districts.map((d) => (
                      <option key={d.name} value={d.name}>
                        {districtLabel}{d.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none text-slate-400 ml-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
              </div>

              {selectedDistrictData && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-col gap-2.5">
                  {selectedDistrictData.subdistricts.map((s) => (
                    <div key={s.name} className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-bold text-slate-700">{subdistrictLabel}{s.name}</span>
                      <span className="text-xs font-semibold text-slate-500">{s.mooText}</span>
                    </div>
                  ))}
                  <p className="m-0 mt-1 pt-2 border-t border-slate-200 text-[11px] font-bold text-slate-400">
                    เหตุการณ์ล่าสุด: {selectedDistrictData.latestDate ? formatThaiDate(selectedDistrictData.latestDate) : "ไม่ระบุวันที่"}
                    {" · "}ปีที่เคยมีรายงาน: {selectedDistrictData.years.map((y) => y + 543).join(", ")}
                  </p>
                </div>
              )}

              <p className="m-0 text-[11px] text-slate-400">
                พิกัดตำบลจากชุดข้อมูล &ldquo;พิกัดตำบล อำเภอ จังหวัดของประเทศ&rdquo; โดยกรมการปกครอง
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

          {/* <p className="m-0 mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-semibold leading-relaxed">
            เป็นข้อมูลพื้นที่ที่เคยมีรายงานในอดีต ไม่ใช่การยืนยันว่าพื้นที่ดังกล่าวจะได้รับผลกระทบในครั้งนี้
            หากอาศัยอยู่ในพื้นที่ดังกล่าว ควรติดตามประกาศของอำเภอ เทศบาล หรือองค์การบริหารส่วนตำบลอย่างใกล้ชิด
          </p> */}
        </div>
      </div>
      {/* <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-sky-700 shadow-sm text-white flex">
            <ShowChartIcon fontSize="small" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold tracking-tight leading-none text-lg">
              {chartTitle}
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
                margin={{ top: 25, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                <XAxis
                  dataKey="ปี"
                  tick={{ fontSize: 12, fontWeight: 700, fill: "#475569" }}
                />

                <YAxis
                  yAxisId="chance"
                  domain={[0, 3]}
                  ticks={[0, 1, 2, 3]}
                  tickFormatter={(v) => CHART_AXIS_LABEL[v] || ""}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />

                <Tooltip
                  formatter={forecastTooltipFormatter}
                  labelFormatter={(label) =>
                        `${label} · ${thaiMonthNames[selectedMonth]}  `
                      }
                />

                <ReferenceArea
                  yAxisId="chance"
                  x1={`พ.ศ. ${LAST_REAL_YEAR + 543}`}
                  x2={`พ.ศ. ${boundaries.lastSelectableYear + 543}`}
                  fill="#8b5cf6"
                  fillOpacity={0.07}
                  // label={{ value: "แนวโน้ม", position: "insideTop", fontSize: 10, fill: "#8b5cf6" }}
                />

                <ReferenceLine
                  yAxisId="chance"
                  y={100 / 3}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: "เกณฑ์ปานกลาง 33.33%", position: "insideBottomLeft", fontSize: 10, fill: "#f59e0b" }}
                />

                <ReferenceLine
                  yAxisId="chance"
                  y={200 / 3}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{ value: "เกณฑ์สูง 66.67%", position: "insideBottomLeft", fontSize: 10, fill: "#ef4444" }}
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
                  label={{ value: "หมดข้อมูลจริง", position: "top", fontSize: 10, fill: "#8b5cf6" }}
                />

              </LineChart>
            </ResponsiveContainer>
          )}

          {!isForecastYear && (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={monthWindowData}
                margin={{ top: 25, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                <XAxis
                  dataKey="label"
                  tick={monthWindowTick}
                />

                <YAxis
                  yAxisId="chance"
                  domain={[0, 1]}
                  ticks={[0, 1]}
                  tickFormatter={(v) => HISTORICAL_AXIS_LABEL[v] || ""}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />

                <Tooltip
                  formatter={monthWindowTooltipFormatter}
                />


                <Line
                  yAxisId="chance"
                  type="monotone"
                  dataKey="สถานะอุทกภัย"
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

          {!isForecastYear ? (
            <div className="flex flex-wrap items-center gap-5 mt-4 justify-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                <span className="text-xs font-bold text-slate-500">พบรายงานอุทกภัย</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
                <span className="text-xs font-bold text-slate-500">ไม่พบรายงานอุทกภัย</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 mt-4">
              <div className="flex flex-wrap items-center gap-5 justify-center">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
                  <span className="text-xs font-bold text-slate-500">สถานการณ์ปกติ</span>

                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="text-xs font-bold text-slate-500">เฝ้าระวังปานกลาง</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                  <span className="text-xs font-bold text-slate-500">เฝ้าระวังสูง</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center max-w-md">
                คะแนนได้จากแบบจำลองที่ใช้สถิติอุทกภัยย้อนหลังร่วมกับความสนใจค้นหาของเดือนนี้เอง
                เทียบกับรูปแบบในอดีต ใช้จัดลำดับความเร่งด่วนในการเฝ้าระวัง ไม่ใช่ความน่าจะเป็นที่จะเกิดอุทกภัย
              </p>
            </div>
          )}

        </div>
      </div> */}
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
                {/* <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  ตรวจจากคำค้นหาที่มีดัชนีตั้งแต่ 1 ขึ้นไป และตรงกับกฎจากข้อมูลย้อนหลัง การพบรูปแบบไม่ได้หมายถึงการค้นหาสูงผิดปกติหรือยืนยันการเกิดอุทกภัย
                </p> */}
                {/* <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                  {selectedProvince} · {thaiMonthNames[selectedMonth]} {parseInt(selectedYear) + 543}
                </p> */}
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

                {/* <div className="flex flex-wrap gap-2">
                  {searchIndexList.map((item) => (
                    <div
                      key={item.field}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold ${
                        item.level === "High"
                          ? "bg-sky-50 border-sky-200 text-sky-700"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      {item.label} {item.text}
                    </div>
                  ))}
                </div> */}

                {/* {undeterminedRuleCount > 0 && (
                  <p className="m-0 text-xs text-amber-700">
                    ข้อมูลไม่เพียงพอสำหรับตรวจสอบรูปแบบบางกฎ ({undeterminedRuleCount} กฎ)
                  </p>
                )} */}
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
              {/* <p className="text-white/90 text-[11.5px] mt-1">
                {selectedProvince} · เดือน{thaiMonthNames[selectedMonth]}
              </p> */}
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
          {/* <div className="p-5 bg-slate-50 border-t border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2">
              <EmojiObjectsIcon className="text-amber-500" fontSize="small" />
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                สรุปผล
              </h4>
            </div>
            <div className="text-xs font-bold leading-relaxed">
              {summaryBox}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
