"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
import { classifyFloodRisk } from "@/lib/rainlevel";
import {ASSESSMENT_HISTORICAL_ONLY,LAST_REAL_YEAR, METHOD_MODEL,REAL_DATA_YEARS,SEARCH_FIELDS,SEARCH_LABELS,asArray,
  buildCurrentLevels,describeSearchBehaviorSummary,didFloodHappen,filterRulesByConfidence,formatCountOrDash,formatThaiDate,
  getAllYears,getFloodEvents,getMatchingRules,getMonitoringLevelInfo,getMonthRow,getRulesForProvinceMonth,hasNodeWithGroupAndId,joinThaiList,
  nodeColorOf,predictFlood,thaiMonthNames,translateWord,translateWordList,} from "@/lib/flood-monitoring";

const TOP_RULES_LIMIT = 10;
const NODE_RADIUS_PX = 20;
const NODE_LABEL_GAP_PX = 6;
const EMPTY_BOUNDARIES = { lastSelectableYear: LAST_REAL_YEAR };

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

export default function FloodSearchPatterns({
  initialProvince = "ขอนแก่น",
  initialData = [],
  initialRules = [],
  initialFloodEvents = [],
  boundaries = EMPTY_BOUNDARIES,
}) {
  const [isClient, setIsClient] = useState(false);
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
  }, [boundaries.lastSelectableYear]);

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
      if (provinceOptions[i].name.includes(q)) {
        result.push(provinceOptions[i]);
      }
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
      if (data[i].year && !years.includes(y)) {
        years.push(y);
      }
    }

    const filteredYears = [];
    for (let i = 0; i < years.length; i++) {
      if (years[i] >= REAL_DATA_YEARS[0] && years[i] <= boundaries.lastSelectableYear) {
        filteredYears.push(years[i]);
      }
    }

    filteredYears.sort((a, b) => b - a);
    return filteredYears;
  }, [data, baseYears, boundaries]);

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
  const ruleCountInfo = { total: activeRules.length, shown: visibleRules.length };
  const graphRef = useRef(null);

