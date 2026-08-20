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

  const floodByKey = {};
  for (let i = 0; i < floodList.length; i++) {
    const item = floodList[i];
    const key = `${item.province}_${item.year}_${item.month}`;
    floodByKey[key] = item;
  }

  const trendByKey = {};
  for (let i = 0; i < trendsList.length; i++) {
    const item = trendsList[i];
    const key = `${item.province}_${item.year}_${item.month}`;
    trendByKey[key] = item;
  }

  // ใช้ ?? แทน || เพราะ "ไม่มีข้อมูล" (เช่น Google Trends ปี 2569 ที่ยังไม่มี)
  // ต้องแสดงเป็น null ไม่ใช่ 0 (0 แปลว่า "ค้นหา 0 ครั้ง" ซึ่งเป็นคนละความหมายกัน)
  const combinedData = [];
  for (let i = 0; i < rainfallList.length; i++) {
    const rain = rainfallList[i];
    const key = `${rain.province}_${rain.year}_${rain.month}`;
    const flood = floodByKey[key] || {};
    const trend = trendByKey[key] || {};

    combinedData.push({
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
    });
  }

  return (
    <div className="min-h-screen font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            ความเสี่ยงอุทกภัยรายเดือน
          </h1>

          <div className="flex flex-wrap gap-2 mt-1">
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              สถิติอุทกภัย · 2563–2567
            </span>
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              ปริมาณน้ำฝน · 2561–2569
            </span>
            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              Google Trends · 2561–2569
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
