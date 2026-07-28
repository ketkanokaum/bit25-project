// app/pattern/page.js
import Navbar from '@/components/Navbar';

import FloodSearchPatterns from '@/components/FloodSearchPatterns';

import { getRainfallData } from '@/lib/data/rainfall';
import { getFloodData } from '@/lib/data/flood';
import { getAssociationRules } from '@/lib/data/rules';
import { getSearchTrends } from '@/lib/data/trends';


export default async function PatternPage() {

  const [rainfallList, floodList, rulesData, trendsList] = await Promise.all([
    getRainfallData(),
    getFloodData(),
    getAssociationRules(),
    getSearchTrends(),
  ]);


  // สมมติว่า getFloodData() รวมยอดมาแล้วเป็น 1 แถวต่อ (จังหวัด, ปี, เดือน)
  // ถ้าคืนมาเป็นรายเหตุการณ์ Map จะเก็บแค่แถวสุดท้าย ต้องรวมยอดก่อน
  const floodMap = new Map(floodList.map(item => [`${item.province}_${item.year}_${item.month}`, item]));
  const trendsMap = new Map(trendsList.map(item => [`${item.province}_${item.year}_${item.month}`, item]));

  const combinedData = rainfallList.map((rain) => {
    const key = `${rain.province}_${rain.year}_${rain.month}`;
    const flood = floodMap.get(key) || {};
    const trend = trendsMap.get(key) || {};

    // ใช้ ?? แทน || เพื่อไม่ให้ "ไม่มีข้อมูล" กลายเป็น 0
    // สำคัญกับปี 2569 ที่ยังไม่มีข้อมูล Google Trends เลย
    // ถ้าใช้ || 0 จะดูเหมือนคนไม่ค้นหาอะไรเลย ซึ่งคนละความหมายกับไม่มีข้อมูล
    return {
      ...rain,
      affected_people: flood.total_affected ?? null,
      fatalities: flood.total_fatalities ?? null,
      evacuees: flood.total_evacuees ?? null,
      date: flood.flood_date ?? null,
      search_flood: trend.search_flood ?? null,
      search_rain: trend.search_rain ?? null,
      search_storm: trend.search_storm ?? null,
      search_water_level: trend.search_water_level ?? null,
      search_water_situation: trend.search_water_situation ?? null,
      search_evacuate: trend.search_evacuate ?? null,
    };
  });

  return (
    <div className="min-h-screen font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            ความเสี่ยงอุทกภัยรายเดือน
          </h1>
          <p className="text-slate-500 text-[15px] leading-relaxed">
            ประเมินโอกาสเกิดอุทกภัยของแต่ละจังหวัด โดยเทียบรูปแบบของเดือนที่เลือก
            กับเดือนเดียวกันในปีที่มีสถิติยืนยันแล้ว
          </p>

          {/* บอกแหล่งข้อมูลและช่วงปี เพราะแต่ละแหล่งครอบคลุมไม่เท่ากัน */}
          <div className="flex flex-wrap gap-2 mt-1">
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              สถิติอุทกภัย · 2563–2567
            </span>
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              ปริมาณน้ำฝน · 2561–2569
            </span>
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              Google Trends · 2561–2568
            </span>
          </div>
        </div>

        <FloodSearchPatterns
          initialData={combinedData}
          initialRules={rulesData}
        />
      </div>
    </div>
  );
}