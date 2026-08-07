"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { CircularProgress } from "@mui/material";
import dynamic from "next/dynamic";
import { BarChart } from "@mui/x-charts/BarChart";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TuneIcon from "@mui/icons-material/Tune";
import HubIcon from "@mui/icons-material/Hub";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import ReportIcon from "@mui/icons-material/Report";
import VerifiedIcon from "@mui/icons-material/Verified";
import FloodSearchAnalysisPanel from "@/components/FloodSearchAnalysisPanel";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="h-[390px] flex items-center justify-center">
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

function getThaiSeason(q) {
  if (!q || !q.includes("_")) return q || "";
  const parts = q.split("_");
  const year = parts[0];
  const season = parts[1];
  const map = {
    Summer: "ฤดูร้อน (มีนาคม – พฤษภาคม)",
    Rainy: "ฤดูฝน (มิถุนายน – ตุลาคม)",
    Winter: "ฤดูหนาว (พฤศจิกายน – กุมภาพันธ์)",
  };
  let seasonText = map[season];
  if (!seasonText) seasonText = season;
  return `พ.ศ. ${parseInt(year) + 543} ${seasonText}`;
}

function getMonthsForSeason(q) {
  if (!q || !q.includes("_")) return [];
  const season = q.split("_")[1];
  const map = {
    Summer: ["มี.ค.", "เม.ย.", "พ.ค."],
    Rainy: ["มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค."],
    Winter: ["พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ."],
  };
  const result = map[season];
  if (result) return result;
  return [];
}

