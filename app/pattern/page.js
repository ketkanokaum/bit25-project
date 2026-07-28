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

  
  const floodMap = new Map(floodList.map(item => [`${item.province}_${item.year}_${item.month}`, item]));
  const trendsMap = new Map(trendsList.map(item => [`${item.province}_${item.year}_${item.month}`, item]));

  const combinedData = rainfallList.map((rain) => {
    const key = `${rain.province}_${rain.year}_${rain.month}`;
    const flood = floodMap.get(key) || {};
    const trend = trendsMap.get(key) || {};

    return {
      ...rain,
      affected_people: flood.total_affected || 0,
      fatalities: flood.total_fatalities || 0,
      evacuees: flood.total_evacuees || 0,
      date: flood.flood_date || null,
      search_flood: trend.search_flood || 0,
      search_rain: trend.search_rain || 0,
      search_storm: trend.search_storm || 0,
      search_water_level: trend.search_water_level || 0,
      search_water_situation: trend.search_water_situation || 0,
      search_evacuate: trend.search_evacuate || 0,
    };
  });

  return (
    <div className="min-h-screen pb-24 md:pb-0 font-sans" style={{ backgroundColor: '#e0f2fe' }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            พฤติกรรมการค้นหา
          </h1>
          <p className="text-slate-500 text-[15px]">
            รูปแบบพฤติกรรมการค้นหาข้อมูลจาก Google Trends ปี 2561–2569
                      </p>
        </div>

        <FloodSearchPatterns 
          initialData={combinedData} 
          initialRules={rulesData} 

        />
      </div>
    </div>
  );
}