import Navbar from '@/components/Navbar';
import LiveClock from '@/components/LiveClock';
import ForecastDisplay from '@/components/ForecastDisplay';
import { getAllForecastData } from '@/lib/data/forecast';

export default async function ForecastPage() {
  const { forecastRows, actualRows } = await getAllForecastData();

  const availableProvinces = [];
  for (let i = 0; i < forecastRows.length; i++) {
    const province = forecastRows[i].province;
    if (!availableProvinces.includes(province)) {
      availableProvinces.push(province);
    }
  }

  let initialProvince = null;
  if (availableProvinces.includes('ขอนแก่น')) {
    initialProvince = 'ขอนแก่น';
  } else if (availableProvinces.length > 0) {
    initialProvince = availableProvinces[0];
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