function translateWord(word) {
  const dict = {
    Rain_Heavy: "ฝนตกหนัก",
    Search_ฝนตกหนัก: "ค้นหา 'ฝนตกหนัก'",
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

function joinTranslatedWords(words) {
  let result = "";
  for (let i = 0; i < words.length; i++) {
    if (i > 0) result += " + ";
    result += translateWord(words[i]);
  }
  return result;
}

function getSeasonMonths(season) {
  const map = {
    Summer: [3, 4, 5],
    Rainy: [6, 7, 8, 9, 10],
    Winter: [11, 12, 1, 2],
  };
  const result = map[season];
  if (result) return result;
  return [];
}

function compareRulesByConfidenceThenLift(a, b) {
  if (b.confidence !== a.confidence) {
    return b.confidence - a.confidence;
  }
  return b.lift - a.lift;
}

function UnifiedInsightNote({ hasData, totalAffected, hasPartialGap, isLegacyYear }) {
  if (hasData && !hasPartialGap) {
    return (
      <div className="flex gap-3 items-start px-4 py-3 rounded-lg bg-green-50 border border-green-200 border-l-[3px] border-l-green-500">
        <VerifiedIcon className="text-[16px] text-green-500 mt-1 shrink-0" />
        <div className="text-sm text-green-800 leading-[1.8]">
          <span className="font-bold">สรุปผลการวิเคราะห์: </span>
          จากสถิติการเกิดอุทกภัยข้างต้น
          สามารถระบุได้ว่าพฤติกรรมการค้นหามีความสอดคล้องกับเหตุการณ์ที่เกิดขึ้นจริงในพื้นที่
          <br />
          ซึ่งเป็นตัวบ่งชี้ว่าความกังวลของประชาชนมีความสัมพันธ์โดยตรงกับสถานการณ์จริง
        </div>
      </div>
    );
  }

  let headerText;
  if (hasData) {
    headerText = "หมายเหตุ: บางเดือนมีฝนตกหนักแต่ไม่มีสถิติ ปภ.";
  } else {
    headerText = "หมายเหตุ: ทำไมยอดค้นหาสูงแต่ไม่มีสถิติ ปภ.?";
  }

  let bodyIntroText;
  if (hasData) {
    bodyIntroText = "บางช่วงที่ฝนตกหนักแต่ไม่มีรายงาน ปภ. ไม่ได้แปลว่าข้อมูลผิดพลาด — มักเกิดจาก:";
  } else {
    bodyIntroText = "ยอดค้นหาสูงโดยไม่มีรายงาน ปภ. ไม่ได้แปลว่าข้อมูลผิดพลาด — มักเกิดจาก:";
  }

  const reasonItems = [
    { label: "การเตรียมรับมือล่วงหน้า เช่น ค้นหาก่อนพายุเข้า" },
    { label: "น้ำท่วมขังระยะสั้น ยังไม่ถึงเกณฑ์ที่ ปภ. ต้องรายงานต่ำกว่าเกณฑ์รายงาน" },
    { label: "การติดตามข่าวพื้นที่อื่น ค้นหาข่าวน้ำท่วมของจังหวัดใกล้เคียงในช่วงเวลาเดียวกัน" },
  ];
  const reasonRows = [];
  for (let i = 0; i < reasonItems.length; i++) {
    const item = reasonItems[i];
    reasonRows.push(
      <div key={item.label} className="flex items-start gap-3 px-3 py-2 rounded-lg bg-[#fafcff] border border-slate-100">
        <div className="text-sm leading-none mt-[2px] shrink-0"></div>
        <div className="flex gap-1 flex-wrap items-baseline">
          <span className="text-[0.8rem] font-bold text-slate-700">
            {item.label}
          </span>
          <span className="text-[0.78rem] text-slate-400"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
        <div className="text-base leading-none">💡</div>
        <div className="text-[0.82rem] font-bold text-slate-600">
          {headerText}
        </div>
      </div>

      <div className="bg-white p-5">
        {hasData && (
          <div className="flex gap-3 mb-5">
            <VerifiedIcon className="text-[16px] text-green-500 mt-[2px] shrink-0" />
            <div className="text-sm text-slate-700 leading-[1.8]">
              ในเดือนที่มีสถิติ พบเหตุการณ์อุทกภัยจริง
              {!isLegacyYear && (
                <>
                  {" "}
                  มีผู้ได้รับผลกระทบรวม{" "}
                  <span className="font-bold text-sky-700">
                    {totalAffected.toLocaleString()} คน
                  </span>
                </>
              )}{" "}
              — ยืนยันว่าพฤติกรรมการค้นหาสะท้อนสถานการณ์จริงในบางช่วง
            </div>
          </div>
        )}

        <div className="text-sm text-slate-500 mb-4 leading-[1.7]">
          {bodyIntroText}
        </div>

        <div className="flex flex-col gap-2 w-full">
          {reasonRows}
        </div>
      </div>
    </div>
  );
}

export default function RainfallImpactPanel({ initialData = [], initialRules = [] }) {
  const fgRef = useRef(null);

  const [isClient, setIsClient] = useState(false);
  const [viewMode, setViewMode] = useState("analysis");

  const data = initialData;
  const rulesArray = Array.isArray(initialRules) ? initialRules : [];

  const [selectedProvince, setSelectedProvince] = useState("ขอนแก่น");
  const [selectedYear, setSelectedYear] = useState("2020");
  const [selectedQuarter, setSelectedQuarter] = useState("Rainy");
  const [activeSeason, setActiveSeason] = useState("2020_Rainy");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const allProvinces = useMemo(() => {
    const provinceList = Object.keys(provinceRegions);
    provinceList.sort();
    return provinceList;
  }, []);

  const provinceOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < allProvinces.length; i++) {
      const pName = allProvinces[i];
      const pRegion = provinceRegions[pName];
      options.push({ name: pName, region: pRegion });
    }

    options.sort((a, b) => {
      const aIndex = regionOrder.indexOf(a.region);
      const bIndex = regionOrder.indexOf(b.region);
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.name.localeCompare(b.name);
    });
    return options;
  }, [allProvinces]);

  const allSeasons = useMemo(() => {
    const seasonsList = [];
    for (let i = 0; i < rulesArray.length; i++) {
      const ruleSeason = rulesArray[i].Season;
      if (ruleSeason && !seasonsList.includes(ruleSeason)) {
        const year = ruleSeason.split("_")[0];
        if (year !== "2017" && year !== "2560") {
          seasonsList.push(ruleSeason);
        }
      }
    }
    seasonsList.sort();
    seasonsList.reverse();
    return seasonsList;
  }, [rulesArray]);

  useEffect(() => {
    if (allSeasons.length > 0 && isClient) {
      const first = allSeasons[0];
      const year = first.split("_")[0];
      const quarter = first.split("_")[1];
      setSelectedYear(year);
      setSelectedQuarter(quarter);
      setActiveSeason(first);
    }
  }, [allSeasons, isClient]);

  useEffect(() => {
    setActiveSeason(`${selectedYear}_${selectedQuarter}`);
  }, [selectedYear, selectedQuarter]);

  const isLegacyYear = useMemo(() => {
    const yearNum = parseInt(selectedYear);
    return yearNum >= 2020 && yearNum <= 2022;
  }, [selectedYear]);

  const rainfallData = useMemo(() => {
    if (!activeSeason || !data || data.length === 0) return [];

    const targetYear = parseInt(selectedYear);
    const targetSeason = selectedQuarter;
    const targetMonths = getSeasonMonths(targetSeason);

    const rainSum = new Array(targetMonths.length).fill(0);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row.province !== selectedProvince) continue;

      const rowYear = parseInt(row.year);
      const rowMonth = parseInt(row.month);

      let isMatch = false;
      if (targetSeason === "Winter") {
        if (rowMonth === 11 || rowMonth === 12) {
          isMatch = rowYear === targetYear;
        } else if (rowMonth === 1 || rowMonth === 2) {
          isMatch = rowYear === targetYear + 1;
        }
      } else {
        isMatch = rowYear === targetYear;
      }

      if (isMatch) {
        const index = targetMonths.indexOf(rowMonth);
        if (index !== -1) {
          rainSum[index] += parseFloat(row.average_rain) || 0;
        }
      }
    }

    const rounded = [];
    for (let i = 0; i < rainSum.length; i++) {
      rounded.push(Math.round(rainSum[i]));
    }
    return rounded;
  }, [data, selectedProvince, selectedYear, selectedQuarter, activeSeason]);

  const floodStatsByMonth = useMemo(() => {
    if (!data || data.length === 0) return [];

    const targetYear = parseInt(selectedYear);
    const targetSeason = selectedQuarter;
    const targetMonths = getSeasonMonths(targetSeason);

    const results = [];

    for (let i = 0; i < targetMonths.length; i++) {
      const monthNum = targetMonths[i];
      let foundRow = null;

      for (let j = 0; j < data.length; j++) {
        const row = data[j];
        if (row.province === selectedProvince && parseInt(row.month) === monthNum) {
          const rowYear = parseInt(row.year);
          let isMatch = false;

          if (targetSeason === "Winter") {
            if (monthNum === 11 || monthNum === 12) {
              isMatch = rowYear === targetYear;
            } else if (monthNum === 1 || monthNum === 2) {
              isMatch = rowYear === targetYear + 1;
            }
          } else {
            isMatch = rowYear === targetYear;
          }

          if (isMatch) {
            foundRow = row;
            break;
          }
        }
      }

      if (foundRow !== null) {
        results.push({
          month: monthNum,
          monthName: thaiMonthNames[monthNum],
          affected: parseInt(foundRow.affected_people) || 0,
          evacuees: parseInt(foundRow.evacuees) || 0,
          fatalities: parseInt(foundRow.fatalities) || 0,
          rain: Math.round(parseFloat(foundRow.average_rain) || 0),
        });
      } else {
        results.push({
          month: monthNum,
          monthName: thaiMonthNames[monthNum],
          affected: 0,
          evacuees: 0,
          fatalities: 0,
          rain: 0,
        });
      }
    }
    return results;
  }, [data, selectedProvince, selectedYear, selectedQuarter]);

  const floodEventDetails = useMemo(() => {
    if (!isLegacyYear || !data || data.length === 0) return [];

    const targetYear = parseInt(selectedYear);
    const targetSeason = selectedQuarter;
    const targetMonths = getSeasonMonths(targetSeason);
    const events = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row.province !== selectedProvince) continue;

      const rowYear = parseInt(row.year);
      const rowMonth = parseInt(row.month);

      let isMatch = false;
      if (targetSeason === "Winter") {
        if (rowMonth === 11 || rowMonth === 12) {
          isMatch = rowYear === targetYear;
        } else if (rowMonth === 1 || rowMonth === 2) {
          isMatch = rowYear === targetYear + 1;
        }
      } else {
        isMatch = rowYear === targetYear;
      }

      if (isMatch && targetMonths.includes(rowMonth) && row.date) {
        events.push({
          date: row.date,
          rain: Math.round(parseFloat(row.average_rain) || 0),
          affected: parseInt(row.affected_people) || 0,
          evacuees: parseInt(row.evacuees) || 0,
          fatalities: parseInt(row.fatalities) || 0,
        });
      }
    }
    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  }, [data, selectedProvince, selectedYear, selectedQuarter, isLegacyYear]);

  let floodHasData = false;
  let hasPartialGap = false;
  let totalSeasonRain = 0;
  let totalSeasonAffected = 0;
  let totalSeasonEvacuees = 0;
  let totalSeasonFatalities = 0;

  if (isLegacyYear) {
    floodHasData = floodEventDetails.length > 0;
    for (let i = 0; i < floodEventDetails.length; i++) {
      const e = floodEventDetails[i];
      totalSeasonRain += e.rain;
      totalSeasonAffected += e.affected;
      totalSeasonEvacuees += e.evacuees;
      totalSeasonFatalities += e.fatalities;
    }
  } else {
    for (let i = 0; i < floodStatsByMonth.length; i++) {
      const m = floodStatsByMonth[i];
      if (m.affected > 0 || m.evacuees > 0 || m.fatalities > 0) {
        floodHasData = true;
      }
      if (m.rain > 150 && m.affected === 0) {
        hasPartialGap = true;
      }
      totalSeasonRain += m.rain;
      totalSeasonAffected += m.affected;
      totalSeasonEvacuees += m.evacuees;
      totalSeasonFatalities += m.fatalities;
    }
  }

  let totalRainValue = 0;
  let countRainMonth = 0;
  for (let i = 0; i < rainfallData.length; i++) {
    if (rainfallData[i] > 0) {
      totalRainValue += rainfallData[i];
      countRainMonth += 1;
    }
  }
  let avgRainfall = 0;
  if (countRainMonth > 0) {
    avgRainfall = Math.round(totalRainValue / countRainMonth);
  }

  const currentRules = useMemo(() => {
    const filteredRules = [];
    for (let i = 0; i < rulesArray.length; i++) {
      const r = rulesArray[i];
      if (r.Province === selectedProvince && r.Season === activeSeason) {
        filteredRules.push(r);
      }
    }
    filteredRules.sort((a, b) => b.lift - a.lift);
    return filteredRules;
  }, [selectedProvince, activeSeason, rulesArray]);

  const topRule = currentRules[0];

  const kpis = useMemo(() => {
    if (currentRules.length === 0) return { total: 0, maxLift: 0, avgConf: 0 };
    let sumConf = 0;
    for (let i = 0; i < currentRules.length; i++) {
      sumConf += currentRules[i].confidence;
    }
    return {
      total: currentRules.length,
      maxLift: parseFloat(currentRules[0].lift.toFixed(2)),
      avgConf: parseFloat(((sumConf / currentRules.length) * 100).toFixed(1)),
    };
  }, [currentRules]);

  const graphData = useMemo(() => {
    const nodesByLabel = {};
    const nodeOrder = [];
    const links = [];

    let maxRules;
    if (currentRules.length > 15) {
      maxRules = 15;
    } else {
      maxRules = currentRules.length;
    }

    for (let i = 0; i < maxRules; i++) {
      const rule = currentRules[i];
      for (let j = 0; j < rule.antecedents.length; j++) {
        const antLabel = translateWord(rule.antecedents[j]);
        if (!nodesByLabel[antLabel]) {
          nodesByLabel[antLabel] = { id: antLabel, group: "cause", val: 3 };
          nodeOrder.push(antLabel);
        }

        for (let k = 0; k < rule.consequents.length; k++) {
          const conLabel = translateWord(rule.consequents[k]);
          if (!nodesByLabel[conLabel]) {
            nodesByLabel[conLabel] = { id: conLabel, group: "effect", val: 3 };
            nodeOrder.push(conLabel);
          }
          links.push({ source: antLabel, target: conLabel, lift: rule.lift });
        }
      }
    }

    const nodes = [];
    for (let i = 0; i < nodeOrder.length; i++) {
      nodes.push(nodesByLabel[nodeOrder[i]]);
    }

    return { nodes, links };
  }, [currentRules]);

  const topKeyword = useMemo(() => {
    if (!data || data.length === 0 || currentRules.length > 0) return null;

    const targetYear = parseInt(selectedYear);
    const targetSeason = selectedQuarter;
    const targetMonths = getSeasonMonths(targetSeason);
    const seasonRows = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row.province !== selectedProvince) continue;

      const rowMonth = parseInt(row.month);
      const rowYear = parseInt(row.year);

      if (targetMonths.includes(rowMonth)) {
        let isMatch = false;
        if (targetSeason === "Winter") {
          if (rowMonth === 11 || rowMonth === 12) {
            isMatch = rowYear === targetYear;
          } else if (rowMonth === 1 || rowMonth === 2) {
            isMatch = rowYear === targetYear + 1;
          }
        } else {
          isMatch = rowYear === targetYear;
        }

        if (isMatch) seasonRows.push(row);
      }
    }

    if (seasonRows.length === 0) return null;

    let totalFlood = 0;
    let totalRain = 0;
    let totalStorm = 0;
    let totalWaterLevel = 0;
    let totalWaterSituation = 0;
    let totalEvacuate = 0;

    for (let i = 0; i < seasonRows.length; i++) {
      const row = seasonRows[i];
      totalFlood += Number(row.search_flood) || 0;
      totalRain += Number(row.search_rain) || 0;
      totalStorm += Number(row.search_storm) || 0;
      totalWaterLevel += Number(row.search_water_level) || 0;
      totalWaterSituation += Number(row.search_water_situation) || 0;
      totalEvacuate += Number(row.search_evacuate) || 0;
    }

    const keywordsList = [
      { keyword: "น้ำท่วม", score: totalFlood },
      { keyword: "ฝนตกหนัก", score: totalRain },
      { keyword: "พายุ", score: totalStorm },
      { keyword: "ระดับน้ำ", score: totalWaterLevel },
      { keyword: "สถานการณ์น้ำ", score: totalWaterSituation },
      { keyword: "อพยพ", score: totalEvacuate },
    ];

    keywordsList.sort((a, b) => b.score - a.score);

    if (keywordsList[0].score > 30) return keywordsList[0];
    return null;
  }, [data, selectedProvince, selectedYear, selectedQuarter, currentRules.length]);

  const regionToProvinceNames = {};
  const regionsInOrder = [];
  for (let i = 0; i < provinceOptions.length; i++) {
    const opt = provinceOptions[i];
    if (!regionToProvinceNames[opt.region]) {
      regionToProvinceNames[opt.region] = [];
      regionsInOrder.push(opt.region);
    }
    regionToProvinceNames[opt.region].push(opt.name);
  }
  const provinceOptgroups = [];
  for (let i = 0; i < regionsInOrder.length; i++) {
    const region = regionsInOrder[i];
    const names = regionToProvinceNames[region];
    const nameOptions = [];
    for (let j = 0; j < names.length; j++) {
      nameOptions.push(<option key={`${region}-${j}`} value={names[j]}>{names[j]}</option>);
    }
    provinceOptgroups.push(
      <optgroup key={region} label={region} className="font-bold text-sky-600">
        {nameOptions}
      </optgroup>
    );
  }

  const yearChoices = [];
  for (let i = 0; i < allSeasons.length; i++) {
    const year = allSeasons[i].split("_")[0];
    if (!yearChoices.includes(year)) yearChoices.push(year);
  }
  yearChoices.sort((a, b) => b - a);
  const yearOptionElements = [];
  for (let i = 0; i < yearChoices.length; i++) {
    const year = yearChoices[i];
    yearOptionElements.push(
      <option key={year} value={year}>พ.ศ. {parseInt(year) + 543}</option>
    );
  }

  const xAxisLabels = getMonthsForSeason(activeSeason);
  const barChartData = rainfallData.slice(0, xAxisLabels.length);

  const kpiItems = [
    { label: "จำนวนความสัมพันธ์จากเหตุการณ์ที่พบ", val: kpis.total, unit: "รูปแบบ", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
    { label: "ค่าสัมพันธ์สูงสุด (Lift)", val: kpis.maxLift, unit: "เท่า", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
    { label: "ความเชื่อมั่นเฉลี่ย (Confident)", val: kpis.avgConf, unit: "%", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
    { label: "ปริมาณน้ำฝนเฉลี่ยรายเดือน", val: avgRainfall, unit: "มม.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  ];
  const kpiCards = [];
  for (let i = 0; i < kpiItems.length; i++) {
    const item = kpiItems[i];
    kpiCards.push(
      <div key={i} className={`p-6 rounded-[2rem] border-2 ${item.bg} ${item.border} shadow-sm transition-transform duration-300`}>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
          {item.label}
        </p>
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-black ${item.color}`}>
            {item.val}
          </span>
          <span className={`text-sm font-bold opacity-70 ${item.color}`}>
            {item.unit}
          </span>
        </div>
      </div>
    );
  }

  let topRuleAntecedentText = "";
  let topRuleConsequentText = "";
  let topRuleConnectorText = " มักจะตามด้วยการสืบค้น";
  if (topRule) {
    topRuleAntecedentText = joinTranslatedWords(topRule.antecedents);
    topRuleConsequentText = joinTranslatedWords(topRule.consequents);
    if (topRule.consequents.includes("Rain_Heavy") || topRuleConsequentText === "ฝนตกหนัก") {
      topRuleConnectorText = " มักเกิด";
    }
  }

  const topFiveRules = currentRules.slice();
  topFiveRules.sort(compareRulesByConfidenceThenLift);
  const topFiveRulesToShow = topFiveRules.slice(0, 5);
  const topFiveRuleCards = [];
  for (let i = 0; i < topFiveRulesToShow.length; i++) {
    const rule = topFiveRulesToShow[i];
    topFiveRuleCards.push(
      <div key={i} className="group p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-sky-50/50 transition-all duration-300 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
            {i + 1}
          </div>

          <span className="px-3 py-1.5 bg-white text-orange-700 rounded-xl text-xs font-bold border border-orange-100 shadow-sm">
            {joinTranslatedWords(rule.antecedents)}
          </span>

          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
            <ArrowBackIcon className="text-slate-500 rotate-180" sx={{ fontSize: 14 }} />
          </div>

          <span className="px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-200">
            {joinTranslatedWords(rule.consequents)}
          </span>
        </div>

        <div className="text-right pl-4 shrink-0 border-l border-slate-200">
          <div className="flex flex-col items-end">
            <span className="text-green-600 font-black text-lg">
              {(rule.confidence * 100).toFixed(0)}%
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              โอกาสที่จะเกิดร่วมกัน
            </span>
          </div>
        </div>
      </div>
    );
  }

  const tableRows = [];
  if (isLegacyYear) {
    for (let i = 0; i < floodEventDetails.length; i++) {
      const m = floodEventDetails[i];
      tableRows.push(
        <tr key={i} className="hover:bg-[#fff9d4]/50 transition-colors">
          <td className="px-6 py-3.5 font-bold text-slate-800 text-[13px]">
            {formatThaiDate(m.date)}
          </td>
          <td className="px-6 py-3.5 text-center font-bold text-[#2ab2f4] text-[13px]">
            {formatCountOrDash(m.affected)}
          </td>
          <td className="px-6 py-3.5 text-center font-bold text-slate-300 text-[13px]">
            {formatCountOrDash(m.evacuees)}
          </td>
          <td className="px-6 py-3.5 text-center font-bold text-slate-300 text-[13px]">
            {formatCountOrDash(m.fatalities)}
          </td>
        </tr>
      );
    }
  } else {
    for (let i = 0; i < floodStatsByMonth.length; i++) {
      const m = floodStatsByMonth[i];
      tableRows.push(
        <tr key={i} className="hover:bg-[#fff9d4]/50 transition-colors">
          <td className="px-6 py-3.5 flex items-center gap-2 font-bold text-slate-800 text-[13px]">
            {m.monthName} {parseInt(selectedYear) + 543}
            {m.affected > 0 && (
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </td>
          <td className="px-6 py-3.5 text-center font-bold text-[#2ab2f4] text-[13px]">
            {formatCountOrDash(m.affected)}
          </td>
          <td className="px-6 py-3.5 text-center font-bold text-slate-300 text-[13px]">
            {formatCountOrDash(m.evacuees)}
          </td>
          <td className="px-6 py-3.5 text-center font-bold text-slate-300 text-[13px]">
            {formatCountOrDash(m.fatalities)}
          </td>
        </tr>
      );
    }
  }

  let mainContent;
  if (viewMode === "search") {
    mainContent = (
      <FloodSearchAnalysisPanel
        province={selectedProvince}
        year={selectedYear}
        season={selectedQuarter}
        initialData={data}
        initialRules={rulesArray}
      />
    );
  } else {
    mainContent = (
      <div className="space-y-8 animate-in fade-in duration-500">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <div className="lg:col-span-5 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden flex flex-col h-[480px]">
            <div className="px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-sky-500 shadow-lg shadow-sky-500/20 text-white flex">
                <WaterDropIcon fontSize="small" />
              </div>
              <div>
                <h3 className="text-slate-800 font-bold tracking-tight leading-none text-lg">
                  ปริมาณน้ำฝน (มม.)
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">
                  {selectedProvince} · {getThaiSeason(activeSeason)}
                </p>
              </div>
            </div>

            <div className="flex-grow p-4">
              <BarChart
                xAxis={[
                  {
                    scaleType: "band",
                    data: xAxisLabels,
                    tickLabelStyle: {
                      fontSize: 12,
                      fontFamily: "Prompt, sans-serif",
                    },
                  },
                ]}
                series={[
                  {
                    data: barChartData,
                    color: "#0ea5e9",
                    valueFormatter: (v) => `${v} มม.`,
                  },
                ]}
                margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
              />
            </div>
          </div>

          <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden flex flex-col h-[480px]">
            <div className="px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-100 shadow-sm flex text-sky-600">
                  <HubIcon fontSize="small" />
                </div>
                <h3 className="text-slate-800 font-bold text-lg">
                  โครงข่ายความสัมพันธ์การสืบค้นข้อมูล
                </h3>
              </div>

              {currentRules.length > 0 && (
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                      สาเหตุ
                    </span>
                  </div>
                  <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                      ผลลัพธ์
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-grow bg-[#fafcff] relative overflow-hidden flex justify-center items-center">
              {currentRules.length > 0 ? (
                <div className="cursor-grab active:cursor-grabbing w-full h-full flex justify-center items-center">
                  <ForceGraph2D
                    ref={fgRef}
                    graphData={graphData}
                    nodeColor={(node) => {
                      if (node.group === "cause") return "#F59E0B";
                      return "#0EA5E9";
                    }}
                    nodeVal="val"
                    linkDirectionalParticles={2}
                    width={700}
                    height={390}
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
              ) : (
                <div className="flex flex-col items-center gap-4 text-slate-300">
                  <div className="p-6 bg-slate-50 rounded-full border-2 border-dashed border-slate-200 text-sky-200">
                    <HubIcon className="text-6xl opacity-30 text-slate-300" />
                  </div>
                  {topKeyword ? (
                    <div className="space-y-4 text-center">
                      <p className="text-slate-500 font-bold leading-relaxed">
                        ไม่พบความสัมพันธ์จากเหตุการณ์
                        แต่พบความสนใจโดดเด่นในคำว่า
                        <br />
                        <span className="text-2xl font-black text-amber-600 underline decoration-amber-200 underline-offset-8">
                          "{topKeyword.keyword}"
                        </span>
                      </p>
                      <div className="inline-block px-4 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">
                        ดัชนีความนิยม: {topKeyword.score}
                      </div>
                    </div>
                  ) : (
                    <p className="font-bold text-slate-400">
                      ไม่พบข้อมูลความสัมพันธ์ในช่วงเวลานี้
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {currentRules.length > 0 && topRule && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            <div className="lg:col-span-5 flex flex-col">
              <div className="flex-grow rounded-[2rem] overflow-hidden border border-orange-200 shadow-xl shadow-orange-500/5 bg-white flex flex-col">
                <div className="px-6 py-4 bg-gradient-to-br from-orange-600 to-orange-500 flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-white/20 flex text-white backdrop-blur-sm">
                    <EmojiObjectsIcon fontSize="small" />
                  </div>
                  <h3 className="text-white font-bold tracking-wide text-[15px]">
                    สรุปพฤติกรรมเด่นชัด
                  </h3>
                </div>

                <div className="p-6 lg:p-8 bg-gradient-to-b from-orange-50/50 to-white flex-grow">
                  <div className="space-y-5">
                    <p className="text-[14px] lg:text-[15px] leading-relaxed text-slate-700 font-medium">
                      ในช่วง{" "}
                      <span className="font-bold text-slate-900">
                        {getThaiSeason(activeSeason)}
                      </span>{" "}
                      ในพื้นที่จังหวัด{" "}
                      <span className="font-bold text-slate-900">
                        {selectedProvince}
                      </span>{" "}
                      พบรูปแบบความสนใจและการสืบค้นข้อมูลที่สนใจดังนี้ :
                      เมื่อมีการสืบค้น{" "}
                      <span className="font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md mx-1">
                        {topRuleAntecedentText}
                      </span>
                      {topRuleConnectorText}
                      <span className="font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-md mx-1">
                        {topRuleConsequentText}
                      </span>{" "}
                      ด้วย โดยมีโอกาสที่จะเกิดร่วมกันสูงถึง
                      <span className="text-orange-600 font-black text-xl ml-1">
                        {(topRule.confidence * 100).toFixed(1)}%
                      </span>
                    </p>

                    <p className="italic text-slate-500 text-[12px] lg:text-[13px] leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                      *ยิ่งค่าความสัมพันธ์ (Lift) มีค่ามากเท่าไหร่
                      ยิ่งยืนยันว่าพฤติกรรมเหล่านั้นมีความเกี่ยวข้องกันจริง
                      ไม่ใช่แค่เรื่องบังเอิญที่มาเจอกันในเวลาเดียวกัน
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-xl shadow-slate-900/5 h-full flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-sky-50 flex text-sky-600">
                      <ShowChartIcon fontSize="small" />
                    </div>
                    <h3 className="text-slate-800 font-bold text-[15px]">
                      5 อันดับพฤติกรรมยอดนิยม
                    </h3>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {topFiveRuleCards}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="px-5 py-4 bg-[#2ab2f4] flex items-center gap-3">
              <div className="p-1.5 bg-black/10 rounded-lg text-white flex items-center justify-center">
                <ReportIcon fontSize="small" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-tight text-[15px] leading-none">
                  สถิติการเกิดอุทกภัย (กรมป้องกันและบรรเทาสาธารณภัย)
                </h3>
                <p className="text-white/90 text-[11.5px] mt-1">
                  {selectedProvince} · {getThaiSeason(activeSeason)}
                </p>
              </div>
            </div>

            {floodHasData ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-[#2ab2f4]/30">
                    <tr>
                      <th className="px-6 py-4 text-[12.5px] font-bold text-[#1f91ce]">
                        วันที่เกิดเหตุการณ์
                      </th>
                      <th className="px-6 py-4 text-[12.5px] font-bold text-[#1f91ce] text-center w-36">
                        ผู้ได้รับผลกระทบ
                      </th>
                      <th className="px-6 py-4 text-[12.5px] font-bold text-[#1f91ce] text-center w-32">
                        ผู้อพยพ
                      </th>
                      <th className="px-6 py-4 text-[12.5px] font-bold text-[#1f91ce] text-center w-32">
                        ผู้เสียชีวิต
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/50 bg-[#fffdf0]">
                    {tableRows}
                  </tbody>

                  <tfoot className="bg-[#f2fafe] border-t border-[#2ab2f4]/30">
                    <tr>
                      <td className="px-6 py-4 font-bold text-[#1f91ce] text-[13px]">
                        รวมทั้งหมด
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-[#1f91ce] text-[14px]">
                        {formatCountOrDash(totalSeasonAffected)}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-400 text-[14px]">
                        {formatCountOrDash(totalSeasonEvacuees)}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-red-500 text-[14px] relative">
                        {formatCountOrDash(totalSeasonFatalities)}
                        <span className="absolute right-6 text-slate-600 font-bold text-[13px] mt-[1px]">
                          คน
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="p-4 bg-white border-t border-slate-100">
                  <UnifiedInsightNote
                    hasData={true}
                    totalAffected={totalSeasonAffected}
                    topRule={topRule}
                    hasPartialGap={hasPartialGap}
                    isLegacyYear={isLegacyYear}
                  />
                </div>
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center gap-8 bg-white">
                <div className="p-8 bg-sky-50 rounded-full border-2 border-dashed border-sky-200 text-sky-300">
                  <WaterDropIcon className="text-6xl" />
                </div>
                <div className="text-center max-w-md space-y-4">
                  <p className="text-slate-600 font-bold text-lg">
                    ไม่พบรายงานอุทกภัยจาก ปภ. ในช่วงเวลานี้
                  </p>
                  <UnifiedInsightNote
                    hasData={false}
                    totalAffected={0}
                    topRule={topRule}
                    hasPartialGap={false}
                    isLegacyYear={isLegacyYear}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isClient ? (
        <>
          <div className="bg-white rounded-2xl border border-sky-100 shadow-xl overflow-hidden">

            <div className="px-8 py-4 bg-gradient-to-r from-sky-500 to-sky-600 flex items-center gap-3 rounded-t-2xl">
              <div className="p-2 bg-white/20 rounded-xl text-white backdrop-blur-sm">
                <TuneIcon fontSize="small" />
              </div>
              <h3 className="text-white font-bold tracking-tight">ตัวกรองข้อมูล</h3>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">จังหวัด</label>
                <div className="flex items-center bg-sky-50 border border-sky-200 rounded-xl px-4 transition-all focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                  >
                    {provinceOptgroups}
                  </select>

                  <div className="pointer-events-none text-sky-500 ml-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">ปี พ.ศ.</label>
                <div className="flex items-center bg-sky-50 border border-sky-200 rounded-xl px-4 transition-all focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                  >
                    {yearOptionElements}
                  </select>
                  <div className="pointer-events-none text-sky-500 ml-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest pl-2">ช่วงเดือน</label>
                <div className="flex items-center bg-sky-50 border border-sky-200 rounded-xl px-4 transition-all focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                  >
                    <option value="Summer">มีนาคม - พฤษภาคม</option>
                    <option value="Rainy">มิถุนายน - ตุลาคม</option>
                    <option value="Winter">พฤศจิกายน - กุมภาพันธ์</option>
                  </select>
                  <div className="pointer-events-none text-sky-500 ml-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {mainContent}
        </>
      ) : (
        <div className="min-h-[500px] bg-transparent rounded-2xl animate-pulse flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
          <div className="text-sky-600 font-bold uppercase tracking-widest text-sm">
            กำลังโหลดข้อมูล...
          </div>
        </div>
      )}
    </div>
  );
}
