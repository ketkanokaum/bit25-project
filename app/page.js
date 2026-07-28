// app/page.jsx — หน้าปริมาณน้ำฝนล่วงหน้า (หน้าแรก)
// ── Mockup: แสดงตัวอย่าง UI รอโมเดลเสร็จ ──
'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

// ── ข้อมูลจำลองสำหรับ mockup ──
const MOCK_PROVINCES = [
  'ขอนแก่น', 'มหาสารคาม', 'กาฬสินธุ์', 'ร้อยเอ็ด',
  'เชียงใหม่', 'เชียงราย', 'กรุงเทพมหานคร', 'นครราชสีมา',
  'อุบลราชธานี', 'นครศรีธรรมราช', 'สงขลา', 'ชลบุรี',
];

const MOCK_FORECAST = {
  province: 'ขอนแก่น',
  month: 'สิงหาคม',
  year: 2568,
  predicted_rain: 187.4,
  baseline_mean: 152.3,
  model: 'Auto ARIMA',
  status: 'สูงกว่าปกติ',
  statusColor: 'orange',
};

// ── สีตามสถานะ ──
function getStatusStyle(status) {
  if (status === 'สูงกว่าปกติมาก') {
    return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700' };
  }
  if (status === 'สูงกว่าปกติ') {
    return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' };
  }
  if (status === 'ใกล้เคียงปกติ') {
    return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' };
  }
  if (status === 'ต่ำกว่าปกติ') {
    return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700' };
  }
  return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' };
}

export default function ForecastPage() {
  const [selectedProvince, setSelectedProvince] = useState('ขอนแก่น');
  const forecast = { ...MOCK_FORECAST, province: selectedProvince };
  const style = getStatusStyle(forecast.status);

  // 🛠️ แก้ไข Hydration Mismatch สำหรับนาฬิกา Real-time
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    // เอาสีพื้นหลังฟ้าออก ให้ globals.css คุมที่เดียว
    // เอา pb-24 ออกด้วย เพราะ navbar ไม่มีแถบเมนูล่างแล้ว
    <div className="min-h-screen font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">

        {/* ── หัวข้อหน้าเว็บ ── */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            ปริมาณน้ำฝนล่วงหน้า 1 เดือน
          </h1>
          <p className="text-slate-500 text-[15px]">
            รายจังหวัดในประเทศไทย
          </p>

          <p className="text-sm text-slate-500 min-h-[20px]" suppressHydrationWarning>
            {time ? time.toLocaleString("th-TH", {
              dateStyle: "full",
              timeStyle: "medium",
              timeZone: "Asia/Bangkok",
            }) : ''}
          </p>
        </div>

        {/* แจ้งว่ายังเป็นตัวอย่าง ป้องกันการเข้าใจผิดว่าเป็นผลจริง */}
        <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold">
          หน้านี้เป็นตัวอย่างการแสดงผล ยังไม่ได้เชื่อมต่อกับแบบจำลองจริง
          ตัวเลขที่เห็นเป็นข้อมูลสมมติสำหรับทดสอบหน้าจอ
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-3.5 bg-sky-700">
      <div className="p-2 rounded-lg bg-white/15 flex items-center justify-center shadow-sm flex-shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        </svg>
      </div>
      <h2 className="text-white font-bold text-sm">เลือกจังหวัดที่ต้องการ</h2>
    </div>
          <div className="px-5 py-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 transition-all focus-within:bg-white focus-within:border-sky-500 focus-within:ring-2 ring-sky-100">
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="flex-1 bg-transparent py-3 text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer"
              >
                {MOCK_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div className="pointer-events-none text-slate-400 ml-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ── ผลพยากรณ์ ── */}
        <div className={`rounded-2xl border shadow-sm overflow-hidden ${style.border}`}>
          <div className={`px-6 py-5 ${style.bg}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  ปริมาณน้ำฝนที่คาดการณ์ เดือน{forecast.month} {forecast.year}
                </p>
                <p className="text-[42px] font-black text-slate-800 leading-none">
                  {forecast.predicted_rain}
                  <span className="text-[18px] font-bold text-slate-400 ml-1">มม.</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${style.badge}`}>
                    {forecast.status}
                  </span>
                  <span className="text-[12px] text-slate-400">เมื่อเทียบกับค่าเฉลี่ยย้อนหลัง 30 ปี</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── คำอธิบาย ── */}
          <div className="px-6 py-4 bg-white">
            <p className="text-[13px] text-slate-600 leading-[1.8]">
              จังหวัด <strong className="text-slate-800">{forecast.province}</strong> คาดว่าเดือน{forecast.month} {forecast.year} จะมีปริมาณน้ำฝนประมาณ <strong className="text-slate-800">{forecast.predicted_rain} มม.</strong> ซึ่ง{forecast.status}จากค่าเฉลี่ย 30 ปีที่ {forecast.baseline_mean} มม.
            </p>
            <p className="text-[11px] text-slate-400 mt-3 flex gap-1.5 items-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              พยากรณ์โดยแบบจำลอง {forecast.model} · ข้อมูลฝนจาก สสน. · ค่าเฉลี่ย 30 ปี (2534–2563)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}