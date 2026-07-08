// app/rainfall/page.js  ← ลบ 'use client' ออก
import Navbar from '../components/Navbar';
import RainfallTable from '../components/RainfallTable';
import { getRainfallWithImpact } from '@/lib/data/rainfall'; // ← เรียกตรงๆ ไม่ผ่าน fetch

export default async function RainfallPage() {
const data = await getRainfallWithImpact();
  return (
    <div className="min-h-screen pb-24 md:pb-0 font-sans" style={{ backgroundColor: '#e0f2fe' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            ข้อมูลน้ำฝนย้อนหลัง
          </h1>
          <p className="text-slate-500 text-[15px]">
            ปริมาณน้ำฝนรายเดือน รายจังหวัด ตั้งแต่ปี 2561–2568
          </p>
        </div>
        <RainfallTable data={data} />
      </div>
    </div>
  );
}