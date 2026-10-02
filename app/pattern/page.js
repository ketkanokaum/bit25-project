

import Navbar from '@/components/Navbar';
import FloodSearchPatterns from '@/components/FloodSearchPatterns';

import { getCombinedPatternData } from '@/lib/data/pattern';
import { getAssociationRules } from '@/lib/data/rules';

export const dynamic = 'force-dynamic';

export default async function PatternPage() {
  // ดึงข้อมูล 2 ก้อนหลักที่ประมวลผลเสร็จแล้วจาก TiDB
  const [combinedData, rulesData] = await Promise.all([
    getCombinedPatternData(),
    getAssociationRules(),
  ]);

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
        
        />

      </div>
    </div>
  );
}