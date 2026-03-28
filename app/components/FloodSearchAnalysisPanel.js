"use client";

import React, { useMemo, useRef } from "react";
import dynamic from "next/dynamic";

// ใช้ Heroicons หรือ Lucide แทน MUI Icons ได้ แต่ถ้าต้องการประหยัดเวลาผมจะคงการใช้ MUI Icons ไว้
// แต่เปลี่ยนการห่อหุ้ม (Wrapper) ให้เป็น Tailwind แทน
import HubIcon from "@mui/icons-material/Hub";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

const SEASON_MONTHS = {
  Summer: [3, 4, 5],
  Rainy: [6, 7, 8, 9, 10],
  Winter: [11, 12, 1, 2],
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

export default function FloodSearchAnalysisPanel({
  province,
  year,
  season,
  initialData = [],
  initialRules = [],
}) {
  const fgRef = useRef(null);
  const data = initialData;
  const rulesArray = Array.isArray(initialRules) ? initialRules : [];

  const activeSeason = `${year}_${season}`;

  const currentRules = useMemo(() => {
    let rules = rulesArray.filter(
      (r) => r.Province === province && r.Season === activeSeason,
    );
    rules.sort((a, b) => b.lift - a.lift);
    return rules;
  }, [province, activeSeason, rulesArray]);

  const topRule = currentRules[0];

  const kpis = useMemo(() => {
    if (currentRules.length === 0) return { total: 0, maxLift: 0, avgConf: 0 };
    const sumConf = currentRules.reduce(
      (acc, curr) => acc + curr.confidence,
      0,
    );
    return {
      total: currentRules.length,
      maxLift: parseFloat(currentRules[0].lift.toFixed(2)),
      avgConf: parseFloat(((sumConf / currentRules.length) * 100).toFixed(1)),
    };
  }, [currentRules]);

  const { topKeyword } = useMemo(() => {
    if (!data || data.length === 0) return { topKeyword: null };
    return { topKeyword: null };
  }, [data, province, year, season]);

  const graphData = useMemo(() => {
    const nodesMap = new Map();
    const links = [];
    const maxRules = Math.min(currentRules.length, 15);

    for (let i = 0; i < maxRules; i++) {
      const rule = currentRules[i];
      rule.antecedents.forEach((ant) => {
        const antLabel = translateWord(ant);
        if (!nodesMap.has(antLabel))
          nodesMap.set(antLabel, { id: antLabel, group: "cause", val: 3 });
        rule.consequents.forEach((con) => {
          const conLabel = translateWord(con);
          if (!nodesMap.has(conLabel))
            nodesMap.set(conLabel, { id: conLabel, group: "effect", val: 3 });
          links.push({ source: antLabel, target: conLabel, lift: rule.lift });
        });
      });
    }
    return { nodes: Array.from(nodesMap.values()), links };
  }, [currentRules]);

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* ── KPI Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
    { label: "จำนวนความสัมพันธ์จากเหตุการณ์ที่พบ", val: kpis.total, unit: "รูปแบบ", color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
    { label: "ค่าสัมพันธ์สูงสุด (Lift)", val: kpis.maxLift, unit: "เท่า", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
    { label: "ความเชื่อมั่นเฉลี่ย (Confident)", val: kpis.avgConf, unit: "%", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
        ].map((item, i) => (
          <div
            key={i}
            className={`${item.bg} ${item.border} border-2 p-6 rounded-[2rem] shadow-sm transition-transform  duration-300`}
          >
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
        ))}
      </div>

      {/* ── Graph Section ── */}
      <div className="w-full">
        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl shadow-slate-900/5 transition-all">
          {/* Graph Header */}
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
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                  คำค้นหาตั้งต้น
                </span>
              </div>
              <div className="flex items-center gap-2 border-l pl-4 border-slate-200">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                  คำค้นหาที่ตามมา
                </span>
              </div>
            </div>
          </div>

          {/* Graph Area */}
          <div className="h-[450px] bg-[#fafcff] flex justify-center items-center relative overflow-hidden">
            {currentRules.length > 0 ? (
              <div className="cursor-grab active:cursor-grabbing">
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
                <div className="p-6 bg-slate-50 rounded-full border-2 border-dashed border-slate-200">
                  <HubIcon className="text-6xl opacity-30" />
                </div>
                <p className="font-bold text-slate-400">
                  ไม่พบข้อมูลความสัมพันธ์ในช่วงเวลานี้
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Insight Section ── */}
      {currentRules.length > 0 && topRule && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Insight Card */}
          {/* Left Insight Card */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex-grow rounded-[2rem] overflow-hidden border border-orange-200 shadow-xl shadow-orange-500/5 bg-white flex flex-col">
              <div className="px-6 py-4 bg-gradient-to-br from-orange-600 to-orange-500 flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-white/20 flex text-white backdrop-blur-sm">
                  <EmojiObjectsIcon fontSize="small" />
                </div>
                <h3 className="text-white font-bold tracking-wide text-[15px]">
                  พฤติกรรมที่เด่นชัดที่สุด
                </h3>
              </div>
              <div className="p-6 lg:p-8 bg-gradient-to-b from-orange-50/50 to-white flex-grow">
                <div className="space-y-6">
                  {/* ปรับขนาดตัวอักษรลงเป็น text-[14px] lg:text-[15px] */}
                  <p className="text-[14px] lg:text-[15px] leading-relaxed text-slate-700 font-medium">
                    เมื่อมีการค้นหา{" "}
                    <span className="font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md mx-1">
                      {topRule.antecedents.map(translateWord).join(" + ")}
                    </span>
                    มักจะตามด้วยการค้นหา{" "}
                    <span className="font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-md mx-1">
                      {topRule.consequents.map(translateWord).join(" + ")}
                    </span>
                  </p>
                  {/* กล่องหมายเหตุแบบเส้นประ (บังคับรหัสสีส้มเพื่อแก้ปัญหาสีดำ) */}
                  <div
                    className="mt-5 p-5 rounded-2xl border-2 border-dashed bg-orange-50"
                    style={{ borderColor: "#fdba74" }}
                  >
                    <p className="text-orange-500 font-bold text-[15px] lg:text-[16px] mb-1.5">
                      ค่าความแม่นยำ (Confidence):{" "}
                      {(topRule.confidence * 100).toFixed(1)}%
                    </p>
                    <p className="text-orange-400 font-medium text-[14px] lg:text-[15px]">
                      พฤติกรรมนี้เกิดขึ้นบ่อยกว่าปกติ {topRule.lift.toFixed(2)}{" "}
                      เท่า (Lift)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right Rankings Card */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl shadow-slate-900/5">
              <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-50 flex text-sky-600">
                    <ShowChartIcon fontSize="small" />
                  </div>
                  <h3 className="text-slate-800 font-bold text-lg">
                    5 อันดับพฤติกรรมการค้นหาที่มีความสัมพันธ์กันมากที่สุด
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
                  .map((rule, i) => (
                    <div
                      key={i}
                      className="group p-5 rounded-3xl bg-slate-50 border border-slate-100  transition-all duration-300 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400">
                          {i + 1}
                        </div>
                        <span className="px-3 py-1.5 bg-white text-orange-700 rounded-xl text-xs font-bold border border-orange-100 shadow-sm">
                          {rule.antecedents.map(translateWord).join(" + ")}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                          <ArrowBackIcon
                            className="text-slate-500 rotate-180"
                            sx={{ fontSize: 14 }}
                          />
                        </div>
                        <span className="px-3 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-200">
                          {rule.consequents.map(translateWord).join(" + ")}
                        </span>
                      </div>
                      <div className="text-right pl-4 shrink-0 border-l border-slate-200">
                        <div className="flex flex-col items-end">
                          <span className="text-green-600 font-black text-lg">
                            {(rule.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            ค่าความแม่นยำ
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

      {/* ── Help Section ── */}
      <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-200 text-slate-600 shadow-sm relative overflow-hidden group">
        {/* Decorative BG for Help Section */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/80 blur-[60px] rounded-full -mr-20 -mt-20 group-hover:bg-white transition-colors duration-500" />

        <div className="flex flex-col md:flex-row gap-6 relative z-10">
          <div className="p-3 rounded-2xl bg-white flex h-fit text-sky-500 border border-slate-200 shadow-sm">
            <InfoOutlinedIcon />
          </div>
          <div className="space-y-4">
            <h4 className="text-slate-800 font-black text-lg">
              คำอธิบายค่าความสัมพันธ์ (Association Rules)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <span className="text-sky-600 font-bold text-sm flex items-center gap-2">
                  Confidence (ความแม่นยำ)
                </span>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  ค่าความน่าจะเป็นที่บอกว่า "เมื่อเกิดพฤติกรรมค้นหาคำแรกแล้ว
                  จะมีการค้นหาคำที่สองตามมา"ยิ่งตัวเลขเข้าใกล้ 100%
                  ยิ่งแสดงว่ามักจะเกิดขึ้นตามกันเสมอ
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-orange-600 font-bold text-sm flex items-center gap-2">
                  Lift (ความสัมพันธ์เชิงลึก)
                </span>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                  ค่าตัวเลขที่ชี้วัดว่า
                  "พฤติกรรมทั้งสองเกิดขึ้นร่วมกันบ่อยกว่าความบังเอิญ"หากมีค่ามากกว่า
                  1 แปลว่พฤติกการค้นหาามีความเกี่ยวข้องกัน ยิ่งค่าตัวเลขนี้สูง
                  พฤติกรรมทั้งสองยิ่งดึงดูดกันอย่างมีนัยสำคัญ
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
