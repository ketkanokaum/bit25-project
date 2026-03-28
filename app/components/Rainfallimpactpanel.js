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
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import ReportIcon from "@mui/icons-material/Report";
import VerifiedIcon from "@mui/icons-material/Verified";
import FloodSearchAnalysisPanel from "@/app/components/FloodSearchAnalysisPanel";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="h-[390px] flex items-center justify-center">
      <CircularProgress />
    </div>
  ),
});

// ══════════════════════════════════════════════════════════════
// ── CONSTANTS & HELPER FUNCTIONS ──
// ══════════════════════════════════════════════════════════════
const provinceRegions = {
  เชียงราย: "ภาคเหนือ",
  น่าน: "ภาคเหนือ",
  พะเยา: "ภาคเหนือ",
  เชียงใหม่: "ภาคเหนือ",
  แม่ฮ่องสอน: "ภาคเหนือ",
  แพร่: "ภาคเหนือ",
  ลำปาง: "ภาคเหนือ",
  ลำพูน: "ภาคเหนือ",
  อุตรดิตถ์: "ภาคเหนือ",
  กรุงเทพมหานคร: "ภาคกลาง",
  พิษณุโลก: "ภาคกลาง",
  สุโขทัย: "ภาคกลาง",
  เพชรบูรณ์: "ภาคกลาง",
  พิจิตร: "ภาคกลาง",
  กำแพงเพชร: "ภาคกลาง",
  นครสวรรค์: "ภาคกลาง",
  ลพบุรี: "ภาคกลาง",
  ชัยนาท: "ภาคกลาง",
  อุทัยธานี: "ภาคกลาง",
  สิงห์บุรี: "ภาคกลาง",
  อ่างทอง: "ภาคกลาง",
  สระบุรี: "ภาคกลาง",
  พระนครศรีอยุธยา: "ภาคกลาง",
  สุพรรณบุรี: "ภาคกลาง",
  นครนายก: "ภาคกลาง",
  ปทุมธานี: "ภาคกลาง",
  นนทบุรี: "ภาคกลาง",
  นครปฐม: "ภาคกลาง",
  สมุทรปราการ: "ภาคกลาง",
  สมุทรสาคร: "ภาคกลาง",
  สมุทรสงคราม: "ภาคกลาง",
  หนองคาย: "ภาคตะวันออกเฉียงเหนือ",
  นครพนม: "ภาคตะวันออกเฉียงเหนือ",
  สกลนคร: "ภาคตะวันออกเฉียงเหนือ",
  อุดรธานี: "ภาคตะวันออกเฉียงเหนือ",
  หนองบัวลำภู: "ภาคตะวันออกเฉียงเหนือ",
  เลย: "ภาคตะวันออกเฉียงเหนือ",
  มุกดาหาร: "ภาคตะวันออกเฉียงเหนือ",
  กาฬสินธุ์: "ภาคตะวันออกเฉียงเหนือ",
  ขอนแก่น: "ภาคตะวันออกเฉียงเหนือ",
  อำนาจเจริญ: "ภาคตะวันออกเฉียงเหนือ",
  ยโสธร: "ภาคตะวันออกเฉียงเหนือ",
  ร้อยเอ็ด: "ภาคตะวันออกเฉียงเหนือ",
  มหาสารคาม: "ภาคตะวันออกเฉียงเหนือ",
  ชัยภูมิ: "ภาคตะวันออกเฉียงเหนือ",
  นครราชสีมา: "ภาคตะวันออกเฉียงเหนือ",
  บุรีรัมย์: "ภาคตะวันออกเฉียงเหนือ",
  สุรินทร์: "ภาคตะวันออกเฉียงเหนือ",
  ศรีสะเกษ: "ภาคตะวันออกเฉียงเหนือ",
  อุบลราชธานี: "ภาคตะวันออกเฉียงเหนือ",
  บึงกาฬ: "ภาคตะวันออกเฉียงเหนือ",
  สระแก้ว: "ภาคตะวันออก",
  ปราจีนบุรี: "ภาคตะวันออก",
  ฉะเชิงเทรา: "ภาคตะวันออก",
  ชลบุรี: "ภาคตะวันออก",
  ระยอง: "ภาคตะวันออก",
  จันทบุรี: "ภาคตะวันออก",
  ตราด: "ภาคตะวันออก",
  ตาก: "ภาคตะวันตก",
  กาญจนบุรี: "ภาคตะวันตก",
  ราชบุรี: "ภาคตะวันตก",
  เพชรบุรี: "ภาคตะวันตก",
  ประจวบคีรีขันธ์: "ภาคตะวันตก",
  ชุมพร: "ภาคใต้",
  ระนอง: "ภาคใต้",
  สุราษฎร์ธานี: "ภาคใต้",
  นครศรีธรรมราช: "ภาคใต้",
  กระบี่: "ภาคใต้",
  พังงา: "ภาคใต้",
  ภูเก็ต: "ภาคใต้",
  พัทลุง: "ภาคใต้",
  ตรัง: "ภาคใต้",
  ปัตตานี: "ภาคใต้",
  สงขลา: "ภาคใต้",
  สตูล: "ภาคใต้",
  นราธิวาส: "ภาคใต้",
  ยะลา: "ภาคใต้",
};

