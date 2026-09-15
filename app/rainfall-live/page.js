import Navbar from '@/components/Navbar';
import LiveRainfallTable from '@/components/LiveRainfallTable';

import { getLiveRainfallByProvince } from '@/lib/data/live-rainfall';

export default async function RainfallLivePage() {
  const data = await getLiveRainfallByProvince();

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight leading-tight">
            ฝนตกจริงวันนี้
          </h1>
          <p className="text-slate-500 text-[15px]">
            ปริมาณฝนจากสถานีตรวจวัดจริงทั่วประเทศ รายจังหวัด แบบเรียลไทม์
          </p>
        </div>

        <LiveRainfallTable data={data} />
      </div>
    </div>
  );
}
