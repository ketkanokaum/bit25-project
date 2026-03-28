import Link from "next/link";
import { getRainfallWithImpact } from "@/lib/data/rainfall";
import RainfallTable from "./components/RainfallTable";

export default async function Page({ searchParams }) {
  const resolvedParams = await searchParams;
  const rainfall = await getRainfallWithImpact(
    resolvedParams?.year,
    resolvedParams?.month,
    resolvedParams?.province,
  );

  const iconWrapCls =
    "p-2 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-sm flex-shrink-0";
  const IconDrop = () => (
    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z" />
    </svg>
  );
  return (
    <main
      className="min-h-screen pb-16 font-sans selection:bg-sky-400 selection:text-white"
      style={{ backgroundColor: "#e0f2fe" }}
    >
      <header style={{ backgroundColor: "#e0f2fe" }}>
        <div className="w-full px-4 lg:px-6 pt-6 pb-6 flex flex-col gap-5">
          <div className="flex items-center gap-5 min-w-0 w-full">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-300/50">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-800 text-2xl md:text-3xl leading-tight tracking-tight">
                สถิติปริมาณน้ำฝนรายจังหวัด
              </h1>

              <p className="text-sm md:text-base text-slate-500 font-medium m-0 mt-1">
                ข้อมูลปริมาณน้ำฝนรายจังหวัดแยกตามช่วงเวลา
              </p>
            </div>
          </div>
          <div className="flex justify-end w-full">
            <Link
              href="/association_rule"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg bg-sky-500 text-white shadow-sky-200 "
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              <span>ปริมาณน้ำฝนและแนวโน้มการสืบค้น</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="w-full px-4 lg:px-6 pt-2 pb-12 flex flex-col gap-5">
        {/* ตารางและตัวกรอง */}
        <RainfallTable data={rainfall} />
      </section>
    </main>
  );
}