const regionOrder = [
  "ภาคเหนือ",
  "ภาคตะวันออกเฉียงเหนือ",
  "ภาคกลาง",
  "ภาคตะวันออก",
  "ภาคตะวันตก",
  "ภาคใต้",
];

const thaiMonthNames = {
  1: "มกราคม",
  2: "กุมภาพันธ์",
  3: "มีนาคม",
  4: "เมษายน",
  5: "พฤษภาคม",
  6: "มิถุนายน",
  7: "กรกฎาคม",
  8: "สิงหาคม",
  9: "กันยายน",
  10: "ตุลาคม",
  11: "พฤศจิกายน",
  12: "ธันวาคม",
};

const shortMonthNames = {
  1: "ม.ค.",
  2: "ก.พ.",
  3: "มี.ค.",
  4: "เม.ย.",
  5: "พ.ค.",
  6: "มิ.ย.",
  7: "ก.ค.",
  8: "ส.ค.",
  9: "ก.ย.",
  10: "ต.ค.",
  11: "พ.ย.",
  12: "ธ.ค.",
};

function formatThaiDate(dateStr) {
  const d = new Date(dateStr);
  const day = d.getUTCDate();
  const month = d.getUTCMonth() + 1;
  const year = d.getUTCFullYear() + 543;
  return `${day} ${shortMonthNames[month]} ${String(year).slice(-2)}`;
}

const getThaiSeason = (q) => {
  if (!q || !q.includes("_")) return q || "";
  const [year, season] = q.split("_");
  const map = {
    Summer: "ฤดูร้อน (มีนาคม – พฤษภาคม)",
    Rainy: "ฤดูฝน (มิถุนายน – ตุลาคม)",
    Winter: "ฤดูหนาว (พฤศจิกายน – กุมภาพันธ์)",
  };
  return `พ.ศ. ${parseInt(year) + 543} ${map[season] || season}`;
};

const getMonthsForSeason = (q) => {
  if (!q || !q.includes("_")) return [];
  const season = q.split("_")[1];
  const map = {
    Summer: ["มี.ค.", "เม.ย.", "พ.ค."],
    Rainy: ["มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค."],
    Winter: ["พ.ย.", "ธ.ค.", "ม.ค.", "ก.พ."],
  };
  return map[season] || [];
};

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

const getSeasonMonths = (season) => {
  const map = {
    Summer: [3, 4, 5],
    Rainy: [6, 7, 8, 9, 10],
    Winter: [11, 12, 1, 2],
  };
  return map[season] || [];
};

