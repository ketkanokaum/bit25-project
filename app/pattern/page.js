import Navbar from '@/components/Navbar';
import FloodSearchPatterns from '@/components/FloodSearchPatterns';

import { getProvincePatternData, getPatternBoundaries } from '@/lib/data/pattern';

// โหลดข้อมูลเฉพาะจังหวัดเริ่มต้นตอนเปิดหน้า ส่วนจังหวัดอื่นดึงเพิ่มทีหลังตอนผู้ใช้เลือก (ผ่าน /api/pattern)
// ทำให้ขนาดข้อมูลต่อการเข้าหน้าเล็กลงมาก จึงแคชเป็นหน้า ISR ได้ตามปกติ ไม่ต้อง force-dynamic แบบเดิม
export const revalidate = 600;

const DEFAULT_PROVINCE = 'ขอนแก่น';

export default async function PatternPage() {

  const [boundaries, provinceData] = await Promise.all([
    getPatternBoundaries(),
    getProvincePatternData(DEFAULT_PROVINCE),
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
          initialProvince={DEFAULT_PROVINCE}
          initialData={provinceData.data}
          initialRules={provinceData.rules}
          initialFloodEvents={provinceData.floodEvents}
          boundaries={boundaries}
        />

      </div>
    </div>
  );
}

