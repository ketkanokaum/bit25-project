import Navbar from '@/components/Navbar';
import LiveClock from '@/components/LiveClock';
import ForecastDisplay from '@/components/ForecastDisplay';
import { getAllForecastData } from '@/lib/data/forecast';

export const revalidate = 600;

export default async function ForecastPage() {
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

        <ForecastDisplay
          initialProvince={initialProvince}
          forecastRows={forecastRows}
          actualRows={actualRows}
        />

      </div>
    </div>
  );
}