// ══════════════════════════════════════════════════════════════
// ── SUB-COMPONENTS ──
// ══════════════════════════════════════════════════════════════
function UnifiedInsightNote({
  hasData,
  totalAffected,
  topRule,
  hasPartialGap,
  isLegacyYear,
}) {
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

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
        <div className="text-base leading-none">💡</div>
        <div className="text-[0.82rem] font-bold text-slate-600">
          {hasData
            ? "หมายเหตุ: บางเดือนมีฝนตกหนักแต่ไม่มีสถิติ ปภ."
            : "หมายเหตุ: ทำไมยอดค้นหาสูงแต่ไม่มีสถิติ ปภ.?"}
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
          {hasData
            ? "บางช่วงที่ฝนตกหนักแต่ไม่มีรายงาน ปภ. ไม่ได้แปลว่าข้อมูลผิดพลาด — มักเกิดจาก:"
            : "ยอดค้นหาสูงโดยไม่มีรายงาน ปภ. ไม่ได้แปลว่าข้อมูลผิดพลาด — มักเกิดจาก:"}
        </div>

        <div className="flex flex-col gap-2 w-full">
          {[
            { label: "การเตรียมรับมือล่วงหน้า เช่น ค้นหาก่อนพายุเข้า" },
            {
              label:
                "น้ำท่วมขังระยะสั้น ยังไม่ถึงเกณฑ์ที่ ปภ. ต้องรายงานต่ำกว่าเกณฑ์รายงาน",
            },
            {
              label:
                "การติดตามข่าวพื้นที่อื่น ค้นหาข่าวน้ำท่วมของจังหวัดใกล้เคียงในช่วงเวลาเดียวกัน",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 px-3 py-2 rounded-lg bg-[#fafcff] border border-slate-100"
            >
              <div className="text-sm leading-none mt-[2px] shrink-0"></div>
              <div className="flex gap-1 flex-wrap items-baseline">
                <span className="text-[0.8rem] font-bold text-slate-700">
                  {item.label}
                </span>
                <span className="text-[0.78rem] text-slate-400"></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


export default function RainfallImpactPanel({
  initialData = [],
  initialRules = [],
}) {
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

  // ── Logic: จัดการตัวเลือกจังหวัด ──
  const allProvinces = useMemo(() => {
    let provinceList = Object.keys(provinceRegions);
    provinceList.sort();
    return provinceList;
  }, []);

  const provinceOptions = useMemo(() => {
    let options = [];
    for (let i = 0; i < allProvinces.length; i++) {
      let pName = allProvinces[i];
      let pRegion = provinceRegions[pName] || "อื่นๆ";
      options.push({ name: pName, region: pRegion });
    }

    options.sort((a, b) => {
      let aIndex = regionOrder.indexOf(a.region);
      let bIndex = regionOrder.indexOf(b.region);
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.name.localeCompare(b.name);
    });
    return options;
  }, [allProvinces]);

  // ── Logic: จัดการ ปี และ ฤดูกาล ──
  const allSeasons = useMemo(() => {
    let seasonsList = [];
    for (let i = 0; i < rulesArray.length; i++) {
      let ruleSeason = rulesArray[i].Season;
      if (ruleSeason && !seasonsList.includes(ruleSeason)) {
        seasonsList.push(ruleSeason);
      }
    }
    seasonsList.sort().reverse();
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

  // ── Logic: คำนวณปริมาณน้ำฝนตามช่วงเวลา ──
  const rainfallData = useMemo(() => {
    if (!activeSeason || !data || data.length === 0) return [];

    const targetYear = parseInt(selectedYear);
    const targetSeason = selectedQuarter;
    const targetMonths = getSeasonMonths(targetSeason);

    let rainSum = new Array(targetMonths.length).fill(0);

    for (let i = 0; i < data.length; i++) {
      let row = data[i];
      if (row.province !== selectedProvince) continue;

      let rowYear = parseInt(row.year);
      let rowMonth = parseInt(row.month);

      let isMatch = false;
      if (targetSeason === "Winter") {
        if (rowMonth === 11 || rowMonth === 12)
          isMatch = rowYear === targetYear;
        else if (rowMonth === 1 || rowMonth === 2)
          isMatch = rowYear === targetYear + 1;
      } else {
        isMatch = rowYear === targetYear;
      }

      if (isMatch) {
        let index = targetMonths.indexOf(rowMonth);
        if (index !== -1) {
          rainSum[index] += parseFloat(row.average_rain) || 0;
        }
      }
    }

    return rainSum.map((val) => Math.round(val));
  }, [data, selectedProvince, selectedYear, selectedQuarter, activeSeason]);

  // ── Logic: คำนวณสถิติอุทกภัย "รายเดือน" (สำหรับปี 66-67) ──
  const floodStatsByMonth = useMemo(() => {
    if (!data || data.length === 0) return [];

    const targetYear = parseInt(selectedYear);
    const targetSeason = selectedQuarter;
    const targetMonths = getSeasonMonths(targetSeason);

    let results = [];

    for (let i = 0; i < targetMonths.length; i++) {
      let monthNum = targetMonths[i];
      let foundRow = null;

      for (let j = 0; j < data.length; j++) {
        let row = data[j];
        if (
          row.province === selectedProvince &&
          parseInt(row.month) === monthNum
        ) {
          let rowYear = parseInt(row.year);
          let isMatch = false;

          if (targetSeason === "Winter") {
            if (monthNum === 11 || monthNum === 12)
              isMatch = rowYear === targetYear;
            else if (monthNum === 1 || monthNum === 2)
              isMatch = rowYear === targetYear + 1;
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

  // ── Logic: คำนวณสถิติอุทกภัย "รายวัน" (สำหรับปี 63-65) ──
  const floodEventDetails = useMemo(() => {
    if (!isLegacyYear || !data || data.length === 0) return [];

    const targetYear = parseInt(selectedYear);
    const targetSeason = selectedQuarter;
    const targetMonths = getSeasonMonths(targetSeason);
    let events = [];

    for (let i = 0; i < data.length; i++) {
      let row = data[i];
      if (row.province !== selectedProvince) continue;

      let rowYear = parseInt(row.year);
      let rowMonth = parseInt(row.month);

      let isMatch = false;
      if (targetSeason === "Winter") {
        if (rowMonth === 11 || rowMonth === 12)
          isMatch = rowYear === targetYear;
        else if (rowMonth === 1 || rowMonth === 2)
          isMatch = rowYear === targetYear + 1;
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

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [data, selectedProvince, selectedYear, selectedQuarter, isLegacyYear]);

  // ── Logic: ตรวจสอบสถานะการมีอยู่ของข้อมูลและผลรวม ──
  let floodHasData = false;
  let hasPartialGap = false;
  let totalSeasonRain = 0;
  let totalSeasonAffected = 0;
  let totalSeasonEvacuees = 0;
  let totalSeasonFatalities = 0;

  if (isLegacyYear) {
    floodHasData = floodEventDetails.length > 0;
    floodEventDetails.forEach((e) => {
      totalSeasonRain += e.rain;
      totalSeasonAffected += e.affected;
      totalSeasonEvacuees += e.evacuees;
      totalSeasonFatalities += e.fatalities;
    });
  } else {
    for (let i = 0; i < floodStatsByMonth.length; i++) {
      let m = floodStatsByMonth[i];
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
  let avgRainfall =
    countRainMonth > 0 ? Math.round(totalRainValue / countRainMonth) : 0;

  // ── Logic: กฎความสัมพันธ์ ──
  const currentRules = useMemo(() => {
    let filteredRules = [];
    for (let i = 0; i < rulesArray.length; i++) {
      let r = rulesArray[i];
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
    const nodesMap = new Map();
    const links = [];
    let maxRules = currentRules.length > 15 ? 15 : currentRules.length;

    for (let i = 0; i < maxRules; i++) {
      let rule = currentRules[i];
      for (let j = 0; j < rule.antecedents.length; j++) {
        let antLabel = translateWord(rule.antecedents[j]);
        if (!nodesMap.has(antLabel))
          nodesMap.set(antLabel, { id: antLabel, group: "cause", val: 3 });

        for (let k = 0; k < rule.consequents.length; k++) {
          let conLabel = translateWord(rule.consequents[k]);
          if (!nodesMap.has(conLabel))
            nodesMap.set(conLabel, { id: conLabel, group: "effect", val: 3 });
          links.push({ source: antLabel, target: conLabel, lift: rule.lift });
        }
      }
    }
    return { nodes: Array.from(nodesMap.values()), links: links };
  }, [currentRules]);

  const topKeyword = useMemo(() => {
    if (!data || data.length === 0 || currentRules.length > 0) return null;

    const targetYear = parseInt(selectedYear);
    const targetSeason = selectedQuarter;
    const targetMonths = getSeasonMonths(targetSeason);
    let seasonRows = [];

    for (let i = 0; i < data.length; i++) {
      let row = data[i];
      if (row.province !== selectedProvince) continue;

      const rowMonth = parseInt(row.month);
      const rowYear = parseInt(row.year);

      if (targetMonths.includes(rowMonth)) {
        let isMatch = false;
        if (targetSeason === "Winter") {
          if (rowMonth === 11 || rowMonth === 12)
            isMatch = rowYear === targetYear;
          else if (rowMonth === 1 || rowMonth === 2)
            isMatch = rowYear === targetYear + 1;
        } else {
          isMatch = rowYear === targetYear;
        }

        if (isMatch) seasonRows.push(row);
      }
    }

    if (seasonRows.length === 0) return null;

    let totalFlood = 0,
      totalRain = 0,
      totalStorm = 0,
      totalWaterLevel = 0,
      totalWaterSituation = 0,
      totalEvacuate = 0;

    for (let i = 0; i < seasonRows.length; i++) {
      let row = seasonRows[i];
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
    return keywordsList[0].score > 30 ? keywordsList[0] : null;
  }, [
    data,
    selectedProvince,
    selectedYear,
    selectedQuarter,
    currentRules.length,
  ]);

  return (
    <div className="space-y-6">
      {isClient ? (
        <>
          
          <div className="flex flex-wrap gap-3 justify-center md:justify-end">
            <button
              onClick={() => setViewMode("analysis")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                viewMode === "analysis"
                  ? "bg-sky-500 text-white shadow-sky-200"
                  : "bg-white text-slate-500 hover:bg-sky-50 border border-sky-100"
              }`}
            >
              <WaterDropIcon fontSize="small" /> วิเคราะห์ผลกระทบฝน
            </button>
            <button
              onClick={() => setViewMode("search")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                viewMode === "search"
                  ? "bg-sky-500 text-white shadow-sky-200"
                  : "bg-white text-slate-500 hover:bg-sky-50 border border-sky-100"
              }`}
            >
              <QueryStatsIcon fontSize="small" /> พฤติกรรมการสืบค้น
            </button>
          </div>

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
          {Array.from(new Set(provinceOptions.map((p) => p.region))).map((region) => (
            <optgroup key={region} label={region} className="font-bold text-sky-600">
              {provinceOptions.filter((p) => p.region === region).map((opt, i) => (
                <option key={`${region}-${i}`} value={opt.name}>{opt.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="pointer-events-none text-sky-500 ml-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
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
          {[...new Set(allSeasons.map((s) => s.split("_")[0]))].sort((a, b) => b - a).map((year) => (
            <option key={year} value={year}>พ.ศ. {parseInt(year) + 543}</option>
          ))}
        </select>
        <div className="pointer-events-none text-sky-500 ml-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
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
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
        </div>
      </div>
    </div>

  </div>
</div>


          {viewMode === "search" ? (
            <FloodSearchAnalysisPanel
              province={selectedProvince}
              year={selectedYear}
              season={selectedQuarter}
              initialData={data}
              initialRules={rulesArray}
            />
          ) : (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
    { label: "จำนวนความสัมพันธ์จากเหตุการณ์ที่พบ", val: kpis.total, unit: "รูปแบบ", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
    { label: "ค่าสัมพันธ์สูงสุด (Lift)", val: kpis.maxLift, unit: "เท่า", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
    { label: "ความเชื่อมั่นเฉลี่ย (Confident)", val: kpis.avgConf, unit: "%", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
    { label: "ปริมาณน้ำฝนเฉลี่ยรายเดือน", val: avgRainfall, unit: "มม.", color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" }
  ].map((item, i) => (
                  <div
                    key={i}
                    className={`p-6 rounded-[2rem] border-2 ${item.bg} ${item.border} shadow-sm transition-transform  duration-300`}
                  >
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-wider mb-2">
                      {item.label}
                    </p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-black ${item.color}`}>
                        {item.val}
                      </span>
                      <span
                        className={`text-sm font-bold opacity-70 ${item.color}`}
                      >
                        {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
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
                          data: getMonthsForSeason(activeSeason),
                          tickLabelStyle: {
                            fontSize: 12,
                            fontFamily: "Prompt, sans-serif",
                          },
                        },
                      ]}
                      series={[
                        {
                          data: rainfallData,
                          color: "#0ea5e9",
                          valueFormatter: (v) => `${v} มม.`,
                        },
                      ]}
                      margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                    />
                  </div>
                </div>

                {/* Graph Card */}
                <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-900/5 overflow-hidden flex flex-col h-[480px]">
                  <div className="px-8 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      {/* กล่องสีฟ้าอ่อน ไอคอนสีฟ้าเข้ม */}
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
                          nodeColor={(node) =>
                            node.group === "cause" ? "#F59E0B" : "#0EA5E9"
                          }
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
                            ctx.fillStyle =
                              node.group === "cause" ? "#F59E0B" : "#0EA5E9";
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
                  {/* Left Insight Card */}
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
                              {topRule.antecedents
                                .map(translateWord)
                                .join(" + ")}
                            </span>
                            {topRule.consequents.includes("Rain_Heavy") ||
                            topRule.consequents
                              .map(translateWord)
                              .join(" + ") === "ฝนตกหนัก"
                              ? " มักเกิด"
                              : " มักจะตามด้วยการสืบค้น"}
                            <span className="font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-md mx-1">
                              {topRule.consequents
                                .map(translateWord)
                                .join(" + ")}
                            </span>{" "}
                            ด้วย โดยมีความน่าจะเป็นสูงถึง
                            <span className="text-orange-600 font-black text-xl ml-1">
                              {(topRule.confidence * 100).toFixed(1)}%
                            </span>
                          </p>

                          {/* ปรับเป็นตัวเอียง สีเทา และลดขนาดลงเล็กน้อย */}
                          <p className="italic text-slate-500 text-[12px] lg:text-[13px] leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            *ยิ่งค่าความสัมพันธ์ (Lift) มีค่ามากเท่าไหร่
                            ยิ่งยืนยันว่าพฤติกรรมเหล่านั้นมีความเกี่ยวข้องกันจริง
                            ไม่ใช่แค่เรื่องบังเอิญที่มาเจอกันในเวลาเดียวกัน
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Rankings Card */}
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
                        {[...currentRules]
                          .sort((a, b) =>
                            b.confidence !== a.confidence
                              ? b.confidence - a.confidence
                              : b.lift - a.lift,
                          )
                          .slice(0, 5)
                          .slice(0, 5)
                          .map((rule, i) => (
                            <div
                              key={i}
                              className="group p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-sky-50/50  transition-all duration-300 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
                                  {i + 1}
                                </div>
                                <span className="px-3 py-1.5 bg-white text-orange-700 rounded-xl text-xs font-bold border border-orange-100 shadow-sm">
                                  {rule.antecedents
                                    .map(translateWord)
                                    .join(" + ")}
                                </span>
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                                  <ArrowBackIcon
                                    className="text-slate-500 rotate-180"
                                    sx={{ fontSize: 14 }}
                                  />
                                </div>
                                <span className="px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-200">
                                  {rule.consequents
                                    .map(translateWord)
                                    .join(" + ")}
                                </span>
                              </div>
                              <div className="text-right pl-4 shrink-0 border-l border-slate-200">
                                <div className="flex flex-col items-end">
                                  <span className="text-green-600 font-black text-lg">
                                    {(rule.confidence * 100).toFixed(0)}%
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                                    ความแม่นยำ
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Flood Stats Table Section */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Header ตาราง (สีฟ้าล้วน) */}
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
                        {/* หัวตาราง */}
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

                        {/* เนื้อหาตาราง (พื้นหลังสีเหลืองอ่อน) */}
                        <tbody className="divide-y divide-white/50 bg-[#fffdf0]">
                          {isLegacyYear
                            ? floodEventDetails.map((m, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-[#fff9d4]/50 transition-colors"
                                >
                                  <td className="px-6 py-3.5 font-bold text-slate-800 text-[13px]">
                                    {formatThaiDate(m.date)}
                                  </td>
                                  <td className="px-6 py-3.5 text-center font-bold text-[#2ab2f4] text-[13px]">
                                    {m.affected > 0
                                      ? m.affected.toLocaleString()
                                      : "-"}
                                  </td>
                                  <td className="px-6 py-3.5 text-center font-bold text-slate-300 text-[13px]">
                                    {m.evacuees > 0
                                      ? m.evacuees.toLocaleString()
                                      : "-"}
                                  </td>
                                  <td className="px-6 py-3.5 text-center font-bold text-slate-300 text-[13px]">
                                    {m.fatalities > 0
                                      ? m.fatalities.toLocaleString()
                                      : "-"}
                                  </td>
                                </tr>
                              ))
                            : floodStatsByMonth.map((m, idx) => (
                                <tr
                                  key={idx}
                                  className={`hover:bg-[#fff9d4]/50 transition-colors`}
                                >
                                  <td className="px-6 py-3.5 flex items-center gap-2 font-bold text-slate-800 text-[13px]">
                                    {m.monthName} {parseInt(selectedYear) + 543}
                                    {m.affected > 0 && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    )}
                                  </td>
                                  <td className="px-6 py-3.5 text-center font-bold text-[#2ab2f4] text-[13px]">
                                    {m.affected > 0
                                      ? m.affected.toLocaleString()
                                      : "-"}
                                  </td>
                                  <td className="px-6 py-3.5 text-center font-bold text-slate-300 text-[13px]">
                                    {m.evacuees > 0
                                      ? m.evacuees.toLocaleString()
                                      : "-"}
                                  </td>
                                  <td className="px-6 py-3.5 text-center font-bold text-slate-300 text-[13px]">
                                    {m.fatalities > 0
                                      ? m.fatalities.toLocaleString()
                                      : "-"}
                                  </td>
                                </tr>
                              ))}
                        </tbody>

                        {/* สรุปรวมด้านล่าง */}
                        <tfoot className="bg-[#f2fafe] border-t border-[#2ab2f4]/30">
                          <tr>
                            <td className="px-6 py-4 font-bold text-[#1f91ce] text-[13px]">
                              รวมทั้งหมด
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-[#1f91ce] text-[14px]">
                              {totalSeasonAffected > 0
                                ? totalSeasonAffected.toLocaleString()
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-slate-400 text-[14px]">
                              {totalSeasonEvacuees > 0
                                ? totalSeasonEvacuees.toLocaleString()
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-red-500 text-[14px] relative">
                              {totalSeasonFatalities > 0
                                ? totalSeasonFatalities.toLocaleString()
                                : "-"}
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
          )}
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
