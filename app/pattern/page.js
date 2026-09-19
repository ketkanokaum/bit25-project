import Navbar from '@/components/Navbar';
import FloodSearchPatterns from '@/components/FloodSearchPatterns';

import { getRainfallData } from '@/lib/data/rainfall';
import { getFloodData, getFloodEventDetails } from '@/lib/data/flood';
import { getAssociationRules } from '@/lib/data/rules';
import { getSearchTrends } from '@/lib/data/trends';


// สร้าง key จาก จังหวัด + ปี + เดือน
function makeKey(item) {
  return `${item.province}_${item.year}_${item.month}`;
}


// เปลี่ยน array ให้ค้นหาข้อมูลด้วย key ได้ง่าย
function createLookup(list) {
  const lookup = {};

  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const key = makeKey(item);

    lookup[key] = item;
  }

  return lookup;
}


export default async function PatternPage() {

  // ดึงข้อมูลทั้งหมดพร้อมกัน
  const [rainfallList,floodList,rulesData,trendsList,floodEventDetails,
  ] = await Promise.all([
    getRainfallData(),getFloodData(),getAssociationRules(),
    getSearchTrends(),getFloodEventDetails(),
  ]);


  // เตรียมข้อมูลสำหรับค้นหาด้วย จังหวัด + ปี + เดือน
  const floodByKey = createLookup(floodList);
  const trendByKey = createLookup(trendsList);


  // รวม Rainfall + Flood + Google Trends
  const combinedData = [];

  for (let i = 0; i < rainfallList.length; i++) {
    const rain = rainfallList[i];
    const key = makeKey(rain);

    const flood = floodByKey[key] || {};
    const trend = trendByKey[key] || {};

    combinedData.push({
      ...rain,

      // ข้อมูลอุทกภัย
      affected_people: flood.total_affected ?? null,
      fatalities: flood.total_fatalities ?? null,
      evacuees: flood.total_evacuees ?? null,
      date: flood.flood_date ?? null,

      // Google Trends
      search_flood: trend.search_flood ?? null,
      search_rain: trend.search_rain ?? null,
      search_storm: trend.search_storm ?? null,
      search_water_level: trend.search_water_level ?? null,
      search_water_situation: trend.search_water_situation ?? null,
      search_evacuate: trend.search_evacuate ?? null,
    });
  }


  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            ระดับเฝ้าระวังอุทกภัยรายเดือน
          </h1>

          <div className="flex flex-wrap gap-2 mt-1">

            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              สถิติอุทกภัย · 2563–2567
            </span>

            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              ปริมาณน้ำฝน · 2561–2569
            </span>

            <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              Google Trends · 2563–2569
            </span>

          </div>
        </div>


        <FloodSearchPatterns
          initialData={combinedData}
          initialRules={rulesData}
          initialFloodEvents={floodEventDetails}
        />

      </div>
    </div>
  );
}