const graphData = useMemo(() => {
  const rulesForGraph = filterRulesByConfidence(activeRules, confidenceThreshold);
  rulesForGraph.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  const uniqueRules = [];
  const seenRules = new Set();

  for (let i = 0; i < rulesForGraph.length; i++) {
    const rule = rulesForGraph[i];
    const antecedents = [...asArray(rule.antecedents)].sort();
    const consequents = [...asArray(rule.consequents)].sort();
    const ruleKey = JSON.stringify([antecedents, consequents]);

    if (!seenRules.has(ruleKey)) {
      seenRules.add(ruleKey);
      uniqueRules.push(rule);
    }
  }

  const topRules = uniqueRules.slice(0, TOP_RULES_LIMIT);
  const nodesById = {};
  const nodeOrder = [];
  const links = [];

  for (let i = 0; i < topRules.length; i++) {
    const rule = topRules[i];
    const antecedents = asArray(rule.antecedents);
    const consequents = asArray(rule.consequents);

    for (let j = 0; j < antecedents.length; j++) {
      const antWord = antecedents[j];
      const antId = "antecedent|" + antWord;

      if (!nodesById[antId]) {
        nodesById[antId] = {
          id: antId, label: translateWord(antWord),
          rawId: antWord, group: "cause", val: 3,
        };
        nodeOrder.push(antId);
      }

      for (let k = 0; k < consequents.length; k++) {
        const conWord = consequents[k];
        const conId = "consequent|" + conWord;

        if (!nodesById[conId]) {
          nodesById[conId] = {
            id: conId, label: translateWord(conWord),
            rawId: conWord, group: "effect", val: 3,
          };
          nodeOrder.push(conId);
        }

        if (antWord !== conWord) {
          links.push({ source: antId, target: conId });
        }
      }
    }
  }

  const nodes = [];
  for (let i = 0; i < nodeOrder.length; i++) {
    nodes.push(nodesById[nodeOrder[i]]);
  }

  return { nodes, links };
}, [activeRules, confidenceThreshold]);

  useEffect(() => {
    const fg = graphRef.current;
    if (!fg || typeof fg.d3Force !== "function") return;

    const charge = fg.d3Force("charge");
    if (charge) charge.strength(-320);

    const link = fg.d3Force("link");
    if (link) link.distance(110);

    if (typeof fg.d3ReheatSimulation === "function") {
      fg.d3ReheatSimulation();
    }
  }, [graphData]);

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
      province: selectedProvince, month: selectedMonth, years,
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
      if (filteredProvinces[i].region === region) {
        namesInRegion.push(filteredProvinces[i].name);
      }
    }

    if (namesInRegion.length > 0) {
      const optionEls = [];
      for (let i = 0; i < namesInRegion.length; i++) {
        optionEls.push(<option key={namesInRegion[i]} value={namesInRegion[i]}>{namesInRegion[i]}</option>);
      }

      provinceOptgroups.push(
        <optgroup key={region} label={region}>{optionEls}</optgroup>
      );
    }
  }

  const yearOptionElements = [];
  for (let i = 0; i < allYears.length; i++) {
    const year = allYears[i];
    let suffix = "";
    if (!REAL_DATA_YEARS.includes(year)) suffix = " (เฝ้าระวัง)";

    yearOptionElements.push(
      <option key={year} value={year}>พ.ศ. {year + 543}{suffix}</option>
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

  const isHistoricalOnly = isForecastYear && prediction.assessmentType === ASSESSMENT_HISTORICAL_ONLY;
  const riskLevel = isForecastYear
    ? getMonitoringLevelInfo(isHistoricalOnly ? prediction.historicalLevel : prediction.monitoringLevel)
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
    let colorClass = "text-emerald-600";
    let statusText = "ไม่เกิดอุทกภัย";

    if (matchedRealEvent) {
      colorClass = "text-orange-600";
      statusText = "เกิดอุทกภัย";
    }

    predictionValueBlock = (
      <span className={`text-3xl font-black ${colorClass}`}>{statusText}</span>
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
    causeLegendText = "มีปริมาณน้ำฝนสูง พร้อมมีการค้นหาคำเหล่านี้";
  } else {
    causeLegendText = "มีการค้นหาคำเหล่านี้";
  }

  let effectLegendText;
  if (hasNodeWithGroupAndId(graphData.nodes, "effect", "rain_level_High")) {
    effectLegendText = "มักพบปริมาณน้ำฝนสูงในเดือนเดียวกัน";
  } else {
    effectLegendText = "มักพบการค้นหาคำนี้ในเดือนเดียวกัน";
  }

  const rainTier = avgRain != null ? classifyFloodRisk(avgRain) : null;

  let rainStatusText;
  if (avgRain == null) {
    rainStatusText = "ไม่มีข้อมูลปริมาณน้ำฝนเดือนนี้";
  } else {
    rainStatusText = rainTier.label;
  }

  const targetHighFields = [];
  for (let i = 0; i < SEARCH_FIELDS.length; i++) {
    if (currentLevels[SEARCH_FIELDS[i]] === "High") {
      targetHighFields.push(SEARCH_FIELDS[i]);
    }
  }

  const showSearchPatternSection = activeRules.length > 0 || targetHighFields.length > 0;

  let patternGridClass = "grid grid-cols-1 gap-6 items-stretch";
  if (showSearchPatternSection) {
    patternGridClass = "grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch";
  }

  function buildRuleCards() {
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
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">กฎที่ตรงกับข้อมูลจริง</span>
            <div className="flex flex-wrap gap-2">{antecedentTags}</div>
          </div>
          <div className="flex items-center gap-2">
            <ArrowBackIcon className="text-slate-300 rotate-[-90deg]" fontSize="small" />
            <div className="flex flex-wrap gap-2">{consequentTags}</div>
            <span className="text-xs font-bold text-green-600 ml-auto shrink-0">
              {Math.round((rule.confidence || 0) * 100)}%
            </span>
          </div>
        </div>
      );
    }

    return cards;
  }

  let ruleListSection;
  if (visibleRules.length > 0) {
    ruleListSection = <div className="divide-y divide-slate-100">{buildRuleCards()}</div>;
  } else {
    let emptyMessage = "ไม่พบกฎที่ผ่านเกณฑ์ความสอดคล้องที่เลือกไว้";

    if (activeRules.length === 0) {
      if (isForecastYear) {
        emptyMessage = "ไม่พบกฎที่ตรงกับข้อมูลจริงในเดือนนี้";
      } else {
        emptyMessage = "ไม่พบกฎความสัมพันธ์ของคำค้นหาในเดือนนี้";
      }
    }

    if (isForecastYear) {
      ruleListSection = (
        <div className="w-full min-h-[250px] p-8 flex flex-col items-center justify-center gap-3 text-center">
          <TimelineIcon className="text-slate-200" sx={{ fontSize: 40 }} />
          <p className="text-slate-500 font-bold text-sm">{emptyMessage}</p>
        </div>
      );
    } else {
      ruleListSection = (
        <div className="p-8 flex flex-col items-center justify-center gap-3 text-center">
          <HubIcon className="text-slate-200" sx={{ fontSize: 40 }} />
          <p className="text-slate-500 font-bold text-sm">{emptyMessage}</p>
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
        <td className="px-4 py-3 font-bold text-slate-800 text-[13px]">{dateText}</td>
        <td className="px-4 py-3 text-center font-bold text-sky-700 text-[13px]">{affectedText}</td>
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

  const selectedMonthText = `เดือน${thaiMonthNames[selectedMonth]} พ.ศ. ${parseInt(selectedYear) + 543}`;

  let historyRatioText;
  if (floodHistory.total === 0) {
    historyRatioText = "ไม่มีข้อมูลเหตุการณ์ย้อนหลังเพียงพอ";
  } else if (floodHistory.count === 0) {
    historyRatioText = `เดือนเดียวกันนี้ไม่เคยเกิดอุทกภัยในรอบ ${floodHistory.total} ปี`;
  } else {
    historyRatioText = `เดือนเดียวกันนี้เคยเกิดอุทกภัย ${floodHistory.count} จาก ${floodHistory.total} ปี`;
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

  const searchBehaviorSummaryText = describeSearchBehaviorSummary(targetHighFields);
  const summaryCardClass = "bg-sky-50 border-sky-200";

  let summaryDetail = "";
  let summaryMethodologyText = "";

  if (!isForecastYear) {
    if (matchedRealEvent) {
      summaryDetail =
        `${selectedMonthText} มีรายงานการเกิดอุทกภัย ` +
        `โดย${historyRatioText}`;
    } else {
      summaryDetail =
        `${selectedMonthText} ไม่พบรายงานการเกิดอุทกภัยในข้อมูลที่รวบรวมไว้ ` +
        `โดย${historyRatioText} และ${rainStatusText}`;
    }
  } else if (!riskLevel) {
    summaryMethodologyText = "";
  } else {
    const monthName = thaiMonthNames[selectedMonth];
    const studyYearRange = `(พ.ศ. ${REAL_DATA_YEARS[0] + 543}–${LAST_REAL_YEAR + 543})`;

    let provinceNamePart;
    if (selectedProvince === "กรุงเทพมหานคร") {
      provinceNamePart = selectedProvince;
    } else {
      provinceNamePart = `จังหวัด${selectedProvince}`;
    }

    let historyClause;
    if (floodHistory.count === 0) {
      historyClause = `ไม่มีรายงานอุทกภัยในเดือน${monthName}ในช่วง ${floodHistory.total} ปีที่ศึกษา ${studyYearRange}`;
    } else if (floodHistory.count === floodHistory.total) {
      historyClause = `มีรายงานอุทกภัยในเดือน${monthName}ครบทั้ง ${floodHistory.total} ปีที่ศึกษา ${studyYearRange}`;
    } else {
      historyClause = `มีรายงานอุทกภัยในเดือน${monthName} ${floodHistory.count} จาก ${floodHistory.total} ปีที่ศึกษา ${studyYearRange}`;
    }

    let levelClause;
    if (riskLevel.key === "low") {
      levelClause = "จึงอยู่ในสถานการณ์ปกติ";
    } else {
      levelClause = `จึงจัดอยู่ในระดับ${riskLevel.label}`;
    }

    let searchClause;
    let judgementLead;

    if (isHistoricalOnly) {
      searchClause = " แต่ยังไม่มีข้อมูลการค้นหาจาก Google Trends ของเดือนที่เลือก";
      judgementLead = "เมื่อพิจารณาจากประวัติอุทกภัยเพียงอย่างเดียว";
    } else {
      judgementLead = "เมื่อพิจารณาประวัติอุทกภัยร่วมกับข้อมูลการค้นหา";

      if (targetHighFields.length > 0) {
        const foundWords = [];
        for (let i = 0; i < targetHighFields.length; i++) {
          foundWords.push(`“${SEARCH_LABELS[targetHighFields[i]]}”`);
        }
        searchClause = ` และในเดือนที่เลือกพบการค้นหาคำว่า ${joinThaiList(foundWords)} จาก Google Trends`;
      } else {
        searchClause = " และในเดือนที่เลือกไม่พบการค้นหาที่ถึงเกณฑ์จาก Google Trends";
      }
    }

    summaryMethodologyText = `${provinceNamePart}${historyClause}${searchClause} ${judgementLead} ${levelClause}`;

    if (activeRules.length > 0) {
      summaryMethodologyText += " โดยพบกฎความสัมพันธ์จากการวิเคราะห์ข้อมูลย้อนหลังที่ตรงกับเงื่อนไขของข้อมูลจังหวัดและเดือนปีที่เลือก";
    }
  }

  const adviceBulletItems = [];
  if (riskLevel && riskLevel.advice) {
    for (let i = 0; i < riskLevel.advice.bullets.length; i++) {
      adviceBulletItems.push(
        <li key={i} className="flex gap-2 text-[15px] font-semibold leading-relaxed text-slate-700">
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
      <option key={district.name} value={district.name}>{districtLabel}{district.name}</option>
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
                    title="ล้างการค้นหา"
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
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
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
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
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
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {searchQuery !== "" && (
            <p className="text-[11px] font-bold text-slate-400 mt-3 pl-2">{searchHintText}</p>
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
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">{predictionCardTitle}</p>
          <div className="flex items-baseline gap-1">{predictionValueBlock}</div>
          {predictionCardSubtitle && (
            <p className="text-[11px] text-slate-400/70 font-bold mt-1">{predictionCardSubtitle}</p>
          )}
        </div>

        <div className="px-5 py-4 rounded-2xl border-2 bg-purple-50 border-purple-200 shadow-sm">
          <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">ปริมาณน้ำฝนประจำเดือน</p>
          <div className="flex items-baseline gap-1">{rainValueBlock}</div>
          <p className="text-[11px] text-slate-400/70 font-bold mt-1">{rainStatusText}</p>
        </div>
      </div>

      <div className={`p-6 rounded-2xl border-2 shadow-sm ${summaryCardClass}`}>
        <p className="mb-1 flex items-center gap-1.5 text-m font-bold uppercase tracking-wider text-slate-500">
          <EmojiObjectsIcon className="text-amber-500" fontSize="medium" />
          สรุปผล
        </p>

        {isForecastYear ? (
          <div className="mt-1 flex flex-col divide-y divide-slate-200/70">
            {summaryMethodologyText && (
              <p className="m-0 py-4 text-[15px] font-semibold leading-relaxed text-slate-700">{summaryMethodologyText}</p>
            )}

            {riskLevel?.advice && (riskLevel.key === "medium" || riskLevel.key === "high") && (
              <div className="pt-4 flex flex-col gap-3">
                <p className="m-0 text-[15px] font-black text-slate-800">
                  แนวทางเตรียมความพร้อม: {riskLevel.advice.title}
                </p>
                <ul className="m-0 flex list-none flex-col gap-1.5 pl-0">{adviceBulletItems}</ul>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-[15px] font-semibold leading-relaxed text-slate-600">{summaryDetail}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-slate-500 shadow-sm text-white flex">
            <PlaceIcon fontSize="small" />
          </div>
          <div>
            <h3 className="text-slate-800 font-bold tracking-tight leading-none text-base">{areaCardTitle}</h3>
          </div>
        </div>

        <div className="p-5">
          {reportedAreas.hasAreaDetail ? (
            <div className="flex flex-col gap-3">
              <p className="m-0 text-xs text-slate-500">
                พบ {reportedAreas.districts.length} {districtLabel}ที่เคยมีรายงาน
              </p>

              <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200">
                <FloodAreaMapView districts={reportedAreas.districts} province={selectedProvince} />
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
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
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
                เผยแพร่ผ่าน{" "}
                <a
                  href="https://gistdaportal.gistda.or.th/portal/home/item.html?id=a9e042bb191a43a9994e469ada3fa66e"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-slate-600"
                >
                  GISTDA
                </a>
                {" · "}DGA Open Government License
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

      <div className={patternGridClass}>
        {showSearchPatternSection && (
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
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{causeLegendText}</span>
                  </div>
                  <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{effectLegendText}</span>
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
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    ข้อมูลการค้นหาในเดือน{thaiMonthNames[selectedMonth]} {parseInt(selectedYear) + 543}
                  </span>
                  {targetHighFields.length === 0 ? (
                    <p className="m-0 text-sm font-semibold leading-relaxed text-slate-600">ไม่มีคำค้นหา</p>
                  ) : (
                    <p className="m-0 text-sm font-semibold leading-relaxed text-slate-700">{searchBehaviorSummaryText}</p>
                  )}
                </div>
              )}
            </div>

            {graphData.nodes.length > 0 && (
              <div className="border-b border-slate-100 h-[340px] bg-[#fafcff] flex justify-center items-center relative overflow-hidden">
                <div className="cursor-grab active:cursor-grabbing w-full flex justify-center items-center">
                  <ForceGraph2D
                    ref={graphRef}
                    graphData={graphData}
                    nodeColor={nodeColorOf}
                    nodeVal="val"
                    linkDirectionalParticles={2}
                    linkDirectionalArrowLength={4}
                    linkDirectionalArrowRelPos={0.92}
                    linkColor={() => "#CBD5E1"}
                    height={340}
                    onEngineStop={() => {
                      const fg = graphRef.current;
                      if (fg && typeof fg.zoomToFit === "function") {
                        fg.zoomToFit(400, 55);
                      }
                    }}
                    nodeCanvasObject={(node, ctx, globalScale) => {
                      const label = node.label;
                      const fontSize = 12 / globalScale;
                      const radius = NODE_RADIUS_PX / globalScale;
                      ctx.font = `${fontSize}px Arial`;
                      ctx.textAlign = "center";

                      const padX = 4 / globalScale;
                      const padY = 2.5 / globalScale;
                      const textWidth = ctx.measureText(label).width;
                      const boxY = node.y + radius + NODE_LABEL_GAP_PX / globalScale;

                      ctx.fillStyle = "rgba(250,252,255,0.88)";
                      ctx.fillRect(
                        node.x - textWidth / 2 - padX,
                        boxY,
                        textWidth + padX * 2,
                        fontSize + padY * 2
                      );

                      ctx.textBaseline = "top";
                      ctx.fillStyle = "#334155";
                      ctx.fillText(label, node.x, boxY + padY);
                      ctx.textBaseline = "alphabetic";
                      ctx.beginPath();
                      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
                      ctx.fillStyle = nodeColorOf(node);
                      ctx.fill();
                    }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 px-5 py-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  เกณฑ์ขั้นต่ำในการคัดกรองกฎความสัมพันธ์
                </label>
                <span className="text-[11px] font-bold text-slate-400">
                  {ruleCountInfo.shown}/{ruleCountInfo.total} กฎ
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

            <div className="flex-1 overflow-y-auto max-h-[350px]">{ruleListSection}</div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 bg-sky-700 flex items-center gap-3">
            <div className="p-1.5 bg-black/10 rounded-lg text-white flex items-center justify-center">
              <ReportIcon fontSize="small" />
            </div>
            <div>
              <h3 className="text-white font-bold tracking-tight text-base leading-none">
                เหตุการณ์อุทกภัยจริงที่เคยเกิดขึ้น{" "}
                {isForecastYear
                  ? `(อ้างอิงอดีต พ.ศ. ${REAL_DATA_YEARS[0] + 543}–${LAST_REAL_YEAR + 543})`
                  : `(พ.ศ. ${parseInt(selectedYear) + 543})`}
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
                  <tbody className="divide-y divide-white/50 bg-[#fffdf0]">{realEventRows}</tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 flex flex-col items-center justify-center gap-3 bg-white h-full text-center">
                <div className="p-4 bg-slate-100 rounded-full border border-slate-200 text-slate-400">
                  <WaterDropIcon fontSize="large" />
                </div>
                <p className="text-slate-500 font-bold text-sm">{noEventText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
