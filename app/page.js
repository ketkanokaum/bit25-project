import { Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import LiveClock from '@/components/LiveClock';
import ForecastDisplay from '@/components/ForecastDisplay';
import { getAllForecastData } from '@/lib/data/forecast';

export const revalidate = 600;

async function ForecastSection() {
  const { forecastRows, actualRows } = await getAllForecastData();

  let initialProvince = null;

  for (let i = 0; i < forecastRows.length; i++) {
    const province = forecastRows[i].province;

    if (province === 'ขอนแก่น') {
      initialProvince = 'ขอนแก่น';
      break;
    }

    if (initialProvince === null) {
      initialProvince = province;
    }
  }

  if (forecastRows.length === 0) {
    return <ForecastUnavailable />;
  }

  return (
    <ForecastDisplay
      initialProvince={initialProvince}
      forecastRows={forecastRows}
      actualRows={actualRows}
    />
  );
}

function ForecastUnavailable() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center gap-3 min-h-[260px] text-center">
      <p className="m-0 text-base font-bold text-slate-700">
        ขณะนี้ยังเรียกค่าพยากรณ์จากแบบจำลองไม่ได้
      </p>
      <p className="m-0 text-sm font-semibold text-slate-500">
        ระบบจะลองเรียกใหม่โดยอัตโนมัติภายใน 30 วินาที
      </p>
      <Link
        href="/"
        prefetch={false}
        className="mt-2 px-4 py-2 rounded-xl bg-sky-700 text-white text-sm font-bold hover:bg-sky-800"
      >
        ลองใหม่อีกครั้ง
      </Link>
    </div>
  );
}

function ForecastSectionSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-14 bg-sky-700" />
        <div className="px-5 py-6 flex flex-col gap-4">
          <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
          <div className="h-12 bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />
          <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-12 bg-slate-50 border border-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center gap-3 min-h-[260px]">
        <div className="w-10 h-10 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
        <p className="m-0 text-sm font-bold text-slate-500">
          กำลังเรียกค่าพยากรณ์จากแบบจำลอง...
        </p>
      </div>
    </div>
  );
}

export default function ForecastPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">

        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            ปริมาณน้ำฝนล่วงหน้า
          </h1>

          <p className="text-slate-500 text-[15px]">
            รายจังหวัดในประเทศไทย
          </p>

          <LiveClock />
        </div>

        <Suspense fallback={<ForecastSectionSkeleton />}>
          <ForecastSection />
        </Suspense>

      </div>
    </div>
  );
}